(() => {
  const header = document.querySelector('.ecn-nav');
  const toggle = header.querySelector('.ecn-toggle');
  const nav = header.querySelector('.ecn-primary');
  const resources = header.querySelector('.ecn-resources');
  const summary = resources.querySelector('summary');
  const desktop = matchMedia('(min-width: 1121px) and (hover: hover) and (pointer: fine)');
  let pinned = false;

  const closeResources = () => {
    resources.open = false;
    pinned = false;
  };
  const setMenu = open => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    if (!open) closeResources();
  };

  header.classList.add('is-enhanced');
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  resources.addEventListener('pointerenter', event => {
    if (desktop.matches && event.pointerType === 'mouse') resources.open = true;
  });
  resources.addEventListener('pointerleave', () => {
    if (desktop.matches && !pinned && !resources.contains(document.activeElement)) closeResources();
  });
  resources.addEventListener('focusout', event => {
    if (!resources.contains(event.relatedTarget)) closeResources();
  });
  summary.addEventListener('click', event => {
    event.preventDefault();
    if (resources.open) closeResources();
    else {
      resources.open = true;
      pinned = true;
    }
  });

  document.addEventListener('pointerdown', event => {
    if (!header.contains(event.target)) setMenu(false);
    else if (!resources.contains(event.target)) closeResources();
  });
  header.addEventListener('focusout', event => {
    if (event.relatedTarget && !header.contains(event.relatedTarget)) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
    if (resources.open) {
      event.preventDefault();
      closeResources();
      summary.focus({ preventScroll: true });
    } else if (toggle.getAttribute('aria-expanded') === 'true') {
      event.preventDefault();
      setMenu(false);
      toggle.focus({ preventScroll: true });
    }
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a[href]')) setMenu(false);
  });
  matchMedia('(max-width: 1120px)').addEventListener('change', () => setMenu(false));
  window.addEventListener('pageshow', event => { if (event.persisted) setMenu(false); });
})();
