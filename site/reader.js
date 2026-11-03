(() => {
  const menu = document.querySelector('.menu-button');
  const nav = document.querySelector('.nav-links');
  const header = document.querySelector('.site-nav');
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const close = () => { menu?.setAttribute('aria-expanded', 'false'); nav?.classList.remove('open'); };
  menu?.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav?.classList.toggle('open', open); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { close(); menu?.focus({ preventScroll: true }); } });
  const move = (top, immediate = false) => {
    top = Math.max(0, Math.min(top, document.documentElement.scrollHeight - innerHeight));
    const duration = Math.min(1.6, Math.max(.7, Math.abs(scrollY - top) / 3500));
    const event = new CustomEvent('natali:scroll', { cancelable: true, detail: { top, duration, immediate: immediate || reduced() } });
    if (document.dispatchEvent(event)) window.scrollTo({ top, behavior: immediate || reduced() ? 'instant' : 'smooth' });
  };
  const targetTop = target => target.id === 'home' ? 0 : target.getBoundingClientRect().top + scrollY - (header?.getBoundingClientRect().height || 80) - 24;
  let departing = false;
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (url.origin === location.origin && (url.pathname !== location.pathname || url.search !== location.search)) {
      departing = true;
      history.replaceState({ ...history.state, nataliY: scrollY }, '', location.href);
      return;
    }
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    close();
    history.replaceState({ ...history.state, nataliY: scrollY }, '', location.href);
    history.pushState({ nataliY: targetTop(target) }, '', url);
    move(targetTop(target));
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
  history.scrollRestoration = 'manual';
  window.addEventListener('pagehide', () => { if (!departing) history.replaceState({ ...history.state, nataliY: scrollY }, '', location.href); });
  window.addEventListener('pageshow', e => {
    departing = false;
    if ((e.persisted || performance.getEntriesByType('navigation')[0]?.type === 'back_forward') && Number.isFinite(history.state?.nataliY)) document.fonts.ready.then(() => requestAnimationFrame(() => requestAnimationFrame(() => move(history.state.nataliY, true))));
  });
  // Same-document back/forward uses the same scroll controller as navigation.
  let currentPath = location.pathname;
  window.addEventListener('popstate', e => {
    if (currentPath !== location.pathname) { currentPath = location.pathname; return; }
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    requestAnimationFrame(() => move(e.state?.nataliY ?? (target ? targetTop(target) : 0)));
  });
  document.querySelectorAll('[data-print]').forEach(b => b.addEventListener('click', () => window.print()));
  document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => { const status = b.parentElement.querySelector('[role=status]'); try { await navigator.clipboard.writeText(document.querySelector('link[rel=canonical]').href); status.textContent = 'Ссылка скопирована'; } catch { status.textContent = 'Скопируйте адрес из строки браузера.'; } }));
})();
