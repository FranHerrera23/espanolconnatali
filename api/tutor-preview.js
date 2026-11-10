import { createHash, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const root = join(process.cwd(), 'private-preview');
const access = JSON.parse(readFileSync(join(root, 'access-hash.json'), 'utf8'));
const cookieName = '__Secure-ecn_tutor_review';
function valid(token) {
  if (typeof token !== 'string' || token.length > 128 || Date.now() > Date.parse(access.expires)) return false;
  const hash = createHash('sha256').update(token).digest();
  return timingSafeEqual(hash, Buffer.from(access.sha256, 'hex'));
}
const gate = `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Приватный просмотр · Natali</title><style>body{font:18px/1.6 system-ui;background:#fbfaf7;color:#253d34;max-width:560px;margin:16vh auto;padding:24px}h1{font-size:30px}p{color:#526258}</style><h1>Приватный просмотр / Vista privada</h1><p id="status">Откройте персональную ссылку для просмотра.<br>Abrí el enlace privado de revisión.</p><script>(async()=>{const t=new URLSearchParams(location.hash.slice(1)).get('access');history.replaceState(null,'',location.pathname);if(!t)return;document.getElementById('status').textContent='Проверяем доступ… / Comprobando acceso…';try{const r=await fetch(location.pathname,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({access:t}),credentials:'same-origin'});if(r.ok){location.replace(location.pathname)}else{document.getElementById('status').textContent='Ссылка недействительна или срок истёк. / El enlace no es válido o venció.'}}catch{document.getElementById('status').textContent='Попробуйте ещё раз. / Volvé a abrir el enlace.'}})();</script></html>`;
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'microphone=(self), camera=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src data:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'unsafe-inline' 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net; worker-src blob:; connect-src 'self' wss://api.elevenlabs.io https://api.elevenlabs.io https://cdn.jsdelivr.net; media-src blob:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
  if (req.method === 'POST') {
    const origin = req.headers.origin;
    if (origin && origin !== `https://${req.headers.host}` && origin !== `http://${req.headers.host}`) return res.status(403).end();
    let body = req.body;
    try { if (typeof body === 'string' || Buffer.isBuffer(body)) body = JSON.parse(body.toString()); } catch { return res.status(400).end(); }
    if (!valid(body?.access)) return res.status(403).end();
    res.setHeader('Set-Cookie', `${cookieName}=${body.access}; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Strict`);
    return res.status(204).end();
  }
  if (!['GET','HEAD'].includes(req.method)) { res.setHeader('Allow','GET, HEAD, POST'); return res.status(405).end(); }
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(x=>x.trim().split('=')).filter(x=>x.length===2));
  res.setHeader('Content-Type','text/html; charset=utf-8');
  if (!valid(cookies[cookieName])) return res.status(401).send(req.method === 'HEAD' ? '' : gate);
  return res.status(200).send(req.method === 'HEAD' ? '' : readFileSync(join(root,'tutor.html'),'utf8'));
}
