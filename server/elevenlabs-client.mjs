// Server-only adapter. Never bundle this module or .env.local into the browser.
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

export const AGENT_ID = 'agent_6901m72w71fwf7fs1x6yjzeavnqd';
export const BRANCH_ID = 'agtbrch_9401m72w71fxet9t1nsf6vfc3sev';

export function createElevenLabsClient() {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('Load the server environment before connecting to ElevenLabs');
  }
  return new ElevenLabsClient();
}

export function learnerVariables(name) {
  if (typeof name !== 'string') throw new TypeError('Enter a name');
  const clean = name.normalize('NFC').trim().replace(/\s+/gu, ' ');
  if (!clean || [...clean].length > 60 || !/^[\p{L}\p{M} .’'\-]+$/u.test(clean)) {
    throw new TypeError('Enter a name of up to 60 letters');
  }
  return { user_name: clean };
}

// Read-only configuration check: this does not start or simulate a conversation.
export async function inspectTutor(client = createElevenLabsClient()) {
  const agent = await client.conversationalAi.agents.get(AGENT_ID, { branchId: BRANCH_ID });
  const config = agent.conversationConfig;
  return {
    agentId: agent.agentId,
    name: agent.name,
    language: config?.agent?.language,
    maxDurationSeconds: config?.conversation?.maxDurationSeconds,
    expressiveMode: config?.tts?.expressiveMode,
    knowledgeDocuments: (config?.agent?.prompt?.knowledgeBase ?? []).map(doc => ({
      name: doc.name, usageMode: doc.usageMode,
    })),
    // Counts only; do not output tool credentials, prompts, or private history.
    workflowNodeCount: Object.keys(agent.workflow?.nodes ?? {}).length,
  };
}

// Integration primitive only: do not expose as an unauthenticated public endpoint.
// Admission/budget controls must run on the server before calling this function.
// A name personalizes the greeting; it is not proof of a learner's identity.
export async function prepareTutorSession(name, client = createElevenLabsClient()) {
  const dynamicVariables = learnerVariables(name);
  const access = await client.conversationalAi.conversations.getSignedUrl({
    agentId: AGENT_ID,
    branchId: BRANCH_ID,
    includeConversationId: true,
  });
  const url = new URL(access.signedUrl);
  if (url.protocol !== 'wss:' || url.hostname !== 'api.elevenlabs.io' ||
      url.port || url.username || url.password || url.pathname !== '/v1/convai/conversation') {
    throw new Error('Unexpected ElevenLabs connection endpoint');
  }
  // The browser SDK receives this short-lived access, never the account API key.
  return { signedUrl: access.signedUrl, dynamicVariables };
}
