import {createHash,timingSafeEqual} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
export const access=JSON.parse(readFileSync(join(process.cwd(),'private-preview/access-hash.json'),'utf8'));
export const cookieName='__Secure-ecn_tutor_review';
export function valid(token){if(typeof token!=='string'||token.length>128||Date.now()>Date.parse(access.expires))return false;return timingSafeEqual(createHash('sha256').update(token).digest(),Buffer.from(access.sha256,'hex'));}
export function authorized(req){const cs=Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=')).filter(x=>x.length===2));return valid(cs[cookieName]);}
export function privateHeaders(res){res.setHeader('Cache-Control','private, no-store, max-age=0');res.setHeader('CDN-Cache-Control','no-store');res.setHeader('Vercel-CDN-Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');}
export function sameOrigin(req){return req.headers.origin===`https://${req.headers.host}`||(req.headers.host?.startsWith('127.0.0.1:')&&req.headers.origin===`http://${req.headers.host}`);}
