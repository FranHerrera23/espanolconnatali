import { esc } from './markdown.mjs';
import { jobFreshness } from '../site/jobs-state.js';

export const jobsRoute = '/resources/jobs-in-spain/';
const industries = {
  kitchen: ['Кухня', 'Cocina'],
  reception: ['Ресепшен', 'Recepción'],
  retail: ['Продажи', 'Ventas'],
  'customer-service': ['Поддержка клиентов', 'Atención al cliente'],
  beauty: ['Красота', 'Belleza']
};
const dateLabel = (date, spanish) => new Intl.DateTimeFormat(spanish ? 'es-ES' : 'ru-RU', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
}).format(new Date(date + 'T00:00:00Z'));

export function jobsTeaser(language = 'ru', contained = false) {
  const spanish = language === 'es';
  const english = language === 'en';
  const route = spanish ? '/es' + jobsRoute : jobsRoute;
  const title = spanish ? 'Vacantes en España, con contexto'
    : english ? 'Jobs in Spain, explained in Russian' : 'Вакансии в Испании с пояснениями на русском';
  const description = spanish ? 'Un recurso filtrable con fuentes directas y fecha de revisión por oferta.'
    : english ? 'A filterable resource with original sources and a review date for each listing.'
      : 'Отдельная подборка: фильтры по городу и сфере, условия и ссылки на оригиналы.';
  return '<aside class="library-resource' + (contained ? '' : ' wrap') + '"><div><p class="label">' +
    (spanish ? 'Recurso filtrable' : english ? 'Filterable resource · In Russian' : 'Ресурс с фильтрами') +
    '</p><h2>' + esc(title) + '</h2><p>' + esc(description) +
    '</p></div><a class="link" href="' + route + '">' +
    (spanish ? 'Explorar vacantes' : english ? 'Explore the listings' : 'Смотреть подборку') +
    ' <span aria-hidden="true">↗</span></a></aside>';
}

