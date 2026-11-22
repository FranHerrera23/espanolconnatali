import { esc } from './markdown.mjs';

const messages = {
  ru: {
    hint: 'Карта российского банка? Напишите нам в Instagram — подскажем, какие варианты оплаты доступны.',
    label: 'Написать об оплате',
    question: 'Что делать, если у меня карта российского банка?',
    answer: 'Напишите нам в личные сообщения в Instagram. Мы подскажем, какие варианты оплаты доступны в вашем случае. Пожалуйста, не присылайте данные карты.'
  },
  en: {
    hint: 'Using a card issued by a Russian bank? Message us on Instagram and we’ll help you check which payment options are available.',
    label: 'Ask about payment',
    question: 'What if my card was issued by a Russian bank?',
    answer: 'Send us a private message on Instagram. We’ll help you check which payment options are available in your situation. Please keep your card details private.'
  },
  es: {
    hint: '¿Tu tarjeta es de un banco ruso? Escribinos por Instagram y te orientamos sobre las opciones de pago disponibles.',
    label: 'Consultar sobre el pago'
  }
};

export function paymentFaq(language) {
  const { question, answer } = messages[language];
  return [question, answer];
}

export function renderPaymentHelp(language, instagram) {
  const { hint, label } = messages[language];
  return `<div class="payment-help"><p>${esc(hint)}</p><a class="payment-help-link" data-payment-help href="${esc(instagram)}">${esc(label)} <span aria-hidden="true">↗</span></a></div>`;
}

export function addHomePaymentHelp(html, language, instagram) {
  return html.replace(/<a\b[^>]*\bdata-course-checkout\b[^>]*>.*?<\/a>/gs,
    checkout => checkout + renderPaymentHelp(language, instagram));
}
