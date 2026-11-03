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
  if (window.SplitText) gsap.registerPlugin(SplitText);
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
    // Line masks follow the scroll position; only display text is split.
    // SplitText re-measures Cyrillic line wraps after font loading and responsive changes.
    const splits = [];
    document.querySelectorAll('.home-view h2,.voice-quote').forEach(el => {
      if (window.SplitText && desktop) {
        const split = SplitText.create(el, {
          type: 'lines', mask: 'lines', linesClass: 'motion-line', autoSplit: true, aria: 'auto',
          onSplit(self) {
            return gsap.fromTo(self.lines, { yPercent: 105 }, {
              yPercent: 0, duration: 1, stagger: .09, ease: 'none',
              scrollTrigger: {
                trigger: el, start: 'top 96%', end: 'top 55%', scrub: .65, invalidateOnRefresh: true,
                onUpdate: st => { el.dataset.motionProgress = st.progress.toFixed(3); }
              }
            });
          }
        });
        splits.push(split);
      } else reveal(el, 16, .85);
    });
    document.querySelectorAll('.voice-evidence,.voice-secondary figure,.student-story-image').forEach(el => reveal(el, desktop ? 24 : 8));
    document.querySelectorAll('.student-story h2').forEach(el => reveal(el, 8, .85));
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
      splits.forEach(split => split.revert());
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
