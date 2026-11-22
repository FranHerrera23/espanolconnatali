import { esc } from './markdown.mjs';

export function faqSchema(canonical, questions) {
  return {
    '@type': 'FAQPage',
    '@id': canonical + '#faq',
    mainEntity: questions.map(([name, text]) => ({
      '@type': 'Question',
      name,
      acceptedAnswer: { '@type': 'Answer', text }
    }))
  };
}

export function renderFaq(title, questions) {
  return `<section class="tw-how product-faq" id="faq" aria-labelledby="faq-title">
<h2 id="faq-title">${esc(title)}</h2>
${questions.map(([question, answer]) => `<details><summary>${esc(question)}</summary><p>${esc(answer)}</p></details>`).join('\n')}
</section>`;
}
