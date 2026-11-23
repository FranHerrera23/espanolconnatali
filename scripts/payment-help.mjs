import { esc } from './markdown.mjs';

const copy = {
  ru: ['Помощь с оплатой','Есть вопрос об оплате или карта российского банка? Оставьте заявку. Мы ответим по электронной почте и расскажем, какие варианты доступны.','Электронная почта','Ваш профиль в соцсети','Телефон с кодом страны','Вы уже учили испанский?','Начинаю с нуля','Уже учил(а) испанский','Отправить заявку','Контакты нужны только для ответа на ваш запрос. Не указывайте данные карты.','Заявка получена. Ответим на указанный email.','Заявку не удалось сохранить. Попробуйте ещё раз.','Чтобы отправить заявку, включите JavaScript и обновите страницу.'],
  en: ['Payment help','Have a payment question or a card from a Russian bank? Send us a request and we’ll email you about the available options.','Email address','Social media profile','Phone with country code','Have you studied Spanish before?','I’m starting from scratch','I’ve studied Spanish before','Send request','We’ll use your contact details to reply to this request. Please keep your card details private.','We received your request and will reply by email.','We couldn’t save your request. Please try again.','Enable JavaScript and reload this page to send a request.'],
  es: ['Ayuda con el pago','¿Tenés una consulta o una tarjeta de un banco ruso? Mandanos tu solicitud y te contamos por correo qué opciones hay.','Correo electrónico','Perfil en una red social','Teléfono con código de país','¿Ya estudiaste español?','Empiezo de cero','Ya estudié español','Enviar consulta','Usamos tus datos de contacto para responder esta consulta. Mantené en privado los datos de tu tarjeta.','Recibimos tu consulta. Te vamos a responder por correo.','No pudimos guardar tu consulta. Volvé a intentar.','Activá JavaScript y recargá la página para enviar tu consulta.']
};

export function paymentFaq(language) {
  const questions = {
    ru: 'Как получить помощь с оплатой?',
    en: 'How can I get help with payment?',
    es: '¿Cómo pido ayuda con el pago?'
  };
  return [questions[language], copy[language][1]];
}

const privateCopy = {
  ru: ['Свободное время у Натали','Оставьте email, чтобы узнать о свободных местах на индивидуальных занятиях.','Оставить заявку'],
  en: ['Private lesson availability','Leave your email and we’ll get back to you about available places with Natali.','Send availability enquiry'],
  es: ['Disponibilidad de clases privadas','Dejanos tu correo y te contamos si hay lugares para estudiar con Natali.','Consultar disponibilidad']
};

export function renderPaymentHelp(language, kind = 'payment') {
  const [title, intro, email, social, phone, level, beginner, returning, submit, privacy, success, fail, noScript] = copy[language].map(esc);
  const individual = kind === 'private-lessons';
  const [heading, description, action] = individual ? privateCopy[language].map(esc) : [title, intro, submit];
  const optional = {ru: 'необязательно', en: 'optional', es: 'opcional'}[language];
  return `<section class="tw-panel payment-form" id="${individual ? 'availability' : 'payment-help'}" aria-labelledby="payment-title">
<h2 id="payment-title">${heading}</h2><p>${description}</p>
<form hidden method="post" action="/api/course-payment-help/" data-course-payment-form data-error="${fail}" data-language="${language}" data-kind="${kind}">
<label>${email}<input name="email" type="email" autocomplete="email" maxlength="254" required></label>
${individual ? '' : `<label>${social} (${optional})<input name="social" type="text" placeholder="vk.com/anna" maxlength="180"></label>
<label>${phone} (${optional})<input name="phone" type="tel" autocomplete="tel" placeholder="+7 …" pattern="\\+[0-9 \\x28\\x29\\x2d]{7,24}" maxlength="25"></label>
<fieldset><legend>${level} (${optional})</legend><label><input type="radio" name="level" value="new"> ${beginner}</label><label><input type="radio" name="level" value="return"> ${returning}</label></fieldset>`}
<div hidden><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
<p>${privacy}</p><button class="button" type="submit">${action}</button><p role="alert"></p>
</form><p class="payment-success" hidden tabindex="-1">${success}</p><noscript><p>${noScript}</p></noscript></section>`;
}
