import { createHash } from 'node:crypto';
import { BlobPreconditionFailedError, put } from '@vercel/blob';

const languages = new Set(['ru', 'en', 'es']);
const kinds = new Set(['payment', 'private-lessons']);
const levels = new Set(['new', 'return']);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method' });
  }
  if (req.headers.origin !== 'https://' + req.headers.host) {
    return res.status(403).json({ error: 'origin' });
  }
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) {
    return res.status(415).json({ error: 'format' });
  }
  let input = req.body;
  if (typeof input === 'string') {
    if (input.length > 2048) return res.status(400).json({ error: 'input' });
    try { input = JSON.parse(input); } catch { return res.status(400).json({ error: 'input' }); }
  }
  const { requestId, language, level, website, kind } = input ?? {};
  const email = typeof input?.email === 'string' ? input.email.trim() : '';
  const social = typeof input?.social === 'string' ? input.social.trim() : '';
  const phoneInput = typeof input?.phone === 'string' ? input.phone.trim() : '';
  const phone = phoneInput.replace(/[ ()-]/g, '');
  if (website || typeof requestId !== 'string' ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(requestId) ||
      !kinds.has(kind) || !languages.has(language) || (level !== undefined && !levels.has(level)) ||
      email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      social.length > 180 || /[\u0000-\u001f\u007f]/.test(social) ||
      (phoneInput && (!/^\+[0-9 ()-]{7,24}$/.test(phoneInput) || !/^\+[0-9]{7,15}$/.test(phone)))) {
    return res.status(400).json({ error: 'input' });
  }
  const request = { requestId, language, kind, email, ...(level ? { level } : {}),
    ...(social ? { social } : {}), ...(phone ? { phone } : {}) };
  const key = createHash('sha256').update(JSON.stringify(request)).digest('hex');
  try {
    await put((kind === 'payment' ? 'natali-course/payment-help/v1/' : 'natali-course/private-lessons/v1/') + key + '.json', JSON.stringify({
      ...request, receivedAt: new Date().toISOString()
    }), { access: 'private', contentType: 'application/json', allowOverwrite: false });
  } catch (error) {
    if (!(error instanceof BlobPreconditionFailedError) && !/already exists/i.test(error.message)) {
      return res.status(503).json({ error: 'unavailable' });
    }
  }
  return res.status(200).json({ ok: true });
}
