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
    privateTitle: "Индивидуальные занятия испанским с Натали",
    heading: "Как сказать по-испански именно то, что вы имеете в виду?",
    privateIntro: "На встрече вы понимаете, о чём просит клиент. Сложнее спокойно ответить: «К этому сроку мы не успеем». Принесите этот разговор на занятие с Натали и попробуйте разные ответы до самой встречи.",
    price: "За все 12 занятий, оплата заранее.",
    pace: "Четыре занятия в месяц, минимум три месяца.",
    cta: "Узнать о свободных местах",
    practice: "Клиент просит сдать работу раньше.",
    scene: "Хочется сохранить хорошие отношения и всё же договориться о реальном сроке. Попробуйте произнести эту фразу вслух.",
    reply: "А если клиент настаивает? Натали сыграет его роль. Вы попробуете ответить ещё раз, подберёте тон и найдёте слова, которые вам самому удобно произнести.",
    continuityTitle: "Программа начинается с вашего ближайшего разговора.",
    continuity: "Все двенадцать занятий ведёт Натали. Можно принести предложение для клиента, письмо, которое получилось резковатым, или вспомнить звонок, когда пришлось перейти на другой язык. За три месяца вы успеете отрепетировать разговор, попробовать фразу в деле и обсудить на следующем занятии, что вам ответили.",
    mentorTitle: "Почему с Натали?",
    mentor: "Натали прожила в Испании почти восемь лет. Она окончила медицинский университет по специальности «стоматология» и работала медицинским представителем в GSK и Dr. Reddy’s. Сегодня она руководит своей школой и инвестирует в недвижимость в Дубае. Когда вы обсуждаете на занятии переговоры, она понимает, почему иногда важна не только сама цена, но и то, как её назвать.",
    format: "Один на один · Испанский для работы"
  },
  es: {
    start: 'Ir al inicio', skip: 'Ir al contenido',
    aboutTitle: 'Sobre Natali', aboutIntro: 'Natali es profesora de español y fundadora de Español con Natali.',
    privateTitle: "Clases privadas de español con Natali",
    heading: "Que en español también suenes a vos.",
    privateIntro: "En una reunión entendés lo que te piden. Lo difícil es decir «ese plazo no es posible» con la calma que tenés en tu idioma. Traé esa conversación a clase. La ensayamos antes de que llegue el día.",
    price: "Por las 12 clases, en un pago anticipado.",
    pace: "Cuatro clases al mes durante un mínimo de tres meses.",
    cta: "Consultar disponibilidad",
    practice: "Un cliente te pide adelantar la entrega.",
    scene: "Querés cuidar la relación y sostener lo que acordaron. Probá decir esto en voz alta.",
    reply: "Si el cliente insiste, Natali hace de interlocutora. Probás otra respuesta, ajustás el tono y elegís las palabras que usarías de verdad.",
    continuityTitle: "Tu próxima conversación marca el programa.",
    continuity: "Trabajás con Natali en las doce clases. Puede ser una propuesta que vas a presentar, un correo que sonó demasiado seco o una llamada en la que terminaste cambiando de idioma. Los tres meses dan tiempo para ensayar, usar la frase en el trabajo y volver con la respuesta que recibiste.",
    mentorTitle: "Por qué practicarlo con Natali",
    mentor: "Natali vivió casi ocho años en España. Estudió Medicina, se graduó en Odontología y trabajó como representante médica para GSK y Dr. Reddy’s. Hoy dirige su escuela e invierte en inmuebles en Dubái. Cuando le traés una negociación, entiende por qué importa tanto cómo decís una cifra como la cifra misma.",
    format: "Clases individuales · Español para profesionales"
  },
  en: {
    start: 'Back to home', skip: 'Skip to content',
    aboutTitle: 'About Natali', aboutIntro: 'Natali teaches Spanish and founded Español con Natali.',
    privateTitle: "Private Spanish lessons with Natali",
    heading: "Sound like yourself in Spanish.",
    privateIntro: "You understand what your client is asking. The hard part is saying “that deadline won’t work” as calmly as you would in your own language. Bring that conversation to class and rehearse it before the meeting.",
    price: "For all 12 lessons, paid upfront.",
    pace: "Four lessons a month for a minimum of three months.",
    cta: "Check availability",
    practice: "A client asks for an earlier delivery.",
    scene: "You want to keep the relationship and the deadline you agreed on. Try saying this out loud.",
    reply: "If the client pushes back, Natali plays their part. Try another answer, listen to how it lands and choose words you would actually use.",
    continuityTitle: "Your next conversation shapes the lesson.",
    continuity: "Natali teaches all twelve sessions. Bring a proposal you’re about to present, an email that sounded too abrupt or a call where you switched languages halfway through. Three months gives you time to rehearse, try it at work and come back with the reply you got.",
    mentorTitle: "Why practise with Natali?",
    mentor: "Natali lived in Spain for nearly eight years. She studied medicine, qualified as a dentist and worked as a medical representative for GSK and Dr. Reddy’s. Today she runs her school and invests in property in Dubai. When you bring her a negotiation, she understands why the way you name your price matters as much as the number.",
    format: "One-to-one lessons · Spanish for professionals"
  }
};

function renderPrivateLessons(lang, c) {
  return `<section class="private-hero">
<div class="program-intro"><p class="private-format">${esc(c.format)}</p><h1>${esc(c.heading)}</h1><p>${esc(c.privateIntro)}</p></div>
<div class="private-price"><p class="program-price">USD 650</p><p class="program-terms">${esc(c.price)}</p><p>${esc(c.pace)}</p>
<a class="button" href="#availability">${esc(c.cta)} <span aria-hidden="true">↓</span></a></div></section>
<section class="private-practice"><div><h2>${esc(c.practice)}</h2><p>${esc(c.scene)}</p></div><div class="private-dialogue"><blockquote lang="es">«El jueves puedo enviarte una primera versión. ¿Te sirve si cerramos el resto el lunes?»</blockquote><p>${esc(c.reply)}</p></div></section>
<section class="private-continuity"><h2>${esc(c.continuityTitle)}</h2><p>${esc(c.continuity)}</p></section>
<section class="private-mentor"><img src="/assets/natali-archive/DS-lCcwDdTr.jpg" alt="Natali · Barcelona" width="720" height="960" loading="lazy"><div><h2>${esc(c.mentorTitle)}</h2><p>${esc(c.mentor)}</p></div></section>
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
