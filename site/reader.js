(() => {
  const backToLibrary = document.querySelector('.read-top a');
  if (backToLibrary && document.referrer) {
    const previous = new URL(document.referrer);
    if (previous.origin === location.origin && previous.pathname === '/resources/') backToLibrary.href = previous.pathname + previous.search;
  }
  const menu = document.querySelector('.menu-button');
  const nav = document.querySelector('.nav-links');
  const header = document.querySelector('.site-nav');
  const contents = document.querySelector('.reader-contents details');
  if (contents && matchMedia('(max-width: 900px)').matches) contents.open = false;
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

// Topic filtering enhances the complete, indexable HTML library.
(() => {
  const journal = document.querySelector('.journal');
  if (!journal) return;
  const filters = journal.querySelector('.article-filters');
  const buttons = [...filters.querySelectorAll('button')];
  const entries = [...journal.querySelectorAll('.journal-entry')];
  const status = journal.querySelector('.journal-count');
  const list = journal.querySelector('.journal-list');
  const valid = new Set(buttons.map(b => b.dataset.cluster));
  let animation;
  const apply = (requested, animate = false) => {
    const topic = valid.has(requested) ? requested : 'all';
    let count = 0;
    entries.forEach(entry => {
      entry.hidden = topic !== 'all' && entry.dataset.topic !== topic;
      entry.classList.toggle('journal-featured', topic === 'all' && entry.hasAttribute('data-featured'));
      if (!entry.hidden) count++;
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.cluster === topic)));
    const label = { es: 'Materiales: ', en: 'Resources: ', ru: 'Материалы: ' };
    status.textContent = label[document.documentElement.lang] + count;
    animation?.cancel();
    if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) animation = list.animate([{ opacity: .5 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
  };
  filters.hidden = false;
  apply(new URL(location.href).searchParams.get('cluster'));
  buttons.forEach(button => button.addEventListener('click', () => {
    if (button.getAttribute('aria-pressed') === 'true') return;
    const url = new URL(location.href);
    const topic = button.dataset.cluster;
    if (topic === 'all') url.searchParams.delete('cluster'); else url.searchParams.set('cluster', topic);
    history.replaceState({ ...history.state, nataliY: scrollY }, '', location.href);
    history.pushState({ nataliY: scrollY }, '', url);
    apply(topic, true);
  }));
  window.addEventListener('popstate', () => apply(new URL(location.href).searchParams.get('cluster')));
  window.addEventListener('pageshow', () => apply(new URL(location.href).searchParams.get('cluster')));
})();

// Keep the language decision on this device and carry equivalent anchors and filters across.
(() => {
  const article = /^\/resources\/[^/]+\/$/.test(location.pathname);
  const switches = [...document.querySelectorAll('[data-language]')];
  const referrer = document.referrer ? new URL(document.referrer) : null;
  const localizedReferrer = referrer?.origin === location.origin
    ? referrer.pathname.match(/^\/(es|en)\/(?:resources\/)?$/)
    : null;
  let preferred;
  try { preferred = localStorage.getItem('natali-language'); } catch {}
  const savedLocale = ['es', 'en'].includes(preferred) ? preferred : null;
  if (location.pathname === '/' && !location.hash && !location.search &&
      !document.referrer && savedLocale && performance.getEntriesByType('navigation')[0]?.type === 'navigate') {
    location.replace('/' + savedLocale + '/');
    return;
  }

  const returnLocale = localizedReferrer?.[1] || savedLocale;
  const returnPath = locale => {
    if (!localizedReferrer) return '/' + locale + '/resources/';
    const isHome = referrer.pathname === '/' + localizedReferrer[1] + '/';
    return '/' + locale + (isHome ? '/#resources' : '/resources/' + referrer.search);
  };
  const refreshDestinations = () => {
    switches.forEach(link => {
      const language = link.dataset.language;
      const original = new URL(link.getAttribute('href'), location.origin);
      link.href = article && language !== 'ru'
        ? returnPath(language)
        : original.pathname + location.search + location.hash;
    });
  };
  refreshDestinations();
  document.addEventListener('pointerdown', event => {
    if (event.target.closest('[data-language]')) refreshDestinations();
  });
  document.addEventListener('focusin', event => {
    if (event.target.closest('[data-language]')) refreshDestinations();
  });
  switches.forEach(link => link.addEventListener('click', () => {
    refreshDestinations();
    try { localStorage.setItem('natali-language', link.dataset.language); } catch {}
  }));
  if (article && returnLocale) {
    const back = document.querySelector('.read-top a');
    if (!back) return;
    const english = returnLocale === 'en';
    back.href = returnPath(returnLocale);
    back.lang = returnLocale;
    back.textContent = english ? '← Back to resources in English' : '← Volver a los recursos en español';
    const notice = document.createElement('p');
    notice.className = 'language-return';
    notice.lang = returnLocale;
    notice.textContent = english ? 'This article is in Russian.' : 'Este artículo está en ruso.';
    back.after(notice);
  }
})();
