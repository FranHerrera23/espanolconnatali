import { mkdir, writeFile } from 'node:fs/promises';
import { esc } from './markdown.mjs';
import { faqSchema, renderFaq } from './product-faq.mjs';
import { paymentFaq, renderPaymentHelp } from './payment-help.mjs';

export const courseRoutes = { ru: '/course/', en: '/en/course/', es: '/es/course/' };

const course = {
  ru: {
    title: 'Испанский с нуля для русскоязычных',
    description: 'Пять модулей и десять видеоуроков с объяснениями на русском. Также в курс входят две встречи с Натали по 20 минут и 60 минут разговорной практики с ИИ.',
    home: 'На главную', library: 'Открытая библиотека', libraryPath: '/resources/',
    label: 'Курс в записи', checkout: 'Помощь с оплатой', price: 'Разовая оплата',
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
      ['Как я получу доступ?', 'Когда откроется запись на курс, после покупки на ваш email придёт ссылка для активации аккаунта. В личном кабинете будут видеоуроки, задания и материалы. Занимайтесь в своём темпе.'],
      ['Что входит в курс?', 'Пять модулей, десять видеоуроков, задания и материалы. В цену входят две встречи с Натали по 20 минут и 60 минут разговорной практики с ИИ. Стоимость всего курса — 179 USD, один платёж.'],
      ['Когда у меня будет занятие с Натали?', 'В курс входят две индивидуальные встречи с Натали по 20 минут.'],
    ]
  },
  en: {
    title: 'Spanish from scratch for Russian speakers',
    description: 'Five modules and ten video lessons taught in Russian, two 20-minute meetings with Natali, and 60 minutes of AI conversation practice.',
    home: 'Back to home', library: 'Open learning library', libraryPath: '/en/resources/',
    label: 'Self-paced course', checkout: 'Get payment help', price: 'One-time payment',
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
      ['How do I get access?', 'Once enrolment opens, you’ll receive an email to activate your campus account after purchase. The lessons, assignments and study materials are all in the campus. Study at your own pace.'],
      ['What does the course include?', 'Five modules, ten video lessons, assignments and study materials. Two 20-minute meetings with Natali and 60 minutes of AI conversation practice are included. The full bundle is USD 179, paid once.'],
      ['When do I meet with Natali?', 'Two individual 20-minute meetings with Natali are included.'],
    ]
  },
  es: {
    title: 'Español desde cero para rusohablantes',
    description: 'Cinco módulos y diez videoclases con explicaciones en ruso, dos encuentros de 20 minutos con Natali y 60 minutos de práctica de conversación con IA.',
    home: 'Ir al inicio', library: 'Biblioteca abierta', libraryPath: '/es/resources/',
    label: 'Curso grabado', checkout: 'Consultar sobre el pago', price: 'Pago único',
    syllabus: 'Qué vas a aprender',
    lessons: ['Alfabeto, lectura, pronunciación y acento', 'Saludos, presentaciones y preguntas simples',
      'Género, número y artículos', 'Países, profesiones y adjetivos', 'Días, meses y estaciones',
      'Números, edad y tiempo presente', 'Ser, estar, gustar y planes con ir a',
      'Hablar de vos y de tu familia', 'Aficiones y tiempo libre', 'Hablar del tiempo'],
    faqTitle: 'Preguntas frecuentes',
    faq: [
      ['¿Puedo empezar desde cero?', 'Sí. Empezás con lectura, pronunciación y frases simples. Las explicaciones son en ruso y los ejemplos y la práctica, en español.'],
      ['¿Cómo entro al curso?', 'Cuando abra la inscripción, después de la compra te llegará un correo para activar tu cuenta del campus. Ahí vas a encontrar las lecciones, las tareas y los materiales, para avanzar a tu ritmo.'],
      ['¿Qué incluye el curso?', 'Cinco módulos, diez videoclases, tareas y materiales. Incluye dos encuentros de 20 minutos con Natali y 60 minutos de práctica de conversación con IA. El curso completo cuesta USD 179 en un solo pago.'],
      ['¿El curso incluye encuentros con Natali?', 'Sí. Incluye dos encuentros individuales de 20 minutos con Natali.']
    ]
  }
};

