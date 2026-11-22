import { readdir } from 'node:fs/promises';
import { esc } from './markdown.mjs';

const available = new Set(await readdir('site/assets/editorial/covers'));
const folder = '/assets/editorial/covers/';
const fallback = { start: 'spanish-from-zero', grammar: 'spanish-articles', conversation: 'keep-a-conversation-going', practice: 'short-practice-routine', culture: 'choose-a-book-in-spanish' };

export function coverFor(article, cluster) {
  const slug = article.route.split('/')[2];
  const filename = available.has(slug + '.webp') ? slug + '.webp' : fallback[cluster.id] + '.webp';
  if (!available.has(filename)) throw Error('Missing journal cover for ' + slug);
  return folder + filename;
}

export function newestFirst(articles, now = Date.now()) {
  return articles.filter(a => Date.parse(a.publishedAt) <= now)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.id.localeCompare(b.id));
}

const copy = {
  ru: { title: 'Статьи', intro: 'Испанский в разговоре, культуре и повседневной жизни. В каждой статье — примеры и практика.', latest: 'Новые статьи', all: 'Все статьи', library: 'Бесплатные материалы', topics: 'Темы', minutes: 'мин чтения', into: 'Испанский для путешествий', libraryIntro: 'Открытые статьи, упражнения и путеводители по испанскому языку.', latestLink: 'Читать все статьи', categories: {} },
  es: { title: 'Artículos', intro: 'Español para conversar, descubrir la cultura y moverse por la vida cotidiana. Los artículos completos se leen en ruso.', latest: 'Últimos artículos', all: 'Todos', library: 'Recursos gratuitos', topics: 'Temas', minutes: 'min de lectura', into: 'Español para viajar (en ruso)', libraryIntro: 'Guías, diálogos y ejercicios de español de libre acceso.', latestLink: 'Ver todos los artículos', categories: {start:'Desde cero', conversation:'Conversación', grammar:'Gramática', practice:'Práctica autónoma', culture:'Vida y cultura'} },
  en: { title: 'Articles', intro: 'Spanish for conversation, culture and everyday life. Each article includes examples and practice. Full articles are in Russian.', latest: 'Latest articles', all: 'All articles', library: 'Free resources', topics: 'Topics', minutes: 'min read', into: 'Spanish for travel (in Russian)', libraryIntro: 'Open guides, dialogues and exercises for learning Spanish.', latestLink: 'View all articles', categories: {start:'From scratch', conversation:'Conversation', grammar:'Grammar', practice:'Independent practice', culture:'Life and culture'} },
};

export function journalViews({ language, ordered, clusters, clusterFor, readingTimes, descriptions = {} }) {
  const t = copy[language];
  const base = language === 'ru' ? '' : '/' + language;
  const index = base + '/articles/';
  const format = new Intl.DateTimeFormat(language, { day:'numeric', month:'short', year:'numeric', timeZone:'UTC' });
  const label = c => t.categories[c.id] || c.label;
  function grid(articles, heading = 'h2', lazy = false) {
    return '<div class="story-grid journal-list">' + articles.map((a, i) => {
      const c = clusterFor(a);
      const [title, summary] = descriptions[a.route.split('/')[2]] || [a.title, a.description];
      const img = coverFor(a, c);
      return `<article class="story-card journal-entry" data-topic="${c.id}"><a href="${a.route}" hreflang="ru" aria-labelledby="story-${a.id}"><div class="story-photo"><img src="${img}" alt="" width="640" height="480" decoding="async" loading="${lazy || i >= 3 ? 'lazy' : 'eager'}"></div><div class="story-copy"><div class="story-meta"><span>${esc(label(c))}</span><time datetime="${a.publishedAt}">${format.format(new Date(a.publishedAt))}</time></div><${heading} id="story-${a.id}">${esc(title)}</${heading}><p>${esc(summary)}</p><span class="story-foot">${readingTimes.get(a.route)} ${t.minutes}<span aria-hidden="true">↗</span></span></div></a></article>`;
    }).join('') + '</div>';
  }
  const options = [['all', t.all, ordered.length], ...clusters.map(c => [c.id, label(c), ordered.filter(a => clusterFor(a) === c).length])];
  const filters = '<div class="article-filters" role="group" aria-label="' + t.topics + '" hidden>' + options.map(([id, name, count]) =>
    `<button type="button" data-cluster="${id}" aria-pressed="${id === 'all'}">${esc(name)} <span>${count}</span></button>`).join('') + '</div>';
  const section = `<section class="story-section story-wrap wrap"><header class="story-heading"><h2>${t.latest}</h2><a href="${index}">${t.latestLink} <span aria-hidden="true">↗</span></a></header>${grid(ordered.slice(0, 3), 'h3')}</section>`;
  const resources = `<header class="story-intro story-wrap wrap"><h1>${t.library}</h1><div><p>${t.libraryIntro}</p><a href="/resources/travel/">${t.into} ↗</a></div></header>${section}`;
  const archive = `<header class="story-intro story-wrap wrap"><h1>${t.title}</h1><p>${t.intro}</p></header><section class="story-wrap story-index wrap journal" aria-label="${t.title}">${filters}<p class="journal-count visually-hidden" role="status" aria-live="polite">${t.title} · ${ordered.length}</p>${grid(ordered)}</section>`;
  return { archive, resources, title:t.title, intro:t.intro, library:t.library, libraryIntro:t.libraryIntro,
    home: `<div class="story-home">${grid(ordered.slice(0, 3), 'h3', true)}<a class="link" href="${index}">${t.latestLink} ↗</a></div>` };
}
