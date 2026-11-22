import { authenticate, history, newReservation, pilotThemes, profileKey, settle, turnVariables, view, withSignature } from './pilot-state.mjs';
import { privateHeaders, sameOrigin } from './tutor-access.mjs';

const cookieName = '__Host-ecn_tutor_pilot';
const csrfContentType = /^application\/json(?:;|$)/i;
const terminal = new Set(['done', 'failed']);
const handlers = new Set(['claim', 'profile', 'refresh', 'start', 'history', 'appearance']);

function claimToken(body) {
  if (typeof body.invite !== 'string') return body.token;
  if (!/^[a-z]{2,16}\/[A-Za-z0-9_-]{16}$/.test(body.invite)) return null;
  const invites = JSON.parse(process.env.TUTOR_PILOT_SHORT_INVITES || '{}');
  if (Object.hasOwn(invites, body.invite)) return invites[body.invite];
  const additional = JSON.parse(process.env.TUTOR_PILOT_ADDITIONAL_SHORT_INVITES || '{}');
  return Object.hasOwn(additional, body.invite) ? additional[body.invite] : null;
}

export function pilotHandler({ store, provider, html, now = Date.now }) {
  return async function handle(req, res) {
    privateHeaders(res);
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'microphone=(self), camera=(), geolocation=()');
    res.setHeader('Content-Security-Policy', "default-src 'none'; connect-src 'self' wss://api.elevenlabs.io https://cdn.jsdelivr.net; img-src data:; font-src data:; style-src 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net; worker-src blob:; media-src blob:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
    if (req.method === 'GET' || req.method === 'HEAD') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(req.method === 'HEAD' ? '' : html());
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    if (!sameOrigin(req)) return res.status(403).json({ error: 'origin' });
    if (!csrfContentType.test(req.headers['content-type'] ?? '')) return res.status(415).json({ error: 'format' });
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'input' }); }
    }
    if (!handlers.has(body?.action)) return res.status(400).json({ error: 'input' });
    try {
      const cookie = (req.headers.cookie ?? '').split('; ').find(item => item.startsWith(`${cookieName}=`));
      const token = body.action === 'claim' ? claimToken(body) : cookie?.slice(cookieName.length + 1);
      const entry = await authenticate(store, token, now());
      if (!entry) return res.status(401).json({ error: 'access' });
      const { id, record, revision } = entry;
      if (body.action === 'claim') {
        res.setHeader('Set-Cookie', `${cookieName}=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${Math.floor((record.expiresAt - now()) / 1000)}`);
        return res.status(200).json(view(record));
      }
      if (body.action !== 'profile' && body.profileKey !== profileKey(record)) return res.status(401).json({ error: 'access' });
      if (body.action === 'profile') return res.status(200).json(view(record));
      if (body.action === 'history') return res.status(200).json(history(record));
      if (body.action === 'appearance') {
        if (!pilotThemes.has(body.theme)) return res.status(400).json({ error: 'input' });
        if (record.theme !== body.theme && !await store.write(id, { ...record, theme: body.theme }, revision)) {
          return res.status(409).json({ error: 'conflict' });
        }
        return res.status(200).json({ theme: body.theme });
      }
      if (body.action === 'refresh') {
        const pending = record.pending;
        if (!pending) return res.status(200).json(view(record));
        const call = pending.conversationId ? await provider().get(pending, record.slotSeconds ?? 450) : null;
        const updated = terminal.has(call?.status) ? settle(record, call, now())
          : !call && now() >= pending.until ? { ...record, pending: null }
          : record;
        if (updated !== record && !await store.write(id, updated, revision)) return res.status(409).json({ error: 'conflict' });
        return res.status(200).json(view(updated));
      }
      const lang = body.language;
      if (!['ru', 'es'].includes(lang)) return res.status(400).json({ error: 'input' });
      const reserved = newReservation(record, now());
      if (!reserved) return res.status(409).json({ error: record.pending ? 'pending' : 'complete' });
      if (!await store.write(id, { ...record, pending: reserved }, revision)) return res.status(409).json({ error: 'conflict' });
      const duration = record.slotSeconds ?? 450;
      const lessonSeconds = view(record).lesson?.seconds;
      let signature;
      try {
        signature = await provider().sign(record.internal, duration, lessonSeconds ?? duration);
      } catch {
        const current = await store.read(id);
        if (current?.record.pending?.nonce === reserved.nonce) await store.write(id, { ...record, pending: null }, current.revision);
        return res.status(503).json({ error: 'voice' });
      }
      const current = await store.read(id);
      if (current?.record.pending?.nonce !== reserved.nonce || current.record.expiresAt <= now() ||
          !await store.write(id, { ...record, pending: withSignature(reserved, signature, now(), signature.maxSeconds ?? duration) }, current.revision)) {
        return res.status(409).json({ error: 'conflict' });
      }
      return res.status(200).json({ signedUrl: signature.signedUrl, lessonSeconds, dynamicVariables: turnVariables(record, lang) });
    } catch {
      return res.status(503).json({ error: 'unavailable' });
    }
  };
}