const portal = {
  ru: ['Как выглядит личный кабинет','Смотрите уроки и возвращайтесь к тому месту, где остановились. На главной видно, сколько занятий пройдено. Задания и рабочие тетради собраны по урокам.','Видеоурок и оглавление','Рабочие тетради по модулям','Курс выбрали более 600 учеников','Натали — преподаватель и основательница школы. Уроки в записи ведут два преподавателя команды.','Читать отзывы','Сейчас набор закрыт.','Купить курс'],
  en: ['Inside your student portal','Watch the lessons and return to the point where you stopped. Your dashboard shows how much you’ve completed. Find each lesson’s assignments and workbooks in one place.','Video lesson and contents','Workbooks by module','Chosen by more than 600 students','Natali is a Spanish teacher and the school’s founder. Two teachers from the team lead the recorded lessons.','Read student testimonials','Enrolment is currently closed.','Buy the course'],
  es: ['Así es el campus del alumno','Mirá las clases y retomá el video donde lo dejaste. En el inicio ves tu progreso. Cada lección tiene sus tareas y cuadernos de práctica.','Videoclase e índice de lecciones','Cuadernos por módulo','Más de 600 estudiantes eligieron el curso','Natali es profesora de español y fundadora de la escuela. Dos docentes del equipo dan las lecciones grabadas.','Leer testimonios','La inscripción está cerrada por el momento.','Comprar el curso']
};

function enabledCheckout() {
  const { CAMPUS_ENABLED, CAMPUS_GUMROAD_PRODUCT_ID, CAMPUS_BUNDLE_PRODUCT_ID, COURSE_GUMROAD_CHECKOUT_URL } = process.env;
  if (CAMPUS_ENABLED !== 'true' || !CAMPUS_GUMROAD_PRODUCT_ID ||
      CAMPUS_BUNDLE_PRODUCT_ID !== CAMPUS_GUMROAD_PRODUCT_ID || !COURSE_GUMROAD_CHECKOUT_URL) return null;
  const url = new URL(COURSE_GUMROAD_CHECKOUT_URL);
  if (url.origin !== 'https://espanolconnatali.gumroad.com' ||
      !/^\/l\/[a-z0-9_-]+\/?$/i.test(url.pathname) ||
      url.pathname.replace(/\/$/, '') === '/l/spanish-from-zero' || url.username || url.password || url.hash) {
    throw new Error('Expected the verified USD 179 Gumroad product URL');
  }
  url.search = '';
  url.searchParams.set('wanted', 'true');
  return url.href;
}

