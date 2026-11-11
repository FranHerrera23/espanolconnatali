import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { esc } from './markdown.mjs';

const productName = 'En Confianza';

const copy = {
  ru: {
    title: 'Вам уже есть о чём поговорить.', intro: 'Вечер в ресторане, который вы давно хотели посетить. Разговор после выставки. Отель, в который хочется вернуться.',
    descriptor: 'Ваш личный консьерж для разговоров на испанском', promise: 'Выбирайте, о чём и когда говорить. Если не хватает слов, попросите подсказку на русском.',
    audienceTitle: 'Испанский для себя', audience: 'Для женщин, которым хочется говорить по-испански о том, что они замечают, любят и выбирают. Даже если вы только начинаете, разговор может быть о ваших впечатлениях и вкусах. Начните с нескольких фраз и при необходимости попросите помощи на русском.',
    howTitle: 'Как проходит практика', steps: [
      ['Найдите 15 или 30 минут', 'Начните, когда удобно. Можно говорить в будни или оставить время на выходные.'],
      ['Выберите тему', 'Расскажите о том, что вас заинтересовало, или начните с простой повседневной ситуации.'],
      ['Попросите подсказку на русском', 'Если не хватает слова или фразы, попросите пример и попробуйте ещё раз.']
    ],
    package: '120 минут на 28 дней', detail: 'Чередуйте разговоры по 15 и 30 минут. Разовая оплата — 75 USD.',
    disclosure: 'Вы разговариваете с виртуальным репетитором на базе ИИ.',
    demoPrompt: 'Как сказать «Мне понравился свет»?', demoReply: 'Me gustó la luz. ¿Qué más te llamó la atención?',
    demoMeaning: 'Мне понравился свет. Что ещё привлекло ваше внимание?',
    cta: 'Записаться в лист ожидания', email: 'Ваш email', consent: 'Согласен(-на) получить письмо о доступе к En Confianza. Мы используем email для этого списка.',
    terms: 'Оставьте email, чтобы получить приглашение, когда откроется доступ. Запись бесплатна.',
    success: 'Вы в списке. Напишем, когда откроется доступ.', pending: 'Отправляем…', fail: 'Запись пока не сохранилась. Попробуйте ещё раз.',
    invitation: 'Доступ по приглашению', full: 'Список пока заполнен. Загляните позже.', back: 'На главную', library: 'Открытая библиотека',
    homeTitle: 'Вам уже есть о чём поговорить.', homeCopy: 'Ваш личный консьерж для разговоров на испанском. Выберите 15 или 30 минут и тему, которая вам близка. Подсказки — на русском.',
    example: 'Пример разговора', meaning: 'Вы можете говорить помедленнее?'
  },
  es: {
    title: 'Ya tenés de qué hablar.', intro: 'Una cena en un lugar que elegiste con tiempo. Una conversación después de una exposición. Un hotel al que siempre volvés.',
    descriptor: 'Tu concierge privado de conversación en español', promise: 'Vos elegís de qué hablar y cuándo. Si te faltan palabras, pedí una pista en ruso.',
    audienceTitle: 'Español para vos', audience: 'Pensado para mujeres que quieren conversar en español sobre lo que eligen, lo que disfrutan y lo que piensan. Si recién empezás o volvés después de una pausa, podés empezar con unas pocas frases y pedir ayuda en ruso.',
    howTitle: 'Cómo es la práctica', steps: [
      ['Elegí 15 o 30 minutos', 'Empezá cuando te quede cómodo. Podés practicar entre semana o guardar tiempo para el fin de semana.'],
      ['Traé un tema que te interese', 'Contá algo que te llamó la atención o empezá con una situación cotidiana.'],
      ['Pedí una pista en ruso', 'Si te falta una palabra, pedí un ejemplo y probá otra vez.']
    ],
    package: '120 minutos en 28 días', detail: 'Combiná conversaciones de 15 y 30 minutos. Pago único de US$75.',
    disclosure: 'Conversás por voz con una tutora virtual que usa inteligencia artificial.',
    demoPrompt: 'Как сказать «Мне понравился свет»?', demoReply: 'Me gustó la luz. ¿Qué más te llamó la atención?',
    demoMeaning: 'Pedís en ruso cómo decir que te gustó la luz. La tutora te da la frase y te invita a seguir hablando.',
    cta: 'Sumarme a la lista de espera', email: 'Tu correo', consent: 'Acepto recibir un correo sobre el acceso a En Confianza. Usamos tu correo para esta lista.',
    terms: 'Dejá tu correo y te invitaremos cuando abramos el acceso. Anotarte es gratis.',
    success: 'Ya estás en la lista. Te avisaremos cuando abramos el acceso.', pending: 'Enviando…', fail: 'No pudimos guardar tu solicitud. Volvé a intentar.',
    invitation: 'Acceso por invitación', full: 'La lista está llena por ahora. Volvé más adelante.', back: 'Ir al inicio', library: 'Biblioteca abierta',
    homeTitle: 'Ya tenés de qué hablar.', homeCopy: 'Tu concierge privado de conversación en español. Elegí 15 o 30 minutos, traé un tema que te interese y pedí una pista en ruso si te trabás.',
    example: 'Ejemplo de conversación', meaning: 'Una forma amable de pedir que hablen más despacio.'
  },
  en: {
    title: 'You already have something to say.', intro: 'A dinner you’ve been looking forward to. A conversation after an exhibition. A hotel you always return to.',
    descriptor: 'Your private concierge for Spanish conversation', promise: 'You choose when to speak and what to talk about. If the words don’t come, ask for a hint in Russian.',
    audienceTitle: 'Spanish you learn for yourself', audience: 'For women who want to talk about their tastes, their plans and what catches their eye. Even as a beginner, you can start with a few phrases and ask for help in Russian.',
    howTitle: 'How practice works', steps: [
      ['Choose 15 or 30 minutes', 'Start when it suits you. Practise during the week or keep some time for the weekend.'],
      ['Bring a topic you care about', 'Talk about something that caught your eye, or start with an everyday situation.'],
      ['Ask for a hint in Russian', 'When you need a word or phrase, ask for an example and try it yourself.']
    ],
    package: '120 minutes over 28 days', detail: 'Mix 15- and 30-minute conversations. One-time payment of US$75.',
    disclosure: 'Conversations are with a virtual voice tutor powered by AI.',
    demoPrompt: 'Как сказать «Мне понравился свет»?', demoReply: 'Me gustó la luz. ¿Qué más te llamó la atención?',
    demoMeaning: 'Ask in Russian how to say you liked the light. The tutor gives you the phrase and invites you to keep talking.',
    cta: 'Join the waitlist', email: 'Your email address', consent: 'I agree to receive an email about access to En Confianza. We use your email for this waitlist.',
    terms: 'Leave your email for an invitation when access opens. Joining is free.',
    success: 'You’re on the list. We’ll email you when access opens.', pending: 'Sending…', fail: 'We couldn’t save your request. Please try again.',
    invitation: 'Access by invitation', full: 'The waitlist is full for now. Please check back later.', back: 'Back to home', library: 'Open library',
    homeTitle: 'You already have something to say.', homeCopy: 'Your private concierge for Spanish conversation. Choose 15 or 30 minutes, bring a topic you care about and ask for a hint in Russian whenever you need one.',
    example: 'Conversation example', meaning: 'Could you speak a little more slowly?'
  }
};

