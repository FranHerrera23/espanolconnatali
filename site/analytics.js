import { inject, track } from '@vercel/analytics';

// Only public learning/commercial routes. Never collect private tutor access URLs.
export function publicPath(path) {
  return /^\/(?:es\/|en\/)?$/.test(path) || /^\/(?:es\/|en\/)?(?:resources|course)(?:\/|$)/.test(path);
}
export function sanitize(event) {
  const url = new URL(event.url);
  if (!publicPath(url.pathname)) return null;
  url.search = ''; url.hash = '';
  return { ...event, url: url.href };
}
export function attribution(search) {
  const params = new URLSearchParams(search);
  const source = params.get('utm_source');
  const piece = params.get('utm_content');
  const allowed = { instagram: ['b01'], telegram: ['ladybcn-expo'], qa: ['desktop', 'mobile'] };
  return { source: Object.hasOwn(allowed, source) ? source : 'unknown',
    piece: allowed[source]?.includes(piece) ? piece : 'unknown' };
}
if (typeof window !== 'undefined' && window.location.hostname === 'www.espanolconnatali.com' && publicPath(location.pathname)) {
  inject({ mode: 'production', beforeSend: sanitize });
  // No cookies or cross-page attribution storage: unknown remains unknown.
  const tags = attribution(location.search);
  if (tags.source !== 'unknown') track('campaign_landing', tags);
  const course = document.querySelector('#course');
  if (course && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { track('course_view', tags); observer.disconnect(); }
    }, { threshold: 0.2 });
    observer.observe(course);
  }
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (url.hostname === 'gumroad.com' || url.hostname.endsWith('.gumroad.com')) track('gumroad_click', tags);
  });
}
