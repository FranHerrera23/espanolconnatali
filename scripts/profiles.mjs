import { renderHeader, renderReviewsLink } from './site-navigation.mjs';
import { renderAboutStory } from './about-story.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { esc } from './markdown.mjs';
import { renderPaymentHelp } from './payment-help.mjs';

const locales = { ru: 'Русский', es: 'Español', en: 'English' };
const pages = ['about-natali', 'private-lessons'];
const home = lang => lang === 'ru' ? '/' : '/' + lang + '/';
const route = (lang, page) => home(lang) + page + '/';
export const profileRoutes = Object.keys(locales).flatMap(lang => pages.map(page => route(lang, page)));

const copy = {
  ru: {
    start: 'На главную', skip: 'Перейти к содержанию',
    aboutTitle: 'О Натали', aboutIntro: 'Натали — основательница Español con Natali и преподаватель испанского.',
    privateTitle: 'Рабочий испанский с Натали',
    privateIntro: 'Для тех, кто ведёт свой бизнес или работает с клиентами. Натали сама проводит занятия один на один. Вместе вы разбираете разговоры, которые нужны вам в работе.',
    price: 'За 12 занятий. Полная предоплата.',
    pace: 'Четыре занятия в месяц, минимум три месяца.',
    cta: 'Уточнить наличие мест',
    practice: 'Что можно разобрать на занятии',
    scenes: [
      ['Начать встречу', 'Коротко представить тему и договориться о ходе разговора.'],
      ['Уточнить условия', 'Переспросить, что входит в предложение, и согласовать сроки.'],
      ['Ответить на возражение', 'Выяснить, что беспокоит клиента, и предложить следующий шаг.']
    ],
    continuity: 'Вы вместе с Натали выбираете цель и темп. На следующем занятии возвращаетесь к тому, что ещё трудно, и пробуете новую ситуацию.'
  },
  es: {
    start: 'Ir al inicio', skip: 'Ir al contenido',
    aboutTitle: 'Sobre Natali', aboutIntro: 'Natali es profesora de español y fundadora de Español con Natali.',
    privateTitle: 'Español para el trabajo con Natali',
    privateIntro: 'Para quienes llevan un negocio o trabajan con clientes. Las clases son individuales, con Natali. Practicá en español las conversaciones que necesitás para tu trabajo.',
    price: 'Por 12 clases. Pago total por adelantado.',
    pace: 'Cuatro clases por mes, con un mínimo de tres meses.',
    cta: 'Consultar disponibilidad',
    practice: 'Qué podés practicar en una sesión',
    scenes: [
      ['Abrir una reunión', 'Presentar el tema y acordar cómo van a llevar la conversación.'],
      ['Aclarar condiciones', 'Preguntar qué incluye una propuesta y acordar plazos.'],
      ['Responder una objeción', 'Entender qué le preocupa al cliente y proponer un próximo paso.']
    ],
    continuity: 'Elegís con Natali el objetivo y el ritmo. En la clase siguiente retoman lo que todavía cuesta y lo llevan a otra situación.'
  },
  en: {
    start: 'Back to home', skip: 'Skip to content',
    aboutTitle: 'About Natali', aboutIntro: 'Natali teaches Spanish and founded Español con Natali.',
    privateTitle: 'Spanish for work with Natali',
    privateIntro: 'For people who run a business or work with clients. Natali teaches you one to one, using conversations you need for your work.',
    price: 'For 12 lessons. Paid in full upfront.',
    pace: 'Four lessons per month for a minimum of three months.',
    cta: 'Check availability',
    practice: 'What you can practise in a session',
    scenes: [
      ['Open a meeting', 'Introduce the topic and agree on what you’d like to cover.'],
      ['Clarify terms', 'Ask what a proposal includes and agree on deadlines.'],
      ['Handle an objection', 'Find out what concerns a client and propose a next step.']
    ],
    continuity: 'Choose your goals and pace with Natali. In the next lesson, revisit anything you found hard and try it in a new situation.'
  }
};

function renderPrivateLessons(lang, c) {
  const phrases = ['Para empezar, propongo que revisemos los plazos.', '¿Podrías aclararme qué incluye el presupuesto?', 'Entiendo tu preocupación. ¿Qué plazo te funcionaría?'];
  const scenes = c.scenes.map(([heading, detail], index) => `<li><strong>${esc(heading)}</strong><p>${esc(detail)}</p><span lang="es">«${esc(phrases[index])}»</span></li>`).join('');
  return `<section class="private-hero">
<div class="program-intro"><h1>${esc(c.privateTitle)}</h1><p>${esc(c.privateIntro)}</p></div>
<div class="private-price"><p class="program-price">USD 650</p><p class="program-terms">${esc(c.price)}</p><p>${esc(c.pace)}</p>
<a class="button" href="#availability">${esc(c.cta)} <span aria-hidden="true">↓</span></a></div></section>
<section class="private-practice"><h2>${esc(c.practice)}</h2><ul class="private-scenes">${scenes}</ul><p>${esc(c.continuity)}</p></section>
${renderPaymentHelp(lang, 'private-lessons')}`;
}

export async function buildProfiles({ out, base, production }) {
  for (const [lang, c] of Object.entries(copy)) {
    for (const page of pages) {
      const about = page === 'about-natali';
      const path = route(lang, page);
      const canonical = base + path;
      const title = about ? c.aboutTitle : c.privateTitle;
      const description = about ? c.aboutIntro : c.privateIntro + ' USD 650. ' + c.price + ' ' + c.pace;
      const alternates = Object.keys(locales).map(code =>
        `<link rel="alternate" hreflang="${code}" href="${base + route(code, page)}">`).join('');
      const topic = about
        ? { '@type': 'Person', '@id': base + '/#natali', name: 'Natali', url: base + '/about-natali/' }
        : { '@type': 'Service', '@id': canonical + '#lessons', name: title, description, provider: { '@id': base + '/#natali' } };
      const schema = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
        { '@type': 'WebPage', '@id': canonical + '#page', url: canonical, name: title, inLanguage: lang, mainEntity: { '@id': topic['@id'] } }, topic
      ] }).replaceAll('<', '\\u003c');
      await mkdir(out + path, { recursive: true });
      await writeFile(out + path + 'index.html', `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Español con Natali</title><meta name="description" content="${esc(description)}"><meta name="robots" content="${production ? 'index,follow' : 'noindex,follow'}">
<link rel="canonical" href="${canonical}">${alternates}<meta property="og:url" content="${canonical}"><script type="application/ld+json">${schema}</script>
<link rel="stylesheet" href="/design-system.css"><link rel="stylesheet" href="/tutor-waitlist.css"><link rel="stylesheet" href="/course.css">${about ? '<link rel="stylesheet" href="/about-story.css">' : ''}</head>
<body><a class="skip" href="#main">${esc(c.skip)}</a>${renderHeader(lang, '/' + page + '/')}
<main class="tw-main" id="main">${about ? renderAboutStory(lang) : renderPrivateLessons(lang, c)}</main>
<footer class="tw-footer"><a href="${home(lang)}">${esc(c.start)}</a>${renderReviewsLink(lang)}</footer>${about ? '' : '<script type="module" src="/course-payment-help.js"></script>'}</body></html>`);
    }
  }
}
