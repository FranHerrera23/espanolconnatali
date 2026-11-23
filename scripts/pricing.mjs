import { renderHeader } from './site-navigation.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { esc } from './markdown.mjs';
import { faqSchema, renderFaq } from './product-faq.mjs';

export const pricingRoutes = { ru: '/pricing/', en: '/en/pricing/', es: '/es/pricing/' };

const localized = {
  ru: {
    title: 'Цены на обучение', faq: 'Частые вопросы', home: 'На главную', langs: 'Язык',
    plans: [
      ['Курс испанского с нуля', 'USD 179 · один платёж', 'Пять модулей, десять видеоуроков, задания и материалы в личном кабинете. Две встречи с Натали по 20 минут и 60 минут разговорной практики с ИИ. Уроки проходите в своём темпе.', 'Узнать о записи и оплате', 'course/#payment-help', 'Сколько стоит весь курс?'],
      ['Индивидуальные занятия с Натали', 'USD 650 за 12 занятий', 'Четыре занятия в месяц в течение трёх месяцев. Натали подстраивает занятия под ваш уровень и цели.', 'Уточнить наличие мест', 'private-lessons/#availability', 'Сколько стоят индивидуальные занятия?'],
      ['En Confianza · ИИ-репетитор', 'Скоро', 'Разговорная практика на испанском с ИИ и подсказками на русском. Запись в лист ожидания бесплатна.', 'В лист ожидания', 'tutor/', 'Когда откроется En Confianza?']
    ]
  },
  en: {
    title: 'Pricing', faq: 'Frequently asked questions', home: 'Back to home', langs: 'Language',
    plans: [
      ['Spanish from scratch', 'USD 179 · one-time payment', 'Five modules, ten video lessons, assignments and materials in the campus. Includes two 20-minute meetings with Natali and 60 minutes of AI conversation practice. Study at your own pace.', 'Ask about enrolment and payment', 'course/#payment-help', 'How much does the full course cost?'],
      ['Private lessons with Natali', 'USD 650 for 12 lessons', 'Four lessons per month for three months. Natali tailors the lessons to your level and goals.', 'Check availability', 'private-lessons/#availability', 'How much do private lessons cost?'],
      ['En Confianza · AI Tutor', 'Coming soon', 'Spanish conversation practice with an AI tutor and help in Russian. The waitlist is free to join.', 'Join the waitlist', 'tutor/', 'When does En Confianza open?']
    ]
  },
  es: {
    title: 'Precios', faq: 'Preguntas frecuentes', home: 'Ir al inicio', langs: 'Idioma',
    plans: [
      ['Español desde cero', 'USD 179 · pago único', 'Cinco módulos, diez videoclases, tareas y materiales en el campus. Incluye dos encuentros de 20 minutos con Natali y 60 minutos de conversación con IA. Avanzá a tu ritmo.', 'Consultar inscripción y pago', 'course/#payment-help', '¿Cuánto cuesta el curso completo?'],
      ['Clases privadas con Natali', 'USD 650 por 12 clases', 'Cuatro clases por mes durante tres meses. Natali adapta las clases a tu nivel y tus objetivos.', 'Consultar disponibilidad', 'private-lessons/#availability', '¿Cuánto cuestan las clases privadas?'],
      ['En Confianza · tutora con IA', 'Próximamente', 'Práctica de conversación en español con IA y ayuda en ruso. Anotarte en la lista es gratis.', 'Sumarme a la lista de espera', 'tutor/', '¿Cuándo abre En Confianza?']
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
    const description = c.plans.map(([name, price]) => name + ' — ' + price).join('. ');
    const faqs = c.plans.map(([, price, detail, , , question]) => [question, price + '. ' + detail]);
    const schema = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebPage', '@id': canonical + '#page', name: c.title, url: canonical, inLanguage: lang, description },
      faqSchema(canonical, faqs)
    ] }).replaceAll('<', '\\u003c');
    const cards = c.plans.map(([name, price, detail, action, href]) => `<article class="tw-panel course-checkout">
<h2>${esc(name)}</h2><p class="course-amount">${esc(price)}</p><p>${esc(detail)}</p><a class="button" href="${home + href}"${href.endsWith('#payment-help') ? ' data-payment-help' : ''}>${esc(action)} <span aria-hidden="true">↗</span></a></article>`).join('');
    await mkdir(out + route, { recursive: true });
    await writeFile(out + route + 'index.html', `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(c.title)} — Español con Natali</title><meta name="description" content="${esc(description)}">
<meta name="robots" content="${production ? 'index,follow,max-image-preview:large' : 'noindex,follow'}">
<link rel="canonical" href="${canonical}">${alternates}<meta property="og:url" content="${canonical}"><script type="application/ld+json">${schema}</script>
<link rel="stylesheet" href="/design-system.css"><link rel="stylesheet" href="/tutor-waitlist.css"><link rel="stylesheet" href="/course.css"></head>
<body>${renderHeader(lang, '/pricing/')}
<main class="tw-main"><div class="course-intro"><h1>${esc(c.title)}</h1></div><div class="pricing-grid">${cards}</div>${renderFaq(c.faq, faqs)}</main>
<footer class="tw-footer"><a href="${home}">${esc(c.home)}</a></footer></body></html>`);
  }
}
