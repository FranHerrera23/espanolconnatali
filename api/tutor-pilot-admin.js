import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { createProfile } from '../server/pilot-state.mjs';
import { pilotBlob } from '../server/pilot-store.mjs';
import { privateHeaders, sameOrigin } from '../server/tutor-access.mjs';
const allowed = new Set(['Marina', 'Sergey', 'Katryn', 'NATALIA', 'QA']);
export default async function handler(req, res) {
  privateHeaders(res);
  const key = req.headers['x-pilot-bootstrap'];
  const hash = process.env.TUTOR_PILOT_BOOTSTRAP_HASH;
  if (req.method !== 'POST' || !sameOrigin(req) || typeof key !== 'string' || key.length !== 64 || !/^[a-f0-9]{64}$/.test(hash??'') ||
      !timingSafeEqual(createHash('sha256').update(key).digest(), Buffer.from(hash,'hex'))) return res.status(404).json({error:'not_found'});
  const name=req.body?.name;
  if (!allowed.has(name)) return res.status(400).json({error:'input'});
  try {
    const id=createHmac('sha256',key).update('id:'+name).digest('hex').slice(0,32);
    const secret=createHmac('sha256',key).update('access:'+name).digest('base64url');
    const previous=await pilotBlob.read(id);
    if(!previous){
      const background=name==='Marina'?['Dirige una empresa de contabilidad.','Vive en Gotemburgo.','Le gusta viajar.','Su español fue descrito como A1+ por el equipo; adaptar al uso real.']:[];
      const {record}=createProfile(name==='QA'?'NATALIA':name,{internal:['NATALIA','QA'].includes(name),background});
      record.hash=createHash('sha256').update(secret).digest('hex');
      if(!await pilotBlob.write(id,record,null))return res.status(409).json({error:'conflict'});
    }
    return res.status(200).json({name,url:`https://www.espanolconnatali.com/tutor-dashboard/#access=${id}.${secret}`,created:!previous});
  } catch { return res.status(503).json({error:'store'}); }
}