export async function buildCourse({ out, base, production, coursePrice }) {
  const checkout = enabledCheckout();
  const alternates = Object.entries(courseRoutes).map(([lang, route]) =>
    `<link rel="alternate" hreflang="${lang}" href="${base + route}">`).join('');
  for (const [lang, copy] of Object.entries(course)) {
    const route = courseRoutes[lang];
    const canonical = base + route;
    const home = lang === 'ru' ? '/' : '/' + lang + '/';
    const faq = [...copy.faq, paymentFaq(lang)];
    if (checkout) {
      faq[1] = [faq[1][0], {
        ru: 'После подтверждения покупки вам придёт письмо для активации аккаунта. В личном кабинете вы найдёте все уроки, задания и материалы.',
        en: 'After your purchase is confirmed, you’ll receive an email to activate your campus account. All lessons, assignments and materials are in the campus.',
        es: 'Cuando se confirme tu compra vas a recibir un correo para activar tu cuenta. En el campus están todas las lecciones, tareas y materiales.'
      }[lang]];
    }
    const [portalTitle, portalDetail, classCaption, workbooksCaption, proof, proofDetail, testimonials, closed, buy] = portal[lang].map(esc);
    const graph = [
      { '@type': 'WebPage', '@id': canonical + '#page', url: canonical, name: copy.title, inLanguage: lang },
      { '@type': 'Course', '@id': canonical + '#course', name: copy.title,
        description: copy.description, inLanguage: 'ru', url: canonical,
        provider: { '@type': 'EducationalOrganization', '@id': base + '/#organization', name: 'Español con Natali' } },
      faqSchema(canonical, faq)
    ];
    const schema = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c');
    const switcher = Object.entries(courseRoutes).map(([code, href]) =>
      `<a href="${href}" lang="${code}" hreflang="${code}"${code === lang ? ' aria-current="page"' : ''}>${({ru: 'Русский', en: 'English', es: 'Español'})[code]}</a>`).join('');
    await mkdir(out + route, { recursive: true });
    await writeFile(out + route + 'index.html', `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(copy.title)} — Español con Natali</title><meta name="description" content="${esc(copy.description)}">
<meta name="robots" content="${production ? 'index,follow,max-image-preview:large' : 'noindex,follow'}">
<link rel="canonical" href="${canonical}">${alternates}<meta property="og:url" content="${canonical}">
<script type="application/ld+json">${schema}</script>
<link rel="stylesheet" href="/design-system.css"><link rel="stylesheet" href="/tutor-waitlist.css"><link rel="stylesheet" href="/course.css"></head>
<body><a class="skip" href="#main">${({ru: 'Перейти к содержанию', en: 'Skip to content', es: 'Ir al contenido'})[lang]}</a>
<header class="tw-head course-head"><a class="brand" href="${home}"><img src="/assets/brand/natali-lynx-approved.png" alt="" width="44" height="44">Español con Natali</a>
<nav aria-label="${({ru: 'Язык', en: 'Language', es: 'Idioma'})[lang]}">${switcher}</nav></header>
<main class="tw-main" id="main">
<section class="tw-grid" id="course"><div class="course-intro"><p class="label">${esc(copy.label)}</p><h1>${esc(copy.title)}</h1><p>${esc(copy.description)}</p></div>
<div class="tw-panel course-checkout"><h2>${esc(copy.price)}</h2><p class="course-amount">${esc(coursePrice)}</p>
${checkout
 ? `<a class="button" data-course-checkout href="${esc(checkout)}">${buy} <span aria-hidden="true">↗</span></a>`
 : `<p>${closed}</p>`}
<p><a class="link" data-payment-help href="#payment-help">${esc(copy.checkout)} <span aria-hidden="true">↓</span></a></p></div></section>
<section class="tw-how" aria-labelledby="portal-title"><h2 id="portal-title">${portalTitle}</h2><p>${portalDetail}</p>
<div class="portal-gallery"><figure><img src="/assets/course-portal/lesson.jpg" alt="${classCaption}" width="1440" height="900"><figcaption>${classCaption}</figcaption></figure>
<figure><img src="/assets/course-portal/workbooks.jpg" alt="${workbooksCaption}" width="1440" height="900"><figcaption>${workbooksCaption}</figcaption></figure></div></section>
<section class="tw-how" aria-labelledby="proof-title"><h2 id="proof-title">${proof}</h2><p>${proofDetail}</p>
<a class="link" href="${home}students/">${testimonials} <span aria-hidden="true">↗</span></a></section>
${renderPaymentHelp(lang)}
<section class="tw-how course-syllabus-page"><h2>${esc(copy.syllabus)}</h2><ol>${copy.lessons.map(lesson => `<li>${esc(lesson)}</li>`).join('')}</ol></section>
${renderFaq(copy.faqTitle, faq)}
</main><footer class="tw-footer"><a href="${home}">${esc(copy.home)}</a><a href="${copy.libraryPath}">${esc(copy.library)}</a></footer><script type="module" src="/course-payment-help.js"></script></body></html>`);
  }
}
