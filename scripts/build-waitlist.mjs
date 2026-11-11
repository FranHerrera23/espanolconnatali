import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { esc } from './markdown.mjs';

const copy = {
  ru: {
    title: 'Испанский в вашем ритме', intro: 'Голосовая практика с ИИ. Говорите по-испански, а если нужна подсказка, попросите объяснить по-русски.',
    package: '120 минут на 28 дней', detail: 'Выбирайте разговоры по 15 или 30 минут и начинайте, когда вам удобно. Разовая оплата — 75 USD.',
    cta: 'Записаться в лист ожидания', email: 'Ваш email', consent: 'Согласен(-на) получить письмо о доступе к Natali AI Tutor. Мы используем email для этой очереди.',
    terms: 'Запись бесплатна. Приглашение отправим, когда откроется доступ.',
    success: 'Вы в списке. Напишем, когда откроется доступ.', pending: 'Отправляем…', fail: 'Запись пока не сохранилась. Попробуйте ещё раз.',
    full: 'Список пока заполнен. Загляните позже.', back: 'На главную', library: 'Открытая библиотека',
    homeTitle: 'Немного испанского в удобное время.', homeCopy: 'Когда есть 15 или 30 минут, начните разговор с ИИ-репетитором. Если собьётесь, попросите подсказку по-русски.',
    example: 'Пример разговора', meaning: 'Вы можете говорить помедленнее?'
  },
  es: {
    title: 'Conversá en español a tu ritmo', intro: 'Practicá por voz con una tutora de IA. Si te trabás, podés pedir ayuda en ruso.',
    package: '120 minutos en 28 días', detail: 'Elegí sesiones de 15 o 30 minutos y empezá cuando te quede cómodo. Pago único de US$75.',
    cta: 'Sumarme a la lista de espera', email: 'Tu correo', consent: 'Acepto recibir un correo sobre el acceso a Natali AI Tutor. Usamos tu correo para esta lista.',
    terms: 'Anotarte es gratis. Te enviaremos una invitación cuando abramos el acceso.',
    success: 'Ya estás en la lista. Te avisaremos cuando abramos el acceso.', pending: 'Enviando…', fail: 'No pudimos guardar tu solicitud. Volvé a intentar.',
    full: 'La lista está llena por ahora. Volvé más adelante.', back: 'Ir al inicio', library: 'Biblioteca abierta',
    homeTitle: 'Hablá español cuando tengas un rato.', homeCopy: 'Si tenés 15 o 30 minutos, empezá una charla con la tutora de IA. Si te trabás, pedí una pista en ruso.',
    example: 'Ejemplo de conversación', meaning: 'Una forma amable de pedir que hablen más despacio.'
  },
  en: {
    title: 'Speak Spanish at your own pace', intro: 'Practise by voice with an AI tutor and ask for help in Russian when you get stuck.',
    package: '120 minutes over 28 days', detail: 'Choose 15- or 30-minute conversations and start whenever it suits you. One-time payment of US$75.',
    cta: 'Join the waitlist', email: 'Your email address', consent: 'I agree to receive an email about access to Natali AI Tutor. We use your email for this waitlist.',
    terms: 'Joining is free. We’ll invite you when access opens.',
    success: 'You’re on the list. We’ll email you when access opens.', pending: 'Sending…', fail: 'We couldn’t save your request. Please try again.',
    full: 'The waitlist is full for now. Please check back later.', back: 'Back to home', library: 'Open library',
    homeTitle: 'Speak Spanish when you have a moment.', homeCopy: 'When you have 15 or 30 minutes, start a conversation with the AI tutor. If you get stuck, ask for a hint in Russian.',
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
<html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>${text(c.title)} — Español con Natali</title><link rel="stylesheet" href="/design-system.css"><link rel="stylesheet" href="/tutor-waitlist.css"></head>
<body><header class="tw-head"><a class="brand" href="${root(language)}"><img src="${logosrc}" alt="" width="44" height="44">Español con Natali</a><nav aria-label="Language">${Object.keys(copy).map(code=>`<a lang="${code}" href="${tutor(code)}"${code===language?' aria-current="page"':''}>${code.toUpperCase()}</a>`).join('')}</nav></header>
<main class="tw-grid">
<section><p class="tw-label">Natali AI Tutor</p><h1>${text(c.title)}</h1><p class="tw-intro">${text(c.intro)}</p><div class="tw-package"><p class="tw-label">Founding Members</p><h2>${text(c.package)}</h2><p>${text(c.detail)}</p></div></section>
<section class="tw-panel" aria-labelledby="waitlist-heading"><h2 id="waitlist-heading">${text(c.cta)}</h2><p>${text(c.terms)}</p>
<form id="tutor-waitlist" ${messages} method="post" action="/api/tutor-waitlist/">
<label for="tutor-email">${text(c.email)}</label><input id="tutor-email" name="email" type="email" autocomplete="email" maxlength="254" required>
<div hidden><input name="website" tabindex="-1" autocomplete="off" aria-label="Website"></div>
<label class="tw-consent"><input name="consent" type="checkbox" required><span>${text(c.consent)}</span></label>
<button class="button" type="submit">${text(c.cta)}</button></form><p id="waitlist-status" role="status" aria-live="polite"></p>
</section></main><footer class="tw-footer"><a href="${root(language)}">${text(c.back)}</a><a href="${root(language)}resources/">${text(c.library)}</a></footer><script src="/tutor-waitlist.js" defer></script></body></html>`);
  const homePath = 'dist' + root(language) + 'index.html';
  const home = await readFile(homePath, 'utf8');
  const teaser = `<section class="tutor-teaser wrap" id="tutor" aria-labelledby="tutor-title">
    <div class="tutor-teaser-content">
      <p class="label">Natali AI Tutor</p>
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
