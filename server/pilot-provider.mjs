import { createHash } from 'node:crypto';
import { createElevenLabsClient } from './elevenlabs-client.mjs';
import { slotSeconds } from './pilot-state.mjs';
import { safeAgent } from './tutor-safety.mjs';
import { pilotPrompt, voiceSpeed } from './pilot-knowledge.mjs';

const knowledgeRevision = createHash('sha256').update(JSON.stringify([pilotPrompt, voiceSpeed])).digest('hex').slice(0, 12);
const configuredTargets = new Map();

export function pilotProvider() {
  const agentId = process.env.TUTOR_PILOT_AGENT_ID;
  if (!agentId || !process.env.TUTOR_PILOT_VERSION_ID) throw new Error('Pilot version is missing');
  const client = createElevenLabsClient();
  function target(seconds) {
    if (![450, 900].includes(seconds)) throw new Error('Unknown pilot duration');
    const branchId = seconds === 900 ? process.env.TUTOR_PILOT_MARINA_BRANCH_ID : process.env.TUTOR_PILOT_BRANCH_ID;
    const versionId = seconds === 900 ? process.env.TUTOR_PILOT_MARINA_VERSION_ID : process.env.TUTOR_PILOT_VERSION_ID;
    if (!branchId || !versionId) throw new Error('Missing pilot duration target');
    return { branchId, versionId };
  }
  async function configuredTarget(base, limit) {
    const baseRevision = createHash('sha256').update(base.versionId).digest('hex').slice(0, 10);
    const name = `pilot-${knowledgeRevision}-${baseRevision}-${limit}s`;
    const cacheKey = `${agentId}:${name}`;
    if (configuredTargets.has(cacheKey)) return configuredTargets.get(cacheKey);
    const branches = client.conversationalAi.agents.branches;
    async function find() {
      const list = await branches.list(agentId, { limit: 100, includeArchived: false });
      const matching = list.results.find(branch => branch.name === name);
      if (!matching) return null;
      const branch = await branches.get(agentId, matching.id);
      const versionId = branch.mostRecentVersions?.[0]?.id;
      if (!versionId) throw new Error('Missing pilot knowledge version');
      return { branchId: branch.id, versionId };
    }
    const configured = (async () => {
      const existing = await find();
      if (existing) return existing;
      try {
        const branch = await branches.create(agentId, {
          parentVersionId: base.versionId,
          name,
          description: 'Private pilot with school knowledge and practice duration',
          conversationConfig: {
            conversation: { max_duration_seconds: limit },
            agent: { first_message: '{{pilot_greeting}}', disable_first_message_interruptions: false,
              prompt: { prompt: pilotPrompt, max_tokens: 120 } },
            turn: { turn_timeout: 20, turn_eagerness: 'patient' },
            tts: { speed: voiceSpeed },
          },
        });
        if (!branch.createdBranchId || !branch.createdVersionId) throw new Error('Missing pilot knowledge version');
        return { branchId: branch.createdBranchId, versionId: branch.createdVersionId };
      } catch (error) {
        const createdConcurrently = await find();
        if (createdConcurrently) return createdConcurrently;
        throw error;
      }
    })();
    configuredTargets.set(cacheKey, configured);
    try {
      return await configured;
    } catch (error) {
      configuredTargets.delete(cacheKey);
      throw error;
    }
  }
  return {
    async sign(internal, seconds = slotSeconds, maxSeconds = seconds) {
      const base = target(seconds);
      if (!Number.isInteger(maxSeconds) || maxSeconds < 1 || maxSeconds > seconds) throw new Error('Invalid pilot session limit');
      const plan = await client.user.subscription.get();
      if ((!internal && (plan.tier === 'free' || process.env.TUTOR_PILOT_INVITES_READY !== 'true')) || plan.maxCreditLimitExtension !== 0 || plan.allowedToExtendCharacterLimit === true) {
        throw new Error('Pilot voice capacity is not authorized');
      }
      // The provider rejects caps below a minute. The dashboard still stops at the exact remaining lesson time.
      const providerLimit = Math.max(60, maxSeconds);
      const selected = await configuredTarget(base, providerLimit);
      const { branchId, versionId } = selected;
      const agent = await client.conversationalAi.agents.get(agentId, selected);
      const privacy = agent.platformSettings?.privacy;
      if (!internal && (privacy?.recordVoice !== false || !(privacy.retentionDays >= 0 && privacy.retentionDays <= 7))) {
        throw new Error('Pilot retention is not ready for learners');
      }
      if (!safeAgent(agent) || agent.versionId !== versionId || agent.conversationConfig?.conversation?.maxDurationSeconds !== providerLimit ||
          agent.conversationConfig?.agent?.prompt?.prompt !== pilotPrompt ||
          agent.conversationConfig?.tts?.speed !== voiceSpeed ||
          agent.platformSettings?.overrides?.conversationConfigOverride?.conversation?.maxDurationSeconds === true ||
          agent.platformSettings?.callLimits?.burstingEnabled === true) throw new Error('Pilot agent is not ready');
      const { signedUrl } = await client.conversationalAi.conversations.getSignedUrl({ agentId: agentId, branchId, versionId, includeConversationId: true });
      const url = new URL(signedUrl);
      const conversationId = url.searchParams.get('conversation_id');
      if (url.origin !== 'wss://api.elevenlabs.io' || url.pathname !== '/v1/convai/conversation' || url.username || url.password ||
          !url.searchParams.has('conversation_signature') || !conversationId) throw new Error('Invalid provider signature');
      return { signedUrl, conversationId, branchId, versionId, maxSeconds: providerLimit };
    },
    async get(reservation, seconds = slotSeconds) {
      const { conversationId } = reservation;
      const { branchId, versionId } = reservation.branchId && reservation.versionId ? reservation : target(seconds);
      try {
        const call = await client.conversationalAi.conversations.get(conversationId);
        if (call.conversationId !== conversationId || call.agentId !== agentId || call.branchId !== branchId || call.versionId !== versionId) {
          throw new Error('Pilot conversation does not match the reservation');
        }
        return call;
      } catch (error) {
        if (error.statusCode !== 404) throw error;
        return null;
      }
    },
  };
}