export function renderJobs(data, language = 'ru', now = new Date()) {
  const spanish = language === 'es';
  const text = (ru, es) => spanish ? es : ru;
  const localeIndex = spanish ? 1 : 0;
  const jobs = data.jobs.filter(job => jobFreshness(job, now) !== 'hidden');
  const ids = new Set();
  for (const job of jobs) {
    if (ids.has(job.id) || job.country !== 'ES') throw Error('Invalid or duplicate curated job ' + job.id);
    ids.add(job.id);
    const source = new URL(job.sourceUrl);
    if (source.protocol !== 'https:' || source.username || source.password) throw Error('Invalid job source');
    if (!industries[job.industry] || !job.city || !job.province || !job.questionRu || !job.es || !job.clearRu || !job.clarifyRu || !job.es.clear || !job.es.clarify)
      throw Error('Missing curated job fields ' + job.id);
  }
  const options = (field, all) => '<option value="">' + all + '</option>' +
    [...new Set(jobs.map(job => job[field]))].sort((a, b) => a.localeCompare(b)).map(value =>
      '<option value="' + esc(value) + '">' + esc(field === 'industry' ? industries[value][localeIndex] :
        (!spanish && jobs.find(job => job[field] === value)[field + 'Ru']
          ? jobs.find(job => job[field] === value)[field + 'Ru'] + ' (' + value + ')' : value)) + '</option>'
    ).join('');
  const fact = (label, value) => '<div><dt>' + label + '</dt><dd>' + esc(value || text('Не указано', 'No indicado')) + '</dd></div>';
  const cards = jobs.map(job => {
    const fresh = jobFreshness(job, now);
    const publication = job.publicationDate
      ? text(job.publicationDateBasis === 'visible' ? 'Дата в объявлении: ' : 'Дата в данных источника: ',
          job.publicationDateBasis === 'visible' ? 'Fecha del anuncio: ' : 'Fecha en los datos de la fuente: ') + dateLabel(job.publicationDate, spanish)
      : text(job.publicationNoteRu || 'Дата публикации в источнике не указана.',
          job.publicationNoteEs || 'La fuente no indica una fecha de publicación.');
    let salary = text(job.salaryNoteRu, job.salaryNoteEs);
    if (job.salary) {
      if (job.salary.currency !== 'EUR' || job.salary.period !== 'month' ||
          !Number.isFinite(job.salary.min) || !Number.isFinite(job.salary.max) ||
          job.salary.min < 0 || job.salary.max < job.salary.min ||
          ![null, 'gross', 'net'].includes(job.salary.grossNet)) throw Error('Unsupported salary format');
      const format = new Intl.NumberFormat(spanish ? 'es-ES' : 'ru-RU');
      const basis = { gross: text('До удержаний.', 'Bruto.'), net: text('После удержаний.', 'Neto.') };
      salary = format.format(job.salary.min) + '–' + format.format(job.salary.max) + ' € ' +
        text('в месяц. ', 'al mes. ') + (basis[job.salary.grossNet] || text('До или после удержаний — не указано.', 'Bruto o neto no indicado.'));
    }
    const search = [job.titleRu, job.titleEs, job.employer, job.city, job.province, job.region,
      job.cityRu, job.provinceRu, job.tasksRu, job.languagesRu, job.experienceRu, ...Object.values(job.es)].join(' ');
    return '<article class="jobs-card" id="' + esc(job.id) + '" data-job data-city="' + esc(job.city) +
      '" data-province="' + esc(job.province) + '" data-industry="' + job.industry +
      '" data-search-text="' + esc(search) + '" data-last-checked-date="' + job.lastCheckedDate +
      '" data-expires-at="' + esc(job.expiresAt || '') + '" data-status="' + job.status +
      '" data-verification-pending="' + Boolean(job.verificationPending) + '">' +
      '<div class="jobs-card-heading"><div><p class="label">' + industries[job.industry][localeIndex] +
      '</p><h2>' + esc(spanish ? job.titleEs : job.titleRu) + '</h2>' +
      (spanish ? '' : '<p class="jobs-original" lang="es">' + esc(job.titleEs) + '</p>') +
      '<p class="jobs-employer">' + esc(job.employer) + '</p></div><p class="jobs-location">' +
      esc(spanish ? job.city : job.cityRu || job.city) + '<br>' + esc(job.province + ' · ' + job.region) + '</p></div>' +
      '<div class="jobs-check"><span data-job-freshness>' +
      (fresh === 'pending' ? text('Нужна повторная проверка', 'Revisión pendiente')
        : text('Приём откликов был открыт при проверке', 'La fuente aceptaba candidaturas al revisar')) +
      '</span><span>' + text('Проверено ', 'Revisado el ') + '<time datetime="' + job.lastCheckedDate + '">' +
      dateLabel(job.lastCheckedDate, spanish) + '</time></span></div>' +
      '<dl class="jobs-facts">' +
      fact(text('Что предстоит делать', 'Tareas'), text(job.tasksRu, job.es.tasks)) +
      fact(text('Условия из объявления', 'Condiciones publicadas'), text(job.conditionsRu, job.es.conditions)) +
      fact(text('Языки', 'Idiomas'), text(job.languagesRu, job.es.languages)) +
      fact(text('Опыт', 'Experiencia'), text(job.experienceRu, job.es.experience)) +
      fact(text('Оплата', 'Retribución'), salary) + '</dl>' +
      '<div class="jobs-observations"><p class="jobs-observation-label">' +
      text('По тексту объявления · ', 'Según el texto del anuncio · ') + dateLabel(job.lastCheckedDate, spanish) +
      '</p><div><h3>' + text('Что ясно из объявления', 'Qué queda claro') + '</h3><p>' +
      esc(text(job.clearRu, job.es.clear)) + '</p></div><div><h3>' +
      text('Что проверить до отклика', 'Qué confirmar antes de responder') + '</h3><p>' +
      esc(text(job.clarifyRu, job.es.clarify)) + '</p></div></div>' +
      '<div class="jobs-question"><p class="label">' + text('Вопрос работодателю', 'Una pregunta para aclarar') +
      '</p><p lang="es">' + esc(job.questionEs) + '</p>' +
      (spanish ? '' : '<p>' + esc(job.questionRu) + '</p>') + '</div>' +
      '<div class="jobs-card-end"><div><p>' + text('Источник: ', 'Fuente: ') + esc(job.sourceName) +
      '</p><p>' + esc(publication) + '</p>' +
      (job.expiresAt ? '<p>' + text('Срок по данным источника: ', 'Plazo en los datos de la fuente: ') + dateLabel(job.expiresAt.slice(0,10), spanish) + '</p>' : '') +
      '</div><a class="link" href="' + esc(job.sourceUrl) +
      '" target="_blank" rel="noopener noreferrer">' +
      text('Открыть объявление и откликнуться', 'Abrir la oferta y presentar candidatura') +
      ' <span aria-hidden="true">↗</span></a></div></article>';
  }).join('');
  const refresh = data.refreshAutomation?.active
    ? text('Проверяем подборку по вторникам и пятницам, каждые 3–4 дня.',
        'Revisamos la selección los martes y viernes, cada 3–4 días.') : '';
  return '<div data-jobs-library lang="' + language + '"><section class="jobs-hero wrap">' +
    '<a class="link" href="' + (spanish ? '/es/resources/' : '/resources/') + '">' +
    text('← Бесплатные материалы', '← Recursos gratuitos') + '</a>' +
    '<p class="label">' + text('Редакционная подборка · Испания', 'Selección editorial · España') + '</p>' +
    '<h1>' + text('Вакансии в Испании с пояснениями на русском', 'Vacantes en España, con contexto') + '</h1>' +
    '<p class="jobs-lead">' + text(
      'Мы собираем объявления из разных источников в одном месте, чтобы вам было проще сравнить задачи, требования и условия. Выберите город и сферу, прочитайте пояснения и перейдите к оригиналу, чтобы откликнуться.',
      'Reunimos anuncios de varias fuentes para ayudarte a comparar tareas, requisitos y condiciones. Filtrá por ciudad y sector, leé las aclaraciones y abrí el original para enviar tu candidatura.') + '</p>' +
    '<p>' + text('Поиск работы часто означает десятки вкладок и одни и те же вопросы. Эта подборка помогает разобраться в предложении и подготовить вопросы работодателю.',
      'Buscar trabajo suele implicar muchas pestañas y las mismas dudas. Esta selección ayuda a entender una propuesta y preparar preguntas para el empleador.') + '</p>' +
    '<p class="jobs-review">' + refresh + ' ' + text('Последняя завершённая проверка: ', 'Última revisión completa: ') +
    '<time datetime="' + data.selectionCheckedOn + '">' + dateLabel(data.selectionCheckedOn, spanish) +
    '</time>. ' + text('Вакансия могла закрыться после проверки.', 'Una vacante pudo cerrarse después de la revisión.') + '</p></section>' +
    '<section class="jobs-listing wrap" aria-label="' + text('Подборка вакансий', 'Selección de vacantes') + '">' +
    '<form class="jobs-filters" data-job-filters hidden role="search"><label class="jobs-search">' +
    text('Поиск по роли или навыку', 'Buscar por puesto o habilidad') +
    '<input type="search" name="q" maxlength="120" autocomplete="off" placeholder="' +
    text('Например, cocina, стрижки, клиенты', 'Por ejemplo, cocina, coloración, clientes') + '"></label>' +
    '<label>' + text('Город', 'Ciudad') + '<select name="city">' + options('city', text('Все города', 'Todas las ciudades')) + '</select></label>' +
    '<label>' + text('Провинция', 'Provincia') + '<select name="province">' + options('province', text('Все провинции', 'Todas las provincias')) + '</select></label>' +
    '<label>' + text('Сфера', 'Sector') + '<select name="industry">' + options('industry', text('Все сферы', 'Todos los sectores')) + '</select></label>' +
    '<button class="link jobs-reset" type="reset">' + text('Сбросить фильтры', 'Borrar filtros') + '</button></form>' +
    '<p class="jobs-count" data-jobs-count role="status" aria-live="polite">' + text('Объявлений в подборке: ', 'Anuncios en la selección: ') + jobs.length + '</p>' +
    '<p class="jobs-empty" data-jobs-empty hidden>' + text('По этим условиям ничего не найдено. Измените запрос или сбросьте фильтры.',
      'No hay resultados con estos filtros. Cambiá la búsqueda o borrá los filtros.') + '</p>' +
    '<div class="jobs-cards">' + cards + '</div></section>' +
    '<section class="jobs-editorial wrap"><h2>' + text('Как устроена подборка', 'Cómo seleccionamos los anuncios') + '</h2>' +
    '<p>' + text('Это независимая редакционная подборка Español con Natali. Мы не связаны с указанными работодателями, не представляем их и не получаем оплату за включение вакансий или отклики. Мы не участвуем в найме и не гарантируем условия или трудоустройство. Отклик отправляется работодателю или через площадку, где опубликовано объявление.',
      'Esta selección editorial de Español con Natali es independiente. No representamos a los empleadores ni recibimos pagos por incluir anuncios o candidaturas. La contratación y las condiciones se acuerdan con el empleador. La candidatura se envía al empleador o a la plataforma original.') + '</p>' +
    '<p>' + text('Сейчас подборка охватывает только Испанию. Это выборка, а не все вакансии рынка. Наличие объявления не означает, что для работы достаточно русского языка. Указанные условия — сведения из источника, а не оценка работодателя.',
      'La selección cubre España y es una muestra del mercado. Un anuncio no implica que alcance con hablar ruso. Las condiciones son las que declara la fuente, no una evaluación del empleador.') + '</p>' +
    '<p>' + text('Через 4 дня без повторной проверки помечаем карточку для пересмотра. Через 7 дней исключаем её из доступных. Закрытые объявления и предложения с истёкшим указанным сроком убираем из подборки.',
      'A los 4 días sin nueva comprobación marcamos la ficha como pendiente. A los 7 días la excluimos de disponibles. Retiramos anuncios cerrados o con un plazo publicado vencido.') + '</p>' +
    '<a class="link" href="/resources/spanish-for-job-search/">' + text('Как читать вакансии и обсуждать условия', 'Cómo leer una oferta y hablar de condiciones · guía en ruso') +
    ' <span aria-hidden="true">↗</span></a></section></div>';
}
