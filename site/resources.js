// One scroll clock and one timeline per editorial block.
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 900px) and (pointer: fine)' }, context => {
    if (!context.conditions.motion) return;
    let lenis;
    if (context.conditions.desktop && window.Lenis) {
      lenis = new Lenis({ duration: .95, smoothWheel: true, wheelMultiplier: 1, syncTouch: false, anchors: false, prevent: node => node.matches?.('dialog, textarea, select, [data-lenis-prevent]') });
      lenis.on('scroll', ScrollTrigger.update);
    }
    const tick = time => lenis?.raf(time * 1000);
    if (lenis) gsap.ticker.add(tick);
    const navigate = event => {
      if (!lenis) return;
      event.preventDefault();
      lenis.scrollTo(event.detail.top, { duration: event.detail.duration, immediate: event.detail.immediate });
    };
    document.addEventListener('natali:scroll', navigate);
    // Parents stay stationary. All children in a block share the same progress,
    // so body text, imagery and controls cannot race ahead of the heading.
    const blocks = document.querySelectorAll('.hero-copy,.hero-picture,.fit-heading,.fit-stories article,.course-proposition,.course-spec,.practice-heading,.practice-sequence article,.voices-heading,.voice-feature,.voice-secondary,.voices-more,.voices-invitation,.story-copy,.story-picture,.resource-heading,.resource-feature,.resource-item,.library-resource,.private-invite-copy,.closing,.students-intro,.student-story');
    const reveal = (block, items) => {
      if (!items.length || block.getBoundingClientRect().top < innerHeight * .65) return;
      gsap.fromTo(items, { y: 14, opacity: .18 }, {
        y: 0, opacity: 1, stagger: .055, duration: .7, ease: 'power1.out',
        scrollTrigger: { trigger: block, start: 'clamp(top 98%)', end: 'clamp(top 78%)', scrub: true, invalidateOnRefresh: true }
      });
    };
    blocks.forEach(block => reveal(block, [...block.children]));

    // Outside the home, animate individual reading beats. Long bodies of text,
    // sticky controls, forms and dialog contents stay in their native layout.
    for (const item of document.querySelectorAll('main h2, main .campus-tour h3, main .program-photo, main .program-quote blockquote, main .private-practice blockquote, main .natali-archive figure, main .story-card h3, main .hub-panel-head h3')) {
      if (!item.closest('.home-view, .student-story, dialog, details, form, [hidden]')) reveal(item, [item]);
    }
    let frame;
    const refresh = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { lenis?.resize(); ScrollTrigger.refresh(); }); };
    const disclosures = [...document.querySelectorAll('details')];
    disclosures.forEach(el => el.addEventListener('toggle', refresh));
    let active = true;
    const resized = window.ResizeObserver ? new ResizeObserver(refresh) : null;
    resized?.observe(document.body);
    document.fonts.ready.then(() => { if (active) refresh(); });
    window.addEventListener('pageshow', refresh);
    return () => {
      active = false;
      resized?.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener('natali:scroll', navigate);
      disclosures.forEach(el => el.removeEventListener('toggle', refresh));
      window.removeEventListener('pageshow', refresh);
      gsap.ticker.remove(tick);
      lenis?.destroy();
    };
  });
})();
