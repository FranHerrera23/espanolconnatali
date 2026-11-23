import { publicDesignHead, renderHeader, renderReviewsLink } from './site-navigation.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { esc } from './markdown.mjs';
import { faqSchema, renderFaq } from './product-faq.mjs';
import { paymentFaq, renderPaymentHelp } from './payment-help.mjs';

export const courseRoutes = { ru: '/course/', en: '/en/course/', es: '/es/course/' };

const course = {
  ru: {
    title: 'Испанский с нуля для русскоязычных',
    description: 'В курсе пять модулей и десять видеоуроков с объяснениями на русском. Вы дважды встретитесь с Натали на 20 минут и сможете 60 минут практиковать испанский в En Confianza по темам курса.',
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
      ['Что входит в курс?', 'Пять модулей, десять видеоуроков, задания и материалы. В цену входят две встречи с Натали по 20 минут и 60 минут практики в En Confianza по темам курса. Стоимость всего курса — 179 USD, один платёж.'],
      ['Когда у меня будет занятие с Натали?', 'В курс входят две индивидуальные встречи с Натали по 20 минут.'],
    ]
  },
  en: {
    title: 'Spanish from scratch for Russian speakers',
    description: 'Five modules and ten video lessons taught in Russian, two 20-minute meetings with Natali, and 60 minutes of conversation practice in En Confianza.',
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
      ['What does the course include?', 'Five modules, ten video lessons, assignments and study materials. Two 20-minute meetings with Natali and 60 minutes of conversation practice in En Confianza are included. The full bundle is USD 179, paid once.'],
      ['When do I meet with Natali?', 'Two individual 20-minute meetings with Natali are included.'],
    ]
  },
  es: {
    title: 'Español desde cero para rusohablantes',
    description: 'Cinco módulos y diez videoclases con explicaciones en ruso, dos encuentros de 20 minutos con Natali y 60 minutos de conversación en En Confianza.',
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
      ['¿Qué incluye el curso?', 'Cinco módulos, diez videoclases, tareas y materiales. Incluye dos encuentros de 20 minutos con Natali y 60 minutos de conversación en En Confianza. El curso completo cuesta USD 179 en un solo pago.'],
      ['¿El curso incluye encuentros con Natali?', 'Sí. Incluye dos encuentros individuales de 20 minutos con Natali.']
    ]
  }
};

const portal = {
  ru: ['Как выглядит личный кабинет', 'Курс выбрали более 600 учеников', 'Натали — преподаватель и основательница школы. Уроки в записи ведут два преподавателя команды.', 'Читать отзывы', 'Сейчас набор закрыт.', 'Купить курс'],
  en: ['Inside your student portal', 'Chosen by more than 600 students', 'Natali is a Spanish teacher and the school’s founder. Two teachers from the team lead the recorded lessons.', 'Read student testimonials', 'Enrolment is currently closed.', 'Buy the course'],
  es: ['Así es el campus del alumno', 'Más de 600 estudiantes eligieron el curso', 'Natali es profesora de español y fundadora de la escuela. Dos docentes del equipo dan las lecciones grabadas.', 'Leer testimonios', 'La inscripción está cerrada por el momento.', 'Comprar el curso']
};

const tourSteps = {
  es: [
    ['Tu campus', 'Desde esta portada podés retomar tu última clase. Más abajo encontrás los artículos de Natali para seguir leyendo en español.'],
    ['Tu progreso', 'Cada marca corresponde a una lección. De un vistazo ves lo que ya hiciste y lo que te queda en cada módulo.'],
    ['Una clase por dentro', 'Mirá la explicación de Sofía en ruso y pasá a la práctica con Eloy. El video recuerda dónde lo dejaste.'],
    ['Tus cuadernos', 'Abrí el módulo que estás estudiando. Ahí tenés juntos el texto de la lección y los ejercicios.'],
    ['En Confianza', 'Probá en voz alta una conversación de la lección. Tenés 60 minutos de práctica con IA guiada por el método y los cuadernos de Natali.']
  ],
  ru: [
    ['Ваш личный кабинет', 'Отсюда можно вернуться к последнему уроку. Ниже — статьи Натали для практики испанского.'],
    ['Ваш прогресс', 'Каждая отметка — один урок. Видно, что вы уже прошли и что осталось в каждом модуле.'],
    ['Видеоурок', 'Посмотрите объяснение Софии на русском и перейдите к практике с Элоем. Видео запомнит, где вы остановились.'],
    ['Рабочие тетради', 'Откройте свой модуль. Текст урока и упражнения собраны в одном месте.'],
    ['En Confianza', 'Попробуйте вслух диалог из урока. В курс входят 60 минут голосовой практики с ИИ по методике и рабочим тетрадям Натали.']
  ],
  en: [
    ['Your dashboard', 'Pick up your last lesson here. Scroll down for articles from Natali to keep practising your Spanish.'],
    ['Your progress', 'Each mark represents one lesson. See what you’ve finished and what’s next in each module.'],
    ['Inside a lesson', 'Watch Sofía’s explanation in Russian, then practise with Eloy. The video remembers where you stopped.'],
    ['Your workbooks', 'Open the module you’re studying to find the lesson text and exercises together.'],
    ['En Confianza', 'Try a conversation from your lesson out loud. Your course includes 60 minutes of AI voice practice guided by Natali’s method and workbooks.']
  ]
};

