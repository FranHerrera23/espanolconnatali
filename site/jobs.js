import { jobFreshness, matchesJobFilters } from './jobs-state.js';

const library = document.querySelector('[data-jobs-library]');
if (library) {
  const spanish = document.documentElement.lang === 'es';
  const form = library.querySelector('[data-job-filters]');
  const cards = [...library.querySelectorAll('[data-job]')];
  const count = library.querySelector('[data-jobs-count]');
  const empty = library.querySelector('[data-jobs-empty]');
  const selectOptions = new Map([...form.querySelectorAll('select')].map(select =>
    [select.name, [...select.options].map(option => ({ value: option.value, text: option.textContent }))]));
  const controls = Object.fromEntries([...form.elements].filter(element => element.name).map(element =>
    [element.name, element]));
  const params = new URL(location.href).searchParams;
  for (const [name, control] of Object.entries(controls)) control.value = (params.get(name) || '').slice(0, 120);

  function applyFilters() {
    const eligible = cards.filter(card => jobFreshness(card.dataset) !== 'hidden');
    for (const select of form.querySelectorAll('select')) {
      const selected = select.value;
      const values = new Set(eligible.map(card => card.dataset[select.name]));
      const options = selectOptions.get(select.name).filter(option => !option.value || values.has(option.value));
      select.replaceChildren(...options.map(option => {
        const element = document.createElement('option');
        element.value = option.value;
        element.textContent = option.text;
        return element;
      }));
      select.value = values.has(selected) ? selected : '';
    }
    const filters = Object.fromEntries(Object.entries(controls).map(([name, control]) => [name, control.value]));
    let visible = 0;
    for (const card of cards) {
      const freshness = jobFreshness(card.dataset);
      card.hidden = freshness === 'hidden' || !matchesJobFilters(card.dataset, filters);
      if (!card.hidden) visible++;
      const pending = freshness === 'pending';
      card.classList.toggle('jobs-pending', pending);
      card.querySelector('[data-job-freshness]').textContent = pending
        ? (spanish ? 'Revisión pendiente' : 'Нужна повторная проверка')
        : (spanish ? 'La fuente aceptaba candidaturas al revisar' : 'Приём откликов был открыт при проверке');
    }
    count.textContent = (spanish ? 'Anuncios encontrados: ' : 'Найдено объявлений: ') + visible;
    empty.hidden = visible !== 0;
    const url = new URL(location.href);
    for (const [name, value] of Object.entries(filters)) {
      if (value.trim()) url.searchParams.set(name, value.trim());
      else url.searchParams.delete(name);
    }
    history.replaceState(history.state, '', url);
  }

  form.hidden = false;
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', applyFilters);
  form.addEventListener('change', applyFilters);
  form.addEventListener('reset', () => requestAnimationFrame(applyFilters));
  window.addEventListener('pageshow', applyFilters);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) applyFilters();
  });
  applyFilters();
}
