const locales = {
  ru: { language: 'Язык', main: 'Главная навигация', menu: 'Меню', home: 'На главную',
    entries: ['Курс','Ресурсы','Отзывы','Натали','Занятия','Тьютор','Цены'],
    resources: ['Статьи','Испания'] },
  en: { language: 'Language', main: 'Main navigation', menu: 'Menu', home: 'Home',
    entries: ['Course','Resources','Reviews','Natali','Lessons','Tutor','Pricing'],
    resources: ['Articles','Spain'] },
  es: { language: 'Idioma', main: 'Navegación principal', menu: 'Menú', home: 'Inicio',
    entries: ['Curso','Recursos','Opiniones','Natali','Clases','Tutor','Precios'],
    resources: ['Artículos','España'] }
};

const languageNames = { ru: 'Русский', es: 'Español', en: 'English' };
const homeFor = locale => locale === 'ru' ? '/' : '/' + locale + '/';
const resources = ['/articles/', '/life-in-spain/'];
const commercial = ['/course/', null, '/students/', '/about-natali/', '/private-lessons/', '/tutor/', '/pricing/'];
const common = new Set(['/', '/resources/', ...resources, ...commercial]);
const localizedRoute = (locale, route) => homeFor(locale) + route.slice(1);

function languageTarget(locale, route, current) {
  if (locale === current || common.has(route)) return localizedRoute(locale, route);
  if (route.startsWith('/life-in-spain/') || route.startsWith('/resources/jobs-in-spain/')) {
    return localizedRoute(locale, locale === 'en' ? '/life-in-spain/' : route);
  }
  return localizedRoute(locale, '/articles/');
}

export function renderHeader(locale, route) {
  const copy = locales[locale];
  const links = commercial.map((target, index) => {
    if (target) {
      const current = target === route ? ' aria-current="page"' : '';
      return `<a href="${localizedRoute(locale, target)}"${current}>${copy.entries[index]}</a>`;
    }
    const list = resources.map((resource, index) =>
      `<a href="${localizedRoute(locale, resource)}"${route === resource ? ' aria-current="page"' : ''}>${copy.resources[index]}</a>`).join('');
    return `<details class="ecn-resources"><summary>${copy.entries[index]}</summary><div>${list}</div></details>`;
  }).join('');
  const languages = Object.entries(languageNames).map(([lang, name]) =>
    `<a href="${languageTarget(lang, route, locale)}" lang="${lang}" data-language="${lang}" aria-label="${name}"${locale === lang ? ' aria-current="true"' : ''}>${lang.toUpperCase()}</a>`).join('');
  return `<header class="site-nav ecn-nav wrap">
<a class="brand" href="${homeFor(locale)}" aria-label="${copy.home} · Español con Natali"><img class="brand-symbol" src="/assets/brand/natali-lynx-approved.png" width="52" height="52" alt="">Español <span> con Natali</span></a>
<button class="ecn-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation">${copy.menu}</button>
<nav class="ecn-primary" id="primary-navigation" aria-label="${copy.main}">${links}</nav>
<div class="ecn-locale language-picker" role="group" aria-label="${copy.language}">${languages}</div>
</header><script src="/site-navigation.js" defer></script>`;
}