const screens = [["dashboard", 1680, 1707, 585, 2243],
  ["progress", 1608, 248, 537, 351],
  ["lesson", 1608, 1659, 537, 2091],
  ["workbook", 1608, 698, 537, 903],
  ["practice", 1608, 611, 537, 552]];

function renderPreview(lang, title) {
  const step = { es: 'Paso', ru: 'Шаг', en: 'Step' }[lang];
  const figures = tourSteps[lang].map(([label, detail], index) => {
    const [id, width, height, mobileWidth, mobileHeight] = screens[index];
    const src = '/assets/course-portal/tour-' + id;
    return `<li><figure><figcaption><p class="label">${step} ${index + 1}</p><h3>${esc(label)}</h3><p>${esc(detail)}</p></figcaption>
      <picture><source media="(max-width: 740px)" srcset="${src}-mobile.jpg" width="${mobileWidth}" height="${mobileHeight}">
      <img src="${src}-desktop.jpg" width="${width}" height="${height}" alt="${esc(index === 0 ? 'Hola, Marina. Bienvenida a tu vida en español.' : label)}" loading="lazy" decoding="async"></picture></figure></li>`;
  }).join('');
  return `<section class="campus-tour" id="course-portal" aria-labelledby="portal-title"><h2 id="portal-title">${esc(title)}</h2><ol role="list">${figures}</ol></section>`;
}

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

export async function buildCourse({ out, base, production, coursePrice, courseOffer }) {
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
    const [portalTitle, proof, proofDetail, testimonials, closed, buy] = portal[lang].map(esc);
    const meta = copy.description + ' ' + {
      ru: 'Стоимость — ' + coursePrice + ', один платёж.',
      en: coursePrice + ', one-time payment.',
      es: coursePrice + ' en un solo pago.'
    }[lang];
    const graph = [
      { '@type': 'WebPage', '@id': canonical + '#page', url: canonical, name: copy.title, inLanguage: lang },
      { '@type': 'Course', '@id': canonical + '#course', name: copy.title,
        description: meta, offers: {
          '@type': 'Offer', price: courseOffer.price, priceCurrency: courseOffer.currency,
          availability: 'https://schema.org/' + (checkout ? 'InStock' : 'OutOfStock'),
          url: checkout || canonical
        }, inLanguage: 'ru', url: canonical,
        provider: { '@type': 'EducationalOrganization', '@id': base + '/#organization', name: 'Español con Natali' } },
      faqSchema(canonical, faq)
    ];
    const schema = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c');
    await mkdir(out + route, { recursive: true });
    await writeFile(out + route + 'index.html', `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(copy.title)} — Español con Natali</title><meta name="description" content="${esc(meta)}"><meta property="og:description" content="${esc(meta)}">
<meta name="robots" content="${production ? 'index,follow,max-image-preview:large' : 'noindex,follow'}">
<link rel="canonical" href="${canonical}">${alternates}<meta property="og:url" content="${canonical}">
<script type="application/ld+json">${schema}</script>
${publicDesignHead}<link rel="stylesheet" href="/tutor-waitlist.css"><link rel="stylesheet" href="/course.css"></head>
<body><a class="skip" href="#main">${({ru: 'Перейти к содержанию', en: 'Skip to content', es: 'Ir al contenido'})[lang]}</a>
${renderHeader(lang, '/course/')}
<main class="tw-main" id="main">
<section class="tw-grid" id="course"><div class="course-intro"><p class="label">${esc(copy.label)}</p><h1>${esc(copy.title)}</h1><p>${esc(copy.description)}</p></div>
<div class="tw-panel course-checkout"><h2>${esc(copy.price)}</h2><p class="course-amount">${esc(coursePrice)}</p>
${checkout ? '' : `<p>${closed}</p>`}
<p><a class="link" href="#course-portal">${portalTitle} <span aria-hidden="true">↓</span></a></p></div></section>
${renderPreview(lang, portalTitle)}
<section class="tw-how" aria-labelledby="proof-title"><h2 id="proof-title">${proof}</h2><p>${proofDetail}</p>
<a class="link" href="${home}students/">${testimonials} <span aria-hidden="true">↗</span></a></section>
<div class="course-actions" aria-label="${esc(copy.price)}">
${checkout ? `<a class="button" data-course-checkout href="${esc(checkout)}">${buy} <span aria-hidden="true">↗</span></a>` : ''}
<a class="link" data-payment-help href="#payment-help">${esc(copy.checkout)} <span aria-hidden="true">↓</span></a></div>
${renderPaymentHelp(lang)}
<section class="tw-how course-syllabus-page"><h2>${esc(copy.syllabus)}</h2><ol>${copy.lessons.map(lesson => `<li>${esc(lesson)}</li>`).join('')}</ol></section>
${renderFaq(copy.faqTitle, faq)}
</main><footer class="tw-footer"><a href="${home}">${esc(copy.home)}</a><a href="${copy.libraryPath}">${esc(copy.library)}</a>${renderReviewsLink(lang)}</footer><script type="module" src="/course-payment-help.js"></script></body></html>`);
  }
}
