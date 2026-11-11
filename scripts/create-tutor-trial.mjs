import {open} from 'node:fs/promises';
import {AGENT_ID,BRANCH_ID,createElevenLabsClient,learnerVariables} from '../server/elevenlabs-client.mjs';
import {sessionTarget} from '../server/tutor-safety.mjs';
import {readTrial} from '../private-preview/trial-link.mjs';

const [nameArg,outputPath,fundedMinutes] = process.argv.slice(2);
const requiredMinutes = 15;
if (!nameArg || !outputPath) {
  console.error('Uso: node --env-file=... scripts/create-tutor-trial.mjs NOMBRE ARCHIVO-PRIVADO MINUTOS-RESERVADOS');
  process.exit(2);
}
try {
  const {user_name:name} = learnerVariables(nameArg);
  if ([...name].length > 40) throw new Error('Nombre demasiado largo.');
  const client = createElevenLabsClient();
  const [plan,agent] = await Promise.all([
    client.user.subscription.get(),
    client.conversationalAi.agents.get(AGENT_ID,{branchId:BRANCH_ID})
  ]);
  const balance = plan.characterLimit - plan.characterCount;
  const settings = agent.platformSettings;
  if (plan.tier === 'free') {
    throw new Error(`Free tiene ${balance} créditos disponibles. Se requiere saldo comercial verificado para emitir una prueba completa.`);
  }
  if (plan.maxCreditLimitExtension !== 0 || plan.allowedToExtendCharacterLimit) {
    throw new Error('La facturación automática debe estar desactivada.');
  }
  // Enter this only after checking remaining minutes, LLM funds and auto-reload in the dashboard.
  if (!Number.isFinite(Number(fundedMinutes)) || Number(fundedMinutes) < requiredMinutes) {
    throw new Error('Confirmá la reserva de 15 minutos y saldo de modelo antes de emitir.');
  }
  if (agent.conversationConfig?.conversation?.maxDurationSeconds !== requiredMinutes*60 ||
      settings?.auth?.enableAuth !== true ||
      settings?.overrides?.conversationConfigOverride?.conversation?.maxDurationSeconds === true) {
    throw new Error('Verificá autenticación y límite de 15 minutos del agente publicado.');
  }
  // Use a distinct file per learner to avoid accidental duplicate issuance.
  const output = await open(outputPath,'wx',0o600);
  try {
    const {signedUrl} = await client.conversationalAi.conversations.getSignedUrl(sessionTarget(agent,AGENT_ID,BRANCH_ID));
    const fragment = '#'+new URLSearchParams({invite:JSON.stringify({name,signedUrl})});
    if (!readTrial(fragment)) throw new Error('Falta la credencial apta para un solo uso.');
    await output.writeFile('https://www.espanolconnatali.com/tutor-preview/?trial=1'+fragment+'\n');
  } finally {
    await output.close();
  }
  console.log('Enlace guardado en el archivo privado. Iniciar dentro de 15 minutos de la emisión.');
} catch(error) {
  console.error(error.statusCode ? 'Proveedor: HTTP '+error.statusCode : error.message);
  process.exitCode = 1;
}
