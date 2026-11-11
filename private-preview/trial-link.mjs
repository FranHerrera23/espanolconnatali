export function readTrial(fragment) {
  const encoded = new URLSearchParams(fragment.slice(1)).get('invite');
  if (!encoded || encoded.length > 4096) return null;
  try {
    const invitation = JSON.parse(encoded);
    const name = typeof invitation.name === 'string' ? invitation.name.trim() : '';
    const url = new URL(invitation.signedUrl);
    if (!name || [...name].length > 40 || !/^[\p{L}\p{M} .’'\-]+$/u.test(name)) return null;
    if (url.protocol !== 'wss:' || url.host !== 'api.elevenlabs.io' ||
        url.pathname !== '/v1/convai/conversation' || url.username || url.password || url.hash ||
        !url.searchParams.get('conversation_signature') || !url.searchParams.get('conversation_id')) return null;
    return {name, signedUrl: url.href};
  } catch {
    return null;
  }
}
