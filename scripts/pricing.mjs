import { publicDesignHead, renderHeader } from './site-navigation.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { esc } from './markdown.mjs';
import { faqSchema, renderFaq } from './product-faq.mjs';

export const pricingRoutes = { ru: '/pricing/', en: '/en/pricing/', es: '/es/pricing/' };

const localized = {
  ru: {
    title: 'Программы', heading: 'Программы испанского', home: 'На главную', skip: 'К содержанию',
    intro: 'Учитесь в своём темпе или разберите с Натали разговоры, которые вам предстоят на работе.',
    course: ['В своём темпе', 'Испанский с нуля', 'USD 179', 'Один платёж', 'Десять видеоуроков в пяти модулях. Задания и материалы в личном кабинете, две встречи с Натали по 20 минут и 60 минут практики в En Confianza.', 'Посмотреть курс и личный кабинет'],
    individual: ['Один на один', 'Рабочий испанский с Натали', 'USD 650', 'За 12 занятий, полная предоплата', 'Разберите разговоры с клиентами, встречи и переговоры. Четыре занятия в месяц, минимум три месяца.', 'Как проходят индивидуальные занятия'],
    reviews: 'Людмила, ученица курса', proof: 'Получение знания помогли в путешествии по Испании.',
    soon: 'En Confianza как отдельная программа', tutor: 'Записаться в лист ожидания En Confianza',
    faq: 'Частые вопросы', questions: [
      ['С какого курса начать, если я новичок?', 'Курс в записи начинается с чтения и простых фраз. Объяснения на русском, а примеры и практика на испанском.'],
      ['Можно ли готовиться к конкретной встрече с клиентом?', 'Да. На индивидуальных занятиях с Натали можно отработать ситуацию из вашей работы, например обсудить сроки или ответить на возражение.']
    ]
  },
  en: {
    title: 'Programs', heading: 'Spanish programs', home: 'Back to home', skip: 'Skip to content',
    intro: 'Study at your own pace or work with Natali on the conversations you need for work.',
    course: ['At your own pace', 'Spanish from scratch', 'USD 179', 'One-time payment', 'Ten video lessons in five modules. Assignments and materials in the student portal, two 20-minute meetings with Natali and 60 minutes of practice in En Confianza.', 'Explore the course and student portal'],
    individual: ['One to one', 'Spanish for work with Natali', 'USD 650', 'For 12 lessons, paid upfront', 'Practise client conversations, meetings and negotiations. Four lessons per month for a minimum of three months.', 'See how private lessons work'],
    reviews: 'Liudmila, course student · Translated from Russian', proof: 'What I learned helped me on my trip to Spain.',
    soon: 'En Confianza as a standalone program', tutor: 'Join the En Confianza waitlist',
    faq: 'Frequently asked questions', questions: [
      ['Where should I start as a beginner?', 'The recorded course starts with reading and simple phrases. Explanations are in Russian, with examples and practice in Spanish.'],
      ['Can I prepare for a specific client meeting?', 'Yes. In private lessons with Natali, you can rehearse a real conversation from your work, such as discussing deadlines or handling an objection.']
    ]
  },
  es: {
    title: 'Programas', heading: 'Programas de español', home: 'Ir al inicio', skip: 'Ir al contenido',
    intro: 'Avanzá a tu ritmo o trabajá con Natali las conversaciones que necesitás para tu trabajo.',
    course: ['A tu ritmo', 'Español desde cero', 'USD 179', 'Pago único', 'Diez videoclases en cinco módulos. Tareas y materiales en el campus, dos encuentros de 20 minutos con Natali y 60 minutos de práctica en En Confianza.', 'Ver el curso y el campus'],
    individual: ['Uno a uno', 'Español para el trabajo con Natali', 'USD 650', 'Por 12 clases, pago total por adelantado', 'Practicá conversaciones con clientes, reuniones y negociaciones. Cuatro clases por mes, con un mínimo de tres meses.', 'Ver cómo son las clases privadas'],
    reviews: 'Liudmila, alumna del curso · Traducción del ruso', proof: 'Lo que aprendí me sirvió en mi viaje por España.',
    soon: 'En Confianza como programa independiente', tutor: 'Avisame cuando abra En Confianza',
    faq: 'Preguntas frecuentes', questions: [
      ['¿Por dónde empiezo si nunca estudié?', 'El curso grabado arranca con lectura y frases simples. Las explicaciones están en ruso, con ejemplos y práctica en español.'],
      ['¿Puedo preparar una reunión con un cliente?', 'Sí. En las clases privadas con Natali podés ensayar una situación de tu trabajo, como hablar de plazos o responder una objeción.']
    ]
  }
};

export async function buildPricing({ out, base, production }) {
  const alternates = Object.entries(pricingRoutes).map(([code, path]) =>
    `<link rel="alternate" hreflang="${code}" href="${base + path}">`).join('');
  for (const [lang, c] of Object.entries(localized)) {
    const route = pricingRoutes[lang];
    const home = lang === 'ru' ? '/' : '/' + lang + '/';
    const canonical = base + route;
    const schema = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebPage', '@id': canonical + '#page', name: c.title, url: canonical, inLanguage: lang, description: c.intro },
      faqSchema(canonical, c.questions)
    ] }).replaceAll('<', '\\u003c');
    const offers = [
      [c.course, 'course/', 'spanish-from-zero'],
      [c.individual, 'private-lessons/', 'work-email']
    ];
    const programs = offers.map(([copy, href, image]) => {
      const [mode, name, price, terms, detail, action] = copy.map(esc);
      return `<article class="program-offer">
<img class="program-photo" src="/assets/editorial/covers/${image}.webp" width="800" height="600" alt="" decoding="async">
<div class="program-copy"><p class="label">${mode}</p><h2>${name}</h2><p>${detail}</p></div>
<div class="program-decision"><p class="program-price">${price}</p><p>${terms}</p>
<a class="link" href="${home + href}">${action} <span aria-hidden="true">→</span></a></div></article>`;
    }).join('');
    await mkdir(out + route, { recursive: true });
    await writeFile(out + route + 'index.html', `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(c.title)} — Español con Natali</title><meta name="description" content="${esc(c.intro)}">
<meta name="robots" content="${production ? 'index,follow,max-image-preview:large' : 'noindex,follow'}">
<link rel="canonical" href="${canonical}">${alternates}<meta property="og:url" content="${canonical}"><script type="application/ld+json">${schema}</script>
${publicDesignHead}<link rel="stylesheet" href="/tutor-waitlist.css"><link rel="stylesheet" href="/course.css"></head>
<body><a class="skip" href="#main">${esc(c.skip)}</a>${renderHeader(lang, '/pricing/')}
<main class="tw-main program-page" id="main"><header class="program-intro"><h1>${esc(c.heading)}</h1></header>
<div class="program-offers">${programs}</div>
<figure class="program-quote"><blockquote>«${esc(c.proof)}»</blockquote><figcaption>${esc(c.reviews)} · <a href="${home}students/#review-13">${lang === 'es' ? 'Ver el mensaje original' : lang === 'en' ? 'Read the original message' : 'Прочитать сообщение'}</a></figcaption></figure>
${renderFaq(c.faq, c.questions)}
<aside class="program-upcoming"><p>${esc(c.soon)}</p><a class="link" href="${home}tutor/">${esc(c.tutor)} <span aria-hidden="true">→</span></a></aside></main>
<footer class="tw-footer"><a href="${home}">${esc(c.home)}</a></footer></body></html>`);
  }
}
