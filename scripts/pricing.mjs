import { renderHeader, renderReviewsLink } from './site-navigation.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { esc } from './markdown.mjs';
import { faqSchema, renderFaq } from './product-faq.mjs';

export const pricingRoutes = { ru: '/pricing/', en: '/en/pricing/', es: '/es/pricing/' };

const localized = {
  ru: {
    title: 'Программы', heading: 'Как вам удобнее учить испанский?', home: 'На главную', skip: 'К содержанию',
    intro: 'Учитесь в своём темпе или разберите с Натали разговоры, которые вам предстоят на работе.',
    course: ['В своём темпе', 'Испанский с нуля', 'USD 179', 'Один платёж', 'Десять видеоуроков в пяти модулях. Задания и материалы в личном кабинете, две встречи с Натали по 20 минут и 60 минут практики в En Confianza.', 'Посмотреть курс и личный кабинет'],
    individual: ['Один на один', 'Рабочий испанский с Натали', 'USD 650', 'За 12 занятий, полная предоплата', 'Разберите разговоры с клиентами, встречи и переговоры. Четыре занятия в месяц, минимум три месяца.', 'Как проходят индивидуальные занятия'],
    reviews: 'Как учились другие', proof: 'Ученики рассказывают, как проходили курс и что им помогло.',
    soon: 'Скоро · En Confianza', tutor: 'Лист ожидания разговорной практики с ИИ',
    faq: 'Частые вопросы', questions: [
      ['С какого курса начать, если я новичок?', 'Курс в записи начинается с чтения и простых фраз. Объяснения на русском, а примеры и практика на испанском.'],
      ['Можно ли готовиться к конкретной встрече с клиентом?', 'Да. На индивидуальных занятиях с Натали можно отработать ситуацию из вашей работы, например обсудить сроки или ответить на возражение.']
    ]
  },
  en: {
    title: 'Programs', heading: 'How would you like to learn Spanish?', home: 'Back to home', skip: 'Skip to content',
    intro: 'Study at your own pace or work with Natali on the conversations you need for work.',
    course: ['At your own pace', 'Spanish from scratch', 'USD 179', 'One-time payment', 'Ten video lessons in five modules. Assignments and materials in the student portal, two 20-minute meetings with Natali and 60 minutes of practice in En Confianza.', 'Explore the course and student portal'],
    individual: ['One to one', 'Spanish for work with Natali', 'USD 650', 'For 12 lessons, paid upfront', 'Practise client conversations, meetings and negotiations. Four lessons per month for a minimum of three months.', 'See how private lessons work'],
    reviews: 'What students say', proof: 'Hear how students worked through the course and what helped them.',
    soon: 'Coming soon · En Confianza', tutor: 'Join the AI conversation waitlist',
    faq: 'Frequently asked questions', questions: [
      ['Where should I start as a beginner?', 'The recorded course starts with reading and simple phrases. Explanations are in Russian, with examples and practice in Spanish.'],
      ['Can I prepare for a specific client meeting?', 'Yes. In private lessons with Natali, you can rehearse a real conversation from your work, such as discussing deadlines or handling an objection.']
    ]
  },
  es: {
    title: 'Programas', heading: '¿Cómo querés aprender español?', home: 'Ir al inicio', skip: 'Ir al contenido',
    intro: 'Avanzá a tu ritmo o trabajá con Natali las conversaciones que necesitás para tu trabajo.',
    course: ['A tu ritmo', 'Español desde cero', 'USD 179', 'Pago único', 'Diez videoclases en cinco módulos. Tareas y materiales en el campus, dos encuentros de 20 minutos con Natali y 60 minutos de práctica en En Confianza.', 'Ver el curso y el campus'],
    individual: ['Uno a uno', 'Español para el trabajo con Natali', 'USD 650', 'Por 12 clases, pago total por adelantado', 'Practicá conversaciones con clientes, reuniones y negociaciones. Cuatro clases por mes, con un mínimo de tres meses.', 'Ver cómo son las clases privadas'],
    reviews: 'Lo que cuentan los alumnos', proof: 'Conocé cómo hicieron el curso y qué les sirvió para aprender.',
    soon: 'Próximamente · En Confianza', tutor: 'Lista de espera para practicar con IA',
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
    const offers = [[c.course, 'course/', 'primary'], [c.individual, 'private-lessons/', 'individual']];
    const cards = offers.map(([copy, href, style]) => {
      const [mode, name, price, terms, detail, action] = copy.map(esc);
      return `<article class="program-offer program-offer--${style}">
<p class="label">${mode}</p><h2>${name}</h2><p class="program-price">${price}</p>
<p class="program-terms">${terms}</p><p>${detail}</p><a class="${style === 'primary' ? 'button' : 'link'}" href="${home + href}">${action} <span aria-hidden="true">↗</span></a></article>`;
    }).join('');
    await mkdir(out + route, { recursive: true });
    await writeFile(out + route + 'index.html', `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(c.title)} — Español con Natali</title><meta name="description" content="${esc(c.intro)}">
<meta name="robots" content="${production ? 'index,follow,max-image-preview:large' : 'noindex,follow'}">
<link rel="canonical" href="${canonical}">${alternates}<meta property="og:url" content="${canonical}"><script type="application/ld+json">${schema}</script>
<link rel="stylesheet" href="/design-system.css"><link rel="stylesheet" href="/tutor-waitlist.css"><link rel="stylesheet" href="/course.css"></head>
<body><a class="skip" href="#main">${esc(c.skip)}</a>${renderHeader(lang, '/pricing/')}
<main class="tw-main program-page" id="main"><header class="program-intro"><h1>${esc(c.heading)}</h1><p>${esc(c.intro)}</p></header>
<div class="program-offers">${cards}</div>
<section class="program-note"><h2>${esc(c.reviews)}</h2><p>${esc(c.proof)}</p>${renderReviewsLink(lang)}</section>
<aside class="program-note"><p><strong>${esc(c.soon)}</strong></p><a class="link" href="${home}tutor/">${esc(c.tutor)} <span aria-hidden="true">↗</span></a></aside>
${renderFaq(c.faq, c.questions)}</main>
<footer class="tw-footer"><a href="${home}">${esc(c.home)}</a>${renderReviewsLink(lang)}</footer></body></html>`);
  }
}
