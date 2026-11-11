import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { esc } from './markdown.mjs';
import { jobsRoute, renderJobs, jobsTeaser, lifeRoute, renderLife, jobDetailRoute, renderJobDetail } from './jobs.mjs';

const mirrored = new Set(['/', '/resources/', '/students/', jobsRoute, lifeRoute]);
const motion = ['lenis', 'gsap', 'ScrollTrigger', 'SplitText']
  .map(name => `<script src="/assets/vendor/${name}.min.js"></script>`).join('') +
  '<script src="/resources.js"></script>';

export function languagePicker(header, route, language = 'ru') {
  const mirror = mirrored.has(route) || route.startsWith(jobsRoute);
  const links = (route.startsWith(jobsRoute) ? [['ru', 'Русский'], ['es', 'Español']] : [['ru', 'Русский'], ['es', 'Español'], ['en', 'English']])
    .map(([id, name]) => [id, id.toUpperCase(), name, id === 'ru' ? route : '/' + id + (mirror ? route : '/resources/')])
    .map(([id, label, name, href]) =>
      `<a href="${href}" lang="${id}" aria-label="${name}" data-language="${id}"${language === id ? ' aria-current="true"' : ''}>${label}</a>`).join('');
  const label = { ru: 'Язык', es: 'Idioma', en: 'Language' }[language];
  return header.replace('</nav>', `<div class="language-picker language-menu" role="group" aria-label="${label}">${links}</div></nav>`)
    .replace('</header>', `<div class="language-picker language-header" role="group" aria-label="${label}">${links}</div></header>`);
}

