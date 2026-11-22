import { get, put, BlobPreconditionFailedError } from '@vercel/blob';

const listPath = 'natali-tutor/waitlist-v1.json';
const maxEntries = 200;
const languages = new Set(['ru', 'es', 'en']);

async function subscribe(email, language) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const blob = await get(listPath, { access: 'private', useCache: false });
    const entries = blob ? await new Response(blob.stream).json() : [];
    if (!Array.isArray(entries)) throw new Error('Invalid waitlist');
    if (entries.some(entry => entry.email === email)) return 'existing';
    if (entries.length >= maxEntries) return 'full';
    try {
      await put(listPath, JSON.stringify([...entries, {
        email, language, signedUpAt: new Date().toISOString(), consent: 'founding-invite-v1'
      }]), {
        access: 'private', contentType: 'application/json',
        allowOverwrite: Boolean(blob),
        ...(blob ? { ifMatch: blob.blob.etag } : {})
      });
      return 'created';
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError ||
          (!blob && /already exists/i.test(error.message))) continue;
      throw error;
    }
  }
  throw new Error('Waitlist write conflict');
}

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
  const email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      input?.consent !== true || !languages.has(input?.language)) {
    return res.status(400).json({ error: 'input' });
  }
  if (input.website) return res.status(200).json({ ok: true });
  try {
    const result = await subscribe(email, input.language);
    if (result === 'full') return res.status(409).json({ error: 'full' });
    return res.status(200).json({ ok: true, created: result === 'created' });
  } catch {
    return res.status(503).json({ error: 'unavailable' });
  }
}
