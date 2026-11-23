import { renderHeader } from './site-navigation.mjs';
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
    start: 'На главную', students: 'Отзывы учеников', skip: 'Перейти к содержанию', language: 'Язык',
    aboutTitle: 'О Натали', aboutIntro: 'Натали — основательница Español con Natali и преподаватель испанского.',
    privateTitle: 'Индивидуальный испанский с Натали',
    privateIntro: 'Занятия один на один с программой под ваш уровень, цели и график. Можно начать с нуля.',
    planTitle: 'С чего начать',
    plan: 'Напишите Натали, что вы хотите делать на испанском и когда вам удобно заниматься. Например, подготовиться к поездке, увереннее общаться после переезда или начать говорить в повседневных ситуациях.',
    priceTitle: 'Формат и стоимость', terms: '12 занятий: четыре в месяц в течение трёх месяцев. Стоимость — 650 USD, полная предоплата.',
    availability: 'Уточните свободное время и условия напрямую у Натали перед оплатой.',
    cta: 'Узнать о свободных местах'
  },
  es: {
    start: 'Ir al inicio', students: 'Testimonios de alumnos', skip: 'Ir al contenido', language: 'Idioma',
    aboutTitle: 'Sobre Natali', aboutIntro: 'Natali es profesora de español y fundadora de Español con Natali.',
    privateTitle: 'Clases privadas de español con Natali',
    privateIntro: 'Clases individuales adaptadas a tu nivel, tus objetivos y tu agenda. Podés empezar desde cero.',
    planTitle: 'Cómo empezar',
    plan: 'Contale a Natali qué querés hacer en español y cuándo podrías estudiar. Por ejemplo, preparar un viaje, ganar confianza después de una mudanza o hablar en situaciones cotidianas.',
    priceTitle: 'Modalidad y precio', terms: '12 clases: cuatro por mes durante tres meses. El programa cuesta 650 USD y se paga por adelantado.',
    availability: 'Consultá directamente con Natali los horarios disponibles y las condiciones antes de pagar.',
    cta: 'Consultar disponibilidad'
  },
  en: {
    start: 'Back to home', students: 'Student testimonials', skip: 'Skip to content', language: 'Language',
    aboutTitle: 'About Natali', aboutIntro: 'Natali teaches Spanish and founded Español con Natali.',
    privateTitle: 'Private Spanish lessons with Natali',
    privateIntro: 'One-to-one lessons built around your level, goals and schedule. Complete beginners are welcome.',
    planTitle: 'How to get started',
    plan: 'Tell Natali what you want to do in Spanish and when you can study. You might be preparing for a trip, settling into a new country or looking to speak more confidently in everyday situations.',
    priceTitle: 'Format and price', terms: '12 lessons: four per month for three months. The programme costs USD 650, paid up front.',
    availability: 'Ask Natali about available times and terms before paying.',
    cta: 'Check availability'
  }
};

export async function buildProfiles({ out, base, production }) {
  for (const [lang, c] of Object.entries(copy)) {
    for (const page of pages) {
      const about = page === 'about-natali';
      const path = route(lang, page);
      const canonical = base + path;
      const title = about ? c.aboutTitle : c.privateTitle;
      const description = about ? c.aboutIntro : c.privateIntro;
      const alternates = Object.keys(locales).map(code =>
        `<link rel="alternate" hreflang="${code}" href="${base + route(code, page)}">`).join('');
        const topic = about
        ? { '@type': 'Person', '@id': base + '/#natali', name: 'Natali', url: base + '/about-natali/' }
        : { '@type': 'Service', '@id': canonical + '#lessons', name: title, description, provider: { '@id': base + '/#natali' } };
      const schema = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
        { '@type': 'WebPage', '@id': canonical + '#page', url: canonical, name: title, inLanguage: lang, mainEntity: { '@id': topic['@id'] } }, topic
      ] }).replaceAll('<', '\\u003c');
      const panel = `<div class="tw-panel"><h2>${esc(c.priceTitle)}</h2><p>${esc(c.terms)}</p><p>${esc(c.availability)}</p><a class="button" href="#availability">${esc(c.cta)} ↓</a></div>`;
      const details = [c.plan];
      const cross = about ? 'private-lessons' : 'about-natali';
      await mkdir(out + path, { recursive: true });
      await writeFile(out + path + 'index.html', `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Español con Natali</title><meta name="description" content="${esc(description)}"><meta name="robots" content="${production ? 'index,follow' : 'noindex,follow'}">
<link rel="canonical" href="${canonical}">${alternates}<meta property="og:url" content="${canonical}"><script type="application/ld+json">${schema}</script>
<link rel="stylesheet" href="/design-system.css"><link rel="stylesheet" href="/tutor-waitlist.css"><link rel="stylesheet" href="/course.css">${about ? '<link rel="stylesheet" href="/about-story.css">' : ''}</head>
<body><a class="skip" href="#main">${esc(c.skip)}</a>${renderHeader(lang, '/' + page + '/')}
<main class="tw-main" id="main">${about ? renderAboutStory(lang) : `<section class="tw-grid"><div class="course-intro"><h1>${esc(title)}</h1><p>${esc(description)}</p></div>${panel}</section>
<section class="tw-how profile-copy"><h2>${esc(c.planTitle)}</h2>${details.map(line => `<p>${esc(line)}</p>`).join('')}
<p><a class="link" href="${route(lang, cross)}">${esc(about ? c.privateTitle : c.aboutTitle)} ↗</a></p></section>${renderPaymentHelp(lang, 'private-lessons')}`}</main>
<footer class="tw-footer"><a href="${home(lang)}">${esc(c.start)}</a><a href="${home(lang)}students/">${esc(c.students)}</a></footer>${about ? '' : '<script type="module" src="/course-payment-help.js"></script>'}</body></html>`);
    }
  }
}
