import { randomUUID } from 'node:crypto';
import { createElevenLabsClient } from './elevenlabs-client.mjs';
import { slotSeconds } from './pilot-state.mjs';
import { safeAgent } from './tutor-safety.mjs';

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
  return {
    async sign(internal, seconds = slotSeconds, maxSeconds = seconds) {
      const base = target(seconds);
      if (!Number.isInteger(maxSeconds) || maxSeconds < 1 || maxSeconds > seconds ||
          (maxSeconds !== seconds && seconds !== 900)) throw new Error('Invalid pilot session limit');
      const plan = await client.user.subscription.get();
      if ((!internal && (plan.tier === 'free' || process.env.TUTOR_PILOT_INVITES_READY !== 'true')) || plan.maxCreditLimitExtension !== 0 || plan.allowedToExtendCharacterLimit === true) {
        throw new Error('Pilot voice capacity is not authorized');
      }
      // The provider rejects caps below a minute. The dashboard still stops at the exact remaining lesson time.
      const providerLimit = Math.max(60, maxSeconds);
      let selected = base;
      if (maxSeconds !== seconds) {
        const branch = await client.conversationalAi.agents.branches.create(agentId, {
          parentVersionId: base.versionId,
          name: `pilot-resume-${randomUUID()}`,
          description: 'Private pilot lesson time limit',
          conversationConfig: { conversation: { max_duration_seconds: providerLimit } },
        });
        selected = { branchId: branch.createdBranchId, versionId: branch.createdVersionId };
        if (!selected.branchId || !selected.versionId) throw new Error('Missing pilot resume version');
      }
      const { branchId, versionId } = selected;
      const agent = await client.conversationalAi.agents.get(agentId, selected);
      const privacy = agent.platformSettings?.privacy;
      if (!internal && (privacy?.recordVoice !== false || !(privacy.retentionDays >= 0 && privacy.retentionDays <= 7))) {
        throw new Error('Pilot retention is not ready for learners');
      }
      if (!safeAgent(agent) || agent.versionId !== versionId || agent.conversationConfig?.conversation?.maxDurationSeconds !== providerLimit ||
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