const root = language => language === 'ru' ? '/' : '/' + language + '/';
const tutor = language => root(language) + 'tutor/';
const logosrc = '/assets/brand/natali-lynx-approved.png';
const text = esc;
for (const [language, c] of Object.entries(copy)) {
  const destination = tutor(language);
  const messages = ['pending','success','fail','full'].map(key => `data-${key}="${text(c[key])}"`).join(' ');
  await mkdir('dist' + destination, { recursive: true });
  await writeFile('dist' + destination + 'index.html', `<!doctype html>
<html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>${productName} — Español con Natali</title><link rel="stylesheet" href="/design-system.css"><link rel="stylesheet" href="/tutor-waitlist.css"></head>
<body><header class="tw-head"><a class="brand" href="${root(language)}"><img src="${logosrc}" alt="" width="44" height="44">Español con Natali</a><nav aria-label="Language">${Object.keys(copy).map(code=>`<a lang="${code}" href="${tutor(code)}"${code===language?' aria-current="page"':''}>${code.toUpperCase()}</a>`).join('')}</nav></header>
<main class="tw-main">
<div class="tw-grid">
<section class="tw-hero"><p class="tw-signature"><span lang="es">${productName}</span><span>${text(c.invitation)}</span></p><h1>${text(c.title)}</h1><p class="tw-descriptor">${text(c.descriptor)}</p><p class="tw-intro">${text(c.intro)}</p><p class="tw-promise">${text(c.promise)}</p></section>
<section class="tw-panel" aria-labelledby="waitlist-heading">
<p class="label">Founding Members</p><h2 id="waitlist-heading">${text(c.cta)}</h2><p class="tw-terms">${text(c.terms)}</p>
<div class="tw-package"><p><strong>${text(c.package)}</strong></p><p>${text(c.detail)}</p></div>
<p class="tw-disclosure">${text(c.disclosure)}</p>
<form id="tutor-waitlist" ${messages} method="post" action="/api/tutor-waitlist/">
<label for="tutor-email">${text(c.email)}</label><input id="tutor-email" name="email" type="email" autocomplete="email" maxlength="254" required>
<div hidden><input name="website" tabindex="-1" autocomplete="off" aria-label="Website"></div>
<label class="tw-consent"><input name="consent" type="checkbox" required><span>${text(c.consent)}</span></label>
<button class="button" type="submit">${text(c.cta)}</button></form><p id="waitlist-status" role="status" aria-live="polite"></p>
</section></div>
<section class="tw-story" aria-labelledby="tw-audience">
  <div><h2 id="tw-audience">${text(c.audienceTitle)}</h2><p>${text(c.audience)}</p></div>
  <figure class="tw-example"><figcaption class="label">${text(c.example)}</figcaption>
    <blockquote lang="ru">${text(c.demoPrompt)}</blockquote>
    <blockquote lang="es">${text(c.demoReply)}</blockquote>
    <p>${text(c.demoMeaning)}</p>
  </figure>
</section>
<section class="tw-how" aria-labelledby="tw-how-heading">
  <h2 id="tw-how-heading">${text(c.howTitle)}</h2>
  <ol>${c.steps.map(([title, detail])=>`<li><h3>${text(title)}</h3><p>${text(detail)}</p></li>`).join('')}</ol>
</section>
</main><footer class="tw-footer"><a href="${root(language)}">${text(c.back)}</a><a href="${root(language)}resources/">${text(c.library)}</a></footer><script src="/tutor-waitlist.js" defer></script></body></html>`);
  const homePath = 'dist' + root(language) + 'index.html';
  const home = await readFile(homePath, 'utf8');
  const teaser = `<section class="tutor-teaser wrap" id="tutor" aria-labelledby="tutor-title">
    <div class="tutor-teaser-content">
      <p class="label" lang="es">${productName}</p>
      <h2 id="tutor-title">${text(c.homeTitle)}</h2>
      <p>${text(c.homeCopy)}</p>
      <a class="button" href="${destination}">${text(c.cta)}</a>
    </div>
    <figure class="tutor-teaser-example">
      <figcaption class="label">${text(c.example)}</figcaption>
      <blockquote lang="es">¿Puede hablar más despacio?</blockquote>
      <p>${text(c.meaning)}</p>
      <blockquote class="tutor-teaser-reply" lang="es">Claro. Vamos poco a poco.</blockquote>
    </figure>
  </section>`;
  const at = home.indexOf('<section class="fit section wrap rule"');
  if (at === -1) throw new Error('Tutor link insertion point missing for ' + language);
  await writeFile(homePath, home.slice(0, at) + teaser + home.slice(at));
}
for (const name of ['tutor-waitlist.css','tutor-waitlist.js']) await cp('site/'+name,'dist/'+name);
