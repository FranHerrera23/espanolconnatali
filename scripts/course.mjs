import { mkdir, writeFile } from 'node:fs/promises';
import { esc } from './markdown.mjs';

export const courseRoutes = { ru: '/course/', en: '/en/course/' };

const course = {
  ru: {
    title: 'Испанский с нуля для русскоязычных',
    description: 'Десять видеоуроков с объяснениями на русском, упражнения, домашние задания и заключительное 30-минутное занятие с Натали.',
    home: 'На главную', library: 'Открытая библиотека', libraryPath: '/resources/',
    label: 'Курс в записи', checkout: 'Купить курс на Gumroad', price: 'Цена на Gumroad',
    priceNote: 'Итоговая сумма с учётом применимых налогов появится в Gumroad до оплаты.',
    syllabus: 'Что вы изучите',
    lessons: [
      'Алфавит, чтение, произношение и ударение', 'Приветствия, знакомство и простые вопросы',
      'Род, число и артикли', 'Страны, профессии и прилагательные', 'Дни недели, месяцы и времена года',
      'Числа, возраст и настоящее время', 'Ser, estar, gustar и планы с ir a',
      'Рассказ о себе и семье', 'Увлечения и свободное время', 'Разговор о погоде'
    ],
    faqTitle: 'Частые вопросы',
    faq: [
      ['Подойдёт ли курс, если я начинаю с нуля?', 'Да. Курс начинается с чтения, произношения и простых фраз. Объяснения на русском, примеры и практика на испанском.'],
      ['Как я получу доступ?', 'После покупки на Gumroad вы получите ссылку на материалы курса в Google Drive. Уроки записаны, их можно проходить в своём темпе.'],
      ['Что входит в курс?', 'Десять видеоуроков, отдельные видео для практики, упражнения и домашние задания. В конце курса предусмотрено одно 30-минутное занятие с Натали.'],
      ['Как узнать итоговую сумму?', 'Откройте страницу курса на Gumroad. До оплаты вы увидите итоговую сумму с учётом применимых налогов.']
    ]
  },
  en: {
    title: 'Spanish from scratch for Russian speakers',
    description: 'Ten video lessons taught in Russian, Spanish practice, assignments and a final 30-minute lesson with Natali.',
    home: 'Back to home', library: 'Open learning library', libraryPath: '/en/resources/',
    label: 'Self-paced course', checkout: 'Buy the course on Gumroad', price: 'Price on Gumroad',
    priceNote: 'Gumroad shows the final total, including applicable taxes, before you pay.',
    syllabus: 'What you’ll learn',
    lessons: [
      'Alphabet, reading, pronunciation and stress', 'Greetings, introductions and simple questions',
      'Gender, number and articles', 'Countries, professions and adjectives', 'Days, months and seasons',
      'Numbers, age and the present tense', 'Ser, estar, gustar and plans with ir a',
      'Talking about yourself and your family', 'Hobbies and free time', 'Talking about the weather'
    ],
    faqTitle: 'Frequently asked questions',
    faq: [
      ['Can I start as a complete beginner?', 'Yes. The course starts with reading, pronunciation and simple phrases. Explanations are in Russian, with examples and practice in Spanish.'],
      ['How do I get access?', 'After you buy through Gumroad, you receive a link to the course materials on Google Drive. The lessons are recorded so you can learn at your own pace.'],
      ['What does the course include?', 'Ten video lessons, separate practice videos, exercises and assignments. The course includes one final 30-minute lesson with Natali.'],
      ['Where can I see the final total?', 'Open the course on Gumroad. You can review the final total, including applicable taxes, before you pay.']
    ]
  }
};

export async function buildCourse({ out, base, production, checkout, coursePrice }) {
  const alternates = Object.entries(courseRoutes).map(([lang, route]) =>
    `<link rel="alternate" hreflang="${lang}" href="${base + route}">`).join('');
  for (const [lang, copy] of Object.entries(course)) {
    const route = courseRoutes[lang];
    const canonical = base + route;
    const home = lang === 'ru' ? '/' : '/en/';
    const graph = [
      { '@type': 'WebPage', '@id': canonical + '#page', url: canonical, name: copy.title, inLanguage: lang },
      { '@type': 'Course', '@id': canonical + '#course', name: copy.title,
        description: copy.description, inLanguage: 'ru', url: canonical,
        provider: { '@type': 'EducationalOrganization', '@id': base + '/#organization', name: 'Español con Natali' } },
      { '@type': 'FAQPage', '@id': canonical + '#faq', mainEntity: copy.faq.map(([name, text]) =>
        ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })) }
    ];
    const schema = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c');
    const switcher = Object.entries(courseRoutes).map(([code, href]) =>
      `<a href="${href}" lang="${code}" hreflang="${code}"${code === lang ? ' aria-current="page"' : ''}>${code === 'ru' ? 'Русский' : 'English'}</a>`).join('');
    await mkdir(out + route, { recursive: true });
    await writeFile(out + route + 'index.html', `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(copy.title)} — Español con Natali</title><meta name="description" content="${esc(copy.description)}">
<meta name="robots" content="${production ? 'index,follow,max-image-preview:large' : 'noindex,follow'}">
<link rel="canonical" href="${canonical}">${alternates}<meta property="og:url" content="${canonical}">
<script type="application/ld+json">${schema}</script>
<link rel="stylesheet" href="/design-system.css"><link rel="stylesheet" href="/tutor-waitlist.css"><link rel="stylesheet" href="/course.css"></head>
<body><a class="skip" href="#main">${lang === 'ru' ? 'Перейти к содержанию' : 'Skip to content'}</a>
<header class="tw-head course-head"><a class="brand" href="${home}"><img src="/assets/brand/natali-lynx-approved.png" alt="" width="44" height="44">Español con Natali</a>
<nav aria-label="${lang === 'ru' ? 'Язык' : 'Language'}">${switcher}</nav></header>
<main class="tw-main" id="main">
<section class="tw-grid" id="course"><div class="course-intro"><p class="label">${esc(copy.label)}</p><h1>${esc(copy.title)}</h1><p>${esc(copy.description)}</p></div>
<div class="tw-panel course-checkout"><h2>${esc(copy.price)}</h2><p class="course-amount">${esc(coursePrice)}</p>
<p>${esc(copy.priceNote)}</p><a class="button" href="${esc(checkout.href)}">${esc(copy.checkout)} <span aria-hidden="true">↗</span></a></div></section>
<section class="tw-how course-syllabus-page"><h2>${esc(copy.syllabus)}</h2><ol>${copy.lessons.map(lesson => `<li>${esc(lesson)}</li>`).join('')}</ol></section>
<section class="tw-how course-faq" id="faq"><h2>${esc(copy.faqTitle)}</h2>
${copy.faq.map(([question, answer]) => `<details><summary>${esc(question)}</summary><p>${esc(answer)}</p></details>`).join('')}</section>
</main><footer class="tw-footer"><a href="${home}">${esc(copy.home)}</a><a href="${copy.libraryPath}">${esc(copy.library)}</a></footer></body></html>`);
  }
}