export async function buildLocale(language, { out, base, production, header, footer, homebody, ordered, clusters, clusterFor, readingTimes, reviewRows, jobsData, readerHeader }) {
  const english = language === 'en';
  const local = (es, en) => english ? en : es;
  const filePrefix = local('spanish', 'english');
  const prefix = '/' + language;
  const dictionary = new Map((await readFile('content/' + filePrefix + '-home.tsv', 'utf8')).trim().split('\n').map(line => line.split('\t')));
  const keys = [...dictionary.keys()].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(keys.map(key => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  const translate = html => html.replace(pattern, key => esc(dictionary.get(key)));
  const internal = html => html.replace(/href="(\/(?:resources\/|students\/)?)(#[^"]*)?"/g, 'href="' + prefix + '$1$2"')
    .replace(/href="\/life-in-spain\/"/g, 'href="' + prefix + '/life-in-spain/"').replace(/href="#([^"]+)"/g, 'href="' + prefix + '/#$1"');
  const localizedHeader = internal(header
    .replace('aria-label="Главная навигация"', local('aria-label="Navegación principal"', 'aria-label="Main navigation"'))
    .replace('class="brand"', local('class="brand" aria-label="Inicio · Español con Natali"', 'class="brand" aria-label="Home · Español con Natali"'))
    .replace('>Меню<', local('>Menú<', '>Menu<'))
    .replace('>Ресурсы<', local('>Recursos<','>Resources<')).replace('>Учить испанский<',local('>Aprender español<','>Learn Spanish<')).replace('>Жизнь в Испании<',local('>Vida en España<','>Life in Spain<'))
    .replace('>Курс<', local('>Curso grabado<', '>Self-paced course<'))
    .replace('>Отзывы учеников<', local('>Testimonios<', '>Testimonials<'))
    .replace('>О Натали<', local('>Sobre Natali<', '>About Natali<'))
    .replace('>Лично с Натали<', local('>Clases privadas<', '>Private lessons<'))
    .replace('>О курсе ', local('>Ver el curso ', '>Explore the course ')));
  const jobsHeader = internal(readerHeader).replaceAll('Бесплатные материалы', local('Recursos gratuitos', 'Free resources')).replace('>Ресурсы<', local('>Recursos<','>Resources<')).replace('>Учить испанский<',local('>Aprender español<','>Learn Spanish<')).replace('>Жизнь в Испании<',local('>Vida en España<','>Life in Spain<')).replace('Меню', local('Menú', 'Menu')).replace('aria-label="Навигация"', local('aria-label="Navegación"', 'aria-label="Navigation"'));
  const write = async (route, title, description, body, animated) => {
    const isJobs = route === jobsRoute;
    const practical = route.startsWith(jobsRoute) || route === lifeRoute;
    const pageHeader = practical ? jobsHeader : translate(localizedHeader);
    const pageFooter = practical ? footer.replace(/<p>[\s\S]*?<\/p>/, '').replace(/<span>Курс в своём темпе[\s\S]*?<\/span>/, '') : footer;
    const dir = out + prefix + route;
    await mkdir(dir, { recursive: true });
    await writeFile(dir + 'index.html', `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — Español con Natali</title><meta name="description" content="${esc(description)}"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${base + route}"><link rel="stylesheet" href="/design-system.css"><link rel="stylesheet" href="/library.css"><link rel="stylesheet" href="/jobs.css"></head><body>${production ? '' : '<div class="preview-note">' + local('Vista previa', 'Preview') + '</div>'}<a class="skip" href="#main">${local('Ir al contenido', 'Skip to content')}</a>${languagePicker(pageHeader, route, language)}<main id="main">${body}</main>${translate(internal(pageFooter))}<script src="/reader.js"></script>${isJobs ? '<script type="module" src="/jobs.js"></script>' : route.startsWith(jobsRoute) ? '<script type="module" src="/job-detail.js"></script>' : ''}${animated ? motion : ''}</body></html>`);
  };

  const publicationDate = new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const localizedHome = translate(homebody
    .replace(jobsTeaser('ru', true), jobsTeaser(language, true))
    .replace(/(<time data-publication-date datetime="([^"]+)">)[^<]+<\/time>/g, (_, start, date) => start + publicationDate.format(new Date(date)) + '</time>')
    .replaceAll('>О курсе ', local('>Ver el curso ', '>Explore the course '))
    .replace(/Около (\d+) мин чтения/g, local('Unos $1 min de lectura', 'About $1 min read'))
    .replace(/href="\/students\/"/g, 'href="' + prefix + '/students/"')
    .replace(/href="\/resources\/"/g, 'href="' + prefix + '/resources/"'));
  await write('/', local('Español para la vida real', 'Spanish for real life'), local('Curso grabado de español y clases privadas con Natali.', 'Self-paced Spanish and private lessons with Natali.'), localizedHome, true);

  const descriptions = JSON.parse(await readFile('content/' + filePrefix + '-resources.json', 'utf8'));
  const topics = { start: local('Desde cero', 'From scratch'), conversation: local('Conversación', 'Conversation'), grammar: local('Gramática', 'Grammar'), practice: local('Práctica autónoma', 'Independent practice'), culture: local('Vida y cultura', 'Life and culture') };
  const filters = [['all', local('Todos', 'All'), ordered.length], ...clusters.map(c => [c.id, topics[c.id], ordered.filter(a => clusterFor(a) === c).length])]
    .map(([id, label, count]) => `<button type="button" data-cluster="${id}" aria-pressed="${id === 'all'}">${esc(label)} <span>${count}</span></button>`).join('');
  const entries = ordered.map(a => {
    const [title, description] = descriptions[a.route.split('/')[2]];
    const topic = clusterFor(a).id;
    const featured = a.route === '/resources/spanish-from-zero/';
    return `<article class="journal-entry${featured ? ' journal-featured' : ''}" data-topic="${topic}"${featured ? ' data-featured' : ''}><a class="journal-link" href="${a.route}" hreflang="ru">${featured ? `<div class="journal-cover" aria-hidden="true"><span>Español con Natali</span><strong>Español<br>desde cero.</strong><span>01 — ${topics.start}</span></div>` : ''}<span class="journal-topic">${topics[topic]}</span><div class="journal-text"><h2>${esc(title)}</h2><p>${esc(description)}</p></div><span class="journal-time"><time class="journal-date" datetime="${a.publishedAt}">${publicationDate.format(new Date(a.publishedAt))}</time>${local('En ruso', 'In Russian')} · ${readingTimes.get(a.route)} min <span class="journal-arrow" aria-hidden="true">↗</span></span></a></article>`;
  }).join('');
  const libraryTitle = local('Recursos gratuitos', 'Free resources');
  const libraryIntro = local(
    'Explicaciones, ejemplos y práctica sin registro. Los títulos y resúmenes de esta biblioteca están en español. Cada enlace abre el artículo completo en ruso.',
    'Explanations, examples and practice without signing up. Browse the titles and summaries in English, then follow a link to read the full article in Russian.'
  );
  await write('/resources/', libraryTitle, local('Guías y ejercicios de español para rusohablantes.', 'Spanish guides and exercises for Russian speakers.'),
    `<section class="library-hero wrap"><p class="label">${libraryTitle}</p><div class="library-intro"><h1>${local('Español para<br>tu vida.', 'Spanish for<br>everyday life.')}</h1><p>${libraryIntro}</p></div></section><section class="journal wrap" aria-label="${local('Artículos de español', 'Spanish articles')}"><div class="article-filters" role="group" aria-label="${local('Temas', 'Topics')}" hidden>${filters}</div><p class="journal-count" role="status" aria-live="polite">${local('Materiales', 'Resources')}: ${ordered.length}</p><div class="journal-list">${entries}</div></section>${jobsTeaser(language)}`, false);

  await write(lifeRoute, local('Vida en España','Life in Spain'), local('Recursos prácticos para la vida en España.','Practical resources for life in Spain.'), renderLife(language), false);
  if (language === 'es') {
    await write(jobsRoute, 'Vacantes en España, con contexto', 'Selección independiente de vacantes en España, con fuentes, fechas y filtros por ciudad, provincia y sector.', renderJobs(jobsData, 'es'), false);
    for(const job of jobsData.jobs) await write(jobsRoute+job.id+'/', job.titleEs+' — '+job.employer, job.tasksRu, renderJobDetail(jobsData,job,'es'),false);
  }

  const originalReviews = reviewRows.replaceAll('class="student-story-copy"', 'class="student-story-copy" lang="ru"')
    .replaceAll('Фрагмент сообщения · ', local('Fragmento del mensaje · ', 'Message excerpt · '))
    .replaceAll('Открыть полностью ↗', local('Ver original en ruso ↗', 'See original in Russian ↗'))
    .replaceAll('Открыть изображение отзыва: ', local('Abrir la captura del testimonio de ', 'Open the screenshot of a review by '))
    .replaceAll('alt="Сообщение ', local('alt="Mensaje de ', 'alt="Message from '));
  const studentTitle = local('Testimonios', 'Testimonials');
  const studentLead = local('Los estudiantes cuentan su experiencia con Español con Natali. Podés leer sus mensajes originales en ruso y ver las capturas.', 'Students share their experience with Español con Natali. Read their original messages in Russian and see the screenshots.');
  const context = local(
    `Los testimonios corresponden a distintas ediciones. Las menciones a grupos, WhatsApp o devoluciones describen la experiencia de cada autor. Consultá <a href="${prefix}/#course">el formato actual del curso</a>.`,
    `These reviews come from different editions of the course. Mentions of groups, WhatsApp or feedback reflect each student’s experience. See <a href="${prefix}/#course">the current course format</a>.`
  );
  await write('/students/', studentTitle, local('Experiencias de estudiantes de Español con Natali.', 'Student experiences at Español con Natali.'),
    `<section class="students-page wrap"><header class="students-intro"><p class="label">Español con Natali · ${studentTitle}</p><h1>${local('Cada alumno tiene<br>su propia historia.', 'Every student has<br>a story of their own.')}</h1><p class="students-lead">${studentLead}</p><p class="students-context">${context}</p></header><div class="student-stories">${originalReviews}</div></section>`, true);
}
