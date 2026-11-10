import {authorized,privateHeaders,sameOrigin} from '../server/tutor-access.mjs';
import {createElevenLabsClient,learnerVariables,AGENT_ID,BRANCH_ID} from '../server/elevenlabs-client.mjs';
import {safeAgent,freeAccount,topics,sessionTarget} from '../server/tutor-safety.mjs';
export default async function handler(req,res){
 privateHeaders(res);res.setHeader('Content-Type','application/json; charset=utf-8');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'method'});}
 if(!authorized(req))return res.status(401).json({error:'access'});
 if(!sameOrigin(req))return res.status(403).json({error:'origin'});
 let b=req.body;try{if(typeof b==='string'||Buffer.isBuffer(b))b=JSON.parse(b.toString());}catch{return res.status(400).json({error:'input'});}
 let variables;try{variables=learnerVariables(b?.name);}catch{return res.status(400).json({error:'name'});}
 if(!Object.hasOwn(topics,b?.topic)||!['ru','es'].includes(b?.language))return res.status(400).json({error:'input'});
 if(!process.env.ELEVENLABS_API_KEY)return res.status(503).json({error:'not_ready'});
 try{
  const client=createElevenLabsClient();
  const sub=await client.user.subscription.get();
  if(!freeAccount(sub))return res.status(503).json({error:'free_account_required'});
  const a=await client.conversationalAi.agents.get(AGENT_ID,{branchId:BRANCH_ID,includeDraft:false});
  if(!safeAgent(a))return res.status(503).json({error:'safety_not_ready'});
  // Read only the published branch. Pin a version when the API supplies one; null is valid on some branch reads.
  const signed=await client.conversationalAi.conversations.getSignedUrl(sessionTarget(a,AGENT_ID,BRANCH_ID));
  const u=new URL(signed.signedUrl);
  if(u.protocol!=='wss:'||u.hostname!=='api.elevenlabs.io'||u.pathname!=='/v1/convai/conversation')throw new Error('endpoint');
  return res.status(200).json({signedUrl:signed.signedUrl,dynamicVariables:{...variables,practice_topic:topics[b.topic],interface_language:b.language},context:`Tema elegido: ${topics[b.topic]} Idioma de apoyo: ${b.language==='ru'?'ruso':'español'}. Nombre: ${variables.user_name}. Practica español sencillo; una pregunta a la vez.`});
 }catch{return res.status(503).json({error:'service_unavailable'});}
}
