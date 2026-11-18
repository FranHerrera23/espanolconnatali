import { createElevenLabsClient } from './elevenlabs-client.mjs';
import { slotSeconds } from './pilot-state.mjs';
import { safeAgent } from './tutor-safety.mjs';

export function pilotProvider() {
  const agentId = process.env.TUTOR_PILOT_AGENT_ID;
  const branchId = process.env.TUTOR_PILOT_BRANCH_ID;
  const versionId = process.env.TUTOR_PILOT_VERSION_ID;
  if (!agentId || !versionId) throw new Error('Pilot version is missing');
  const client = createElevenLabsClient();
  return {
    async sign(internal) {
      const [plan, agent] = await Promise.all([
        client.user.subscription.get(), client.conversationalAi.agents.get(agentId, { branchId, versionId }),
      ]);
      if ((!internal && (plan.tier === 'free' || process.env.TUTOR_PILOT_INVITES_READY !== 'true')) || plan.maxCreditLimitExtension !== 0 || plan.allowedToExtendCharacterLimit === true) {
        throw new Error('Pilot voice capacity is not authorized');
      }
      const privacy = agent.platformSettings?.privacy;
      if (!internal && (privacy?.recordVoice !== false || !(privacy.retentionDays >= 0 && privacy.retentionDays <= 7))) {
        throw new Error('Pilot retention is not ready for learners');
      }
      if (!safeAgent(agent) || agent.versionId !== versionId || agent.conversationConfig?.conversation?.maxDurationSeconds !== slotSeconds ||
          agent.platformSettings?.overrides?.conversationConfigOverride?.conversation?.maxDurationSeconds === true ||
          agent.platformSettings?.callLimits?.burstingEnabled === true) throw new Error('Pilot agent is not ready');
      const { signedUrl } = await client.conversationalAi.conversations.getSignedUrl({ agentId: agentId, branchId, versionId, includeConversationId: true });
      const url = new URL(signedUrl);
      const conversationId = url.searchParams.get('conversation_id');
      if (url.origin !== 'wss://api.elevenlabs.io' || url.pathname !== '/v1/convai/conversation' || url.username || url.password ||
          !url.searchParams.has('conversation_signature') || !conversationId) throw new Error('Invalid provider signature');
      return { signedUrl, conversationId };
    },
    async get(conversationId) {
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
