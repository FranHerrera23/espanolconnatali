import { inject, track } from '@vercel/analytics';

// Only public learning/commercial routes. Never collect private tutor access URLs.
export function publicPath(path) {
  return /^\/(?:es\/|en\/)?(?:articles\/)?$/.test(path) || /^\/(?:es\/|en\/)?resources(?:\/|$)/.test(path) ||
    /^\/(?:es\/|en\/)?(?:course|pricing)\/$/.test(path) || /^\/(?:es\/|en\/)?tutor\/$/.test(path);
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
  const allowed = { instagram: ['b01', '01-escuela', '02-web-nueva', '03-biblioteca-gratuita', 'exposicion', '05-tapas', '06-repetir', '07-cuenta', 'consulta-curso'], telegram: ['ladybcn-expo', 'madrid-cita'], qa: ['desktop', 'mobile'] };
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
  document.addEventListener('ecn:waitlist-joined', () => track('tutor_waitlist_joined', tags));
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    if (link.hasAttribute('data-payment-help')) {
      track('course_payment_help_click', tags);
      return;
    }
    const url = new URL(link.href, location.href);
    if (url.hostname === 'gumroad.com' || url.hostname.endsWith('.gumroad.com')) track('gumroad_click', tags);
  });
}
