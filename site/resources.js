// Home navigation and motion are scoped: reader.js is also loaded by the static builder.
(() => {
  const isHome = !!document.querySelector('.home-view');
  const menu = isHome ? document.querySelector('.menu-button') : null;
  const nav = document.querySelector('.nav-links');
  const closeMenu = () => { menu?.setAttribute('aria-expanded', 'false'); nav?.classList.remove('open'); };
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav?.classList.toggle('open', open);
  });
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', closeMenu));
  menu?.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  // All content remains visible when scripts or motion preferences disable enhancement.
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 900px) and (pointer: fine)' }, context => {
    if (!context.conditions.motion) return;
    const desktop = context.conditions.desktop;
    let lenis = null;
    if (desktop && window.Lenis) {
      lenis = new Lenis({ duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), anchors: { offset: -24 }, smoothWheel: true, wheelMultiplier: .9, syncTouch: false });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.lagSmoothing(0);
    }
    const tick = t => lenis?.raf(t * 1000);
    if (lenis) gsap.ticker.add(tick);
    const focus = e => {
      if (!lenis || !(e.target instanceof HTMLElement)) return;
      const r = e.target.getBoundingClientRect();
      if (r.top < 24 || r.bottom > innerHeight - 24) lenis.scrollTo(e.target, { offset: -80, immediate: true });
    };
    document.addEventListener('focusin', focus);
    const reveal = (el, distance, opacity = 1) => {
      gsap.fromTo(el, { y: distance, opacity }, {
        y: 0, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 96%', end: 'top 66%', scrub: desktop ? .65 : true, invalidateOnRefresh: true }
      });
    };
    // Display-only choreography. Body copy and interactive controls never fade or mask.
    document.querySelectorAll('.home-view h2').forEach(el => reveal(el, desktop ? 40 : 16, .78));
    document.querySelectorAll('.voice-quote').forEach(el => reveal(el, desktop ? 48 : 16, .72));
    document.querySelectorAll('.voice-evidence,.voice-secondary figure').forEach(el => reveal(el, desktop ? 24 : 8));
    document.querySelectorAll('.practice-sequence article').forEach(el => {
      gsap.fromTo(el, { '--rule-progress': 0 }, { '--rule-progress': 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 48%', scrub: .6 } });
      gsap.fromTo(el.querySelector('h3'), { x: desktop ? 16 : 0 }, { x: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 55%', scrub: .6 } });
    });
    document.querySelectorAll('.hero-picture img,.story-picture img').forEach(el => {
      gsap.fromTo(el, { clipPath: 'inset(3% 2% 3% 2%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 98%', end: 'top 35%', scrub: .7 } });
    });
    let active = true;
    let refreshFrame;
    const refresh = () => { cancelAnimationFrame(refreshFrame); refreshFrame = requestAnimationFrame(() => { if (active) { lenis?.resize(); ScrollTrigger.refresh(); } }); };
    document.fonts.ready.then(refresh);
    const images = [...document.querySelectorAll('img')];
    images.forEach(img => img.addEventListener('load', refresh));
    const disclosures = [...document.querySelectorAll('.student-voices details')];
    disclosures.forEach(el => el.addEventListener('toggle', refresh));
    window.addEventListener('pageshow', refresh);
    return () => {
      active = false;
      cancelAnimationFrame(refreshFrame);
      document.removeEventListener('focusin', focus);
      images.forEach(img => img.removeEventListener('load', refresh));
      disclosures.forEach(el => el.removeEventListener('toggle', refresh));
      window.removeEventListener('pageshow', refresh);
      gsap.ticker.remove(tick);
      lenis?.destroy();
    };
  });
})();
