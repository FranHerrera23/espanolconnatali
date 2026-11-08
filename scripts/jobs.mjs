import { esc } from './markdown.mjs';
import { jobFreshness } from '../site/jobs-state.js';

export const jobsRoute = '/resources/jobs-in-spain/';
const industries = {
  kitchen: ['Кухня', 'Cocina'],
  reception: ['Ресепшен', 'Recepción'],
  retail: ['Продажи', 'Ventas'],
  'customer-service': ['Поддержка клиентов', 'Atención al cliente'],
  beauty: ['Красота', 'Belleza'],
  logistics: ['Логистика', 'Logística'],
  maintenance: ['Технические службы', 'Mantenimiento'],
  administration: ['Администрация', 'Administración'],
  digital: ['Цифровые профессии', 'Digital'],
  hospitality: ['Рестораны', 'Restauración']
};
const dateLabel = (date, spanish) => new Intl.DateTimeFormat(spanish ? 'es-ES' : 'ru-RU', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
}).format(new Date(date + 'T00:00:00Z'));

export const lifeRoute = '/life-in-spain/';
export function jobsTeaser(language = 'ru', contained = false) {
  const label = language === 'es' ? 'Vida en España' : language === 'en' ? 'Life in Spain' : 'Жизнь в Испании';
  const detail = language === 'es' ? 'Recursos para orientarte, empezando por el empleo.' : language === 'en' ? 'Practical resources, starting with work.' : 'Практические ресурсы: начните с поиска работы.';
  const route = language === 'ru' ? lifeRoute : '/' + language + lifeRoute;
  return '<aside class="life-entry' + (contained ? '' : ' wrap') + '"><a href="' + route + '"><span>' + label + '</span><span>' + detail + '</span><span aria-hidden="true">↗</span></a></aside>';
}
export function renderLife(language = 'ru', {drafts=false} = {}) {
 const es=language==='es',en=language==='en';
 const t=(ru,spanish,english)=>en?english:es?spanish:ru;
 const prefix=language==='ru'?'':'/'+language;
 const categories=[
 ['home','Дом и жильё','Hogar','Home','Детские сады: возраст, часы, подход к адаптации и отзывы родителей.','Guarderías: edades, horarios, adaptación y experiencias de las familias.','Nurseries: ages, hours, settling in and parent experiences.','nurseries'],
 ['health','Здоровье','Salud','Health','Частные стоматологические клиники: специалисты, условия и опыт пациентов.','Clínicas dentales privadas: profesionales, condiciones y experiencia del paciente.','Private dental clinics: practitioners, terms and patient experience.','dental-clinics'],
 ['work','Бизнес и работа','Trabajo y negocios','Work and business','Вакансии и агентства для покупки недвижимости — с фактами и вопросами, которые стоит задать.','Empleo e inmobiliarias para comprar: hechos y preguntas que conviene hacer.','Jobs and agencies for buying property, with facts and useful questions.','property-buying'],
 ['beauty','Красота и уход','Belleza','Beauty','Маникюрные салоны: услуги, цены, запись и повторяющиеся темы в отзывах.','Nail salons: servicios, precios, reservas y temas recurrentes en las reseñas.','Nail salons: services, prices, bookings and recurring review themes.','nail-salons']
 ];
 const rows=categories.map(([id,ru,spanish,english,description,descEs,descEn,slug])=>'<article class="life-category" id="'+id+'"><div><p class="label">'+t(ru,spanish,english)+'</p><h2>'+t(description,descEs,descEn)+'</h2></div><div>'+(id==='work'?'<a class="life-category-link" href="'+(es?'/es':'')+jobsRoute+'">'+t('Смотреть вакансии','Ver vacantes','Browse jobs · RU')+' <span aria-hidden="true">↗</span></a>':'')+(drafts?'<a class="life-category-link" href="/life-in-spain/'+slug+'/">'+t('Открыть черновик сравнения','Abrir borrador comparativo','Open comparison draft')+' ↗</a>':'<p class="life-in-progress">'+t(id==='work'?'Сравнение агентств недвижимости — в работе.':'Готовим первую сравнительную подборку.',id==='work'?'Comparativa de inmobiliarias en preparación.':'Primera comparativa en preparación.',id==='work'?'Property agency comparison in progress.':'First comparison in progress.')+'</p>')+'</div></article>').join('');
 return '<div class="life-hub wrap"><header class="life-story"><p class="label">Español con Natali · '+t('Жизнь в Испании','Vida en España','Life in Spain')+'</p><h1>'+t('В новой стране.<br>На вашей стороне.','En un país nuevo.<br>De tu lado.','A new country.<br>Someone on your side.')+'</h1><div class="life-story-columns"><p class="life-story-lead">'+t('Мы знаем, каково начинать жизнь в другой стране. Искать работу, выбирать детский сад, находить врача — и собирать ответы по десяткам вкладок. Мы тоже через это проходили.','Sabemos lo que es empezar en otro país. Buscar trabajo, elegir una guardería, encontrar un dentista y juntar respuestas entre decenas de pestañas. También estuvimos ahí.','We know what starting over in another country feels like. Finding work, choosing a nursery, finding a dentist, piecing answers together across dozens of tabs. We have been there too.')+'</p><div><p>'+t('Поэтому мы собираем здесь то, что хотели бы найти сами: понятные сравнения, оригинальные источники и разбор каждого варианта. Чтобы вам было легче выбрать — а не просто открыть ещё одну вкладку.','Por eso reunimos lo que nos habría gustado encontrar: comparativas claras, fuentes originales y un análisis de cada opción. Para ayudarte a elegir, no para sumar otra pestaña.','So we are building what we wish we had found: clear comparisons, original sources and a closer look at each option. To help you choose, rather than open one more tab.')+'</p><p class="life-promise">'+t('Бесплатно. Без коммерческих партнёрств, спонсоров и комиссий.','Gratis. Sin afiliaciones comerciales, patrocinios ni comisiones.','Free. No commercial affiliations, sponsorships or commissions.')+'</p></div></div></header><section class="life-categories" aria-label="'+t('Направления','Categorías','Categories')+'">'+rows+'</section><section class="life-method"><p class="label">'+t('Как мы работаем','Cómo investigamos','How we research')+'</p><div><h2>'+t('Не только звёзды.<br>Полная картина.','Más que estrellas.<br>La imagen completa.','Beyond the stars.<br>The fuller picture.')+'</h2><p>'+t('Таблица помогает сравнить. В отдельном разборе — что у каждого варианта получается хорошо, какие ограничения стоит учесть и что остаётся уточнить. Мы сопоставляем доступные отзывы на разных платформах, отмечаем дату и смотрим на конкретную точку, а не только на название сети.','La tabla sirve para comparar. Cada análisis individual muestra fortalezas, límites y lo que falta confirmar. Contrastamos reseñas disponibles en distintas plataformas, indicamos la fecha y distinguimos cada sede de la marca.','The table helps you compare. Each individual analysis covers strengths, limitations and questions still to ask. We compare available reviews across platforms, show the date and distinguish each location from its brand.')+'</p><details><summary>'+t('Наши принципы отбора','Nuestros criterios','Our research principles')+'</summary><ul><li>'+t('Источники и даты доступны читателю. Неизвестное не выдаём за проверенный факт.','Fuentes y fechas visibles. Lo desconocido no se presenta como un hecho.','Visible sources and dates. Unknowns are not presented as established facts.')+'</li><li>'+t('Не складываем звёзды разных платформ в выдуманную общую оценку.','No mezclamos estrellas de distintas plataformas en una nota inventada.','We do not combine platform stars into an invented overall score.')+'</li><li>'+t('Отделяем опыт авторов отзывов от подтверждённых условий и нашего анализа.','Separamos las experiencias de reseñantes, los datos comprobados y nuestro análisis.','We distinguish reviewer experiences, checked facts and our analysis.')+'</li><li>'+t('За место в подборке нельзя заплатить. У нас нет комиссии за ваш выбор.','No se puede pagar para aparecer. No cobramos comisión por tu elección.','A place cannot be bought. We receive no commission for your choice.')+'</li></ul></details></div></section></div>';
}

export function renderJobs(data, language = 'ru', now = new Date()) {
  const spanish = language === 'es';
  const text = (ru, es) => spanish ? es : ru;
  const localeIndex = spanish ? 1 : 0;
  const jobs = data.jobs.filter(job => jobFreshness(job, now) !== 'hidden');
  const ids = new Set();
  for (const job of jobs) {
    if (!/^[A-Za-z0-9-]+$/.test(job.id) || ids.has(job.id) || job.country !== 'ES') throw Error('Invalid or duplicate curated job ' + job.id);
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
  const rows = [];
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
    const city = spanish ? job.city : job.cityRu || job.city;
    const concise = job.comparison?.[language];
    if (!concise?.schedule || !concise?.language) throw Error('Missing comparison facts ' + job.id);
    const money = job.salaryDisplay?.[language] || (job.salary ? new Intl.NumberFormat(spanish ? 'es-ES' : 'ru-RU').format(job.salary.min) + '–' + new Intl.NumberFormat(spanish ? 'es-ES' : 'ru-RU').format(job.salary.max) + ' €' : text('Не указана', 'No publicado'));
    const shortDate = new Intl.DateTimeFormat(spanish ? 'es-ES' : 'ru-RU', {day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(new Date(job.lastCheckedDate + 'T00:00:00Z'));
    const cell = (label, value, cls = '') => '<td class="' + cls + '" data-label="' + label + '">' + value + '</td>';
    rows.push('<tr data-job-row="' + job.id + '"><th scope="row"><a data-job-result="' + job.id + '" href="' + jobDetailRoute(job, language) + '" aria-label="' + text('Подробнее: ', 'Ver detalles: ') + esc(spanish ? job.titleEs : job.titleRu) + '"><strong>' + esc(spanish ? job.titleEs : job.titleRu) + '</strong><span>' + esc(job.employer) + '</span></a></th>' +
      cell(text('Город','Ciudad'), esc(city), 'jobs-city') +
      cell(text('Оплата','Sueldo'), '<span>' + esc(money) + '</span>' + (job.salary ? '<small>' + text('в месяц','al mes') + ' · ' + (job.salary?.grossNet === 'gross' ? text('брутто','bruto') : job.salary?.grossNet === 'net' ? text('нетто','neto') : text('брутто/нетто не указано','bruto/neto no indicado')) + '</small>' : ''), 'jobs-salary') +
      cell(text('Занятость','Jornada'), esc(concise.schedule), 'jobs-schedule') +
      cell(text('Язык','Idioma'), esc(concise.language), 'jobs-language') +
      cell(text('Проверено','Revisada'), '<time datetime="' + job.lastCheckedDate + '">' + shortDate + '</time><small data-row-freshness>' + (fresh === 'pending' ? text('Перепроверка','Pendiente') : '') + '</small>', 'jobs-date') +
      '<td class="jobs-action"><a data-job-result="' + job.id + '" href="' + jobDetailRoute(job, language) + '" aria-label="' + text('Подробнее: ', 'Ver detalles: ') + esc(spanish ? job.titleEs : job.titleRu) + '">' + text('Подробнее','Ver detalles') + ' <span aria-hidden="true">↗</span></a></td></tr>');
    const search = [job.titleRu, job.titleEs, job.employer, job.city, job.province, job.region,
      job.cityRu, job.provinceRu, job.tasksRu, job.languagesRu, job.experienceRu, ...Object.values(job.es)].join(' ');
    return '<article class="jobs-card" id="' + esc(job.id) + '" data-job data-city="' + esc(job.city) +
      '" data-province="' + esc(job.province) + '" data-industry="' + job.industry +
      '" data-search-text="' + esc(search) + '" data-last-checked-date="' + job.lastCheckedDate +
      '" data-expires-at="' + esc(job.expiresAt || '') + '" data-schedule-type="' + (job.scheduleType || '') + '" data-employment-kind="' + (job.employmentKind || 'employment') + '" data-salary-published="' + Boolean(job.salary) + '" data-status="' + job.status +
      '" data-verification-pending="' + Boolean(job.verificationPending) + '">' +
      '<div class="jobs-card-heading"><div><p class="label">' + industries[job.industry][localeIndex] +
      '</p><h2 tabindex="-1" id="' + job.id + '-title">' + esc(spanish ? job.titleEs : job.titleRu) + '</h2>' +
      (spanish ? '' : '<p class="jobs-original" lang="es">' + esc(job.titleEs) + '</p>') +
      '<p class="jobs-employer">' + esc(job.employer) + '</p></div><p class="jobs-location">' +
      esc(spanish ? job.city : job.cityRu || job.city) + '<br>' + esc(job.province + ' · ' + job.region) + '</p></div>' +
      '<div class="jobs-check"><span data-job-freshness>' +
      (fresh === 'pending' ? text('Нужна повторная проверка', 'Revisión pendiente')
        : text('Приём откликов был открыт при проверке', 'La fuente aceptaba candidaturas al revisar')) +
      '</span><span>' + text('Проверено ', 'Revisado el ') + '<time datetime="' + job.lastCheckedDate + '">' +
      dateLabel(job.lastCheckedDate, spanish) + '</time></span></div>' +
      '<div class="jobs-source"><p>' + esc(job.sourceName) + ' · ' + text('Проверено ', 'Revisado ') + dateLabel(job.lastCheckedDate, spanish) + '</p><a class="jobs-source-link" href="' + esc(job.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + text('Открыть объявление', 'Ver oferta original') + ' <span aria-hidden="true">↗</span></a></div>' +
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
      '<div class="jobs-card-end"><a class="jobs-permalink" href="' + jobDetailRoute(job, language) + '">' + text('Открыть отдельную страницу','Abrir ficha completa') + ' ↗</a><div><p>' + text('Источник: ', 'Fuente: ') + esc(job.sourceName) +
      '</p><p>' + esc(publication) + '</p>' +
      (job.expiresAt ? '<p>' + text('Срок по данным источника: ', 'Plazo en los datos de la fuente: ') + dateLabel(job.expiresAt.slice(0,10), spanish) + '</p>' : '') +
      '</div></div></article>';
  }).join('');
  const refresh = data.refreshAutomation?.active
    ? text('Проверяем подборку по вторникам и пятницам, каждые 3–4 дня.',
        'Revisamos la selección los martes y viernes, cada 3–4 días.') : '';
  const sectors = [...new Set(jobs.map(job => job.industry))].map(id => '<button type="button" data-sector="' + id + '" aria-pressed="false">' + industries[id][localeIndex] + '</button>').join('');
  return '<div data-jobs-library class="jobs-page wrap" lang="' + language + '"><header class="jobs-hero"><a class="jobs-breadcrumb" href="' + (spanish ? '/es' : '') + lifeRoute + '">' + text('← Жизнь в Испании', '← Vida en España') + '</a><div class="jobs-heading"><h1>' + text('Вакансии в Испании', 'Empleo en España') + '</h1><details class="jobs-method"><summary>' + text('О подборке', 'Sobre la selección') + '</summary><div><h2>' + text('Как устроена подборка', 'Cómo seleccionamos') + '</h2><p>' + refresh + '</p>' +
    '<p>' + text('Это независимая редакционная подборка Español con Natali. Мы не связаны с указанными работодателями, не представляем их и не получаем оплату за включение вакансий или отклики. Мы не участвуем в найме и не гарантируем условия или трудоустройство. Отклик отправляется работодателю или через площадку, где опубликовано объявление.',
      'Esta selección editorial de Español con Natali es independiente. No representamos a los empleadores ni recibimos pagos por incluir anuncios o candidaturas. La contratación y las condiciones se acuerdan con el empleador. La candidatura se envía al empleador o a la plataforma original.') + '</p>' +
    '<p>' + text('Сейчас подборка охватывает только Испанию. Это выборка, а не все вакансии рынка. Наличие объявления не означает, что для работы достаточно русского языка. Указанные условия — сведения из источника, а не оценка работодателя.',
      'La selección cubre España y es una muestra del mercado. Un anuncio no implica que alcance con hablar ruso. Las condiciones son las que declara la fuente, no una evaluación del empleador.') + '</p>' +
    '<p>' + text('Через 4 дня без повторной проверки помечаем карточку для пересмотра. Через 7 дней исключаем её из доступных. Закрытые объявления и предложения с истёкшим указанным сроком убираем из подборки.',
      'A los 4 días sin nueva comprobación marcamos la ficha como pendiente. A los 7 días la excluimos de disponibles. Retiramos anuncios cerrados o con un plazo publicado vencido.') + '</p>' +
    '</div></details></div><p class="jobs-lead">' + text('Сравните условия, выберите подходящее объявление и откликнитесь на сайте работодателя или площадки.', 'Compará condiciones, elegí una oferta y respondé en la fuente original.') + '</p></header>' +
    '<section class="jobs-listing" aria-label="' + text('Подборка вакансий', 'Vacantes') + '"><form class="jobs-filters" data-job-filters hidden role="search"><div class="jobs-searchbar"><label class="jobs-search">' + '<span>' + text('Профессия или навык', 'Puesto o habilidad') + '</span><input type="search" name="q" maxlength="120" autocomplete="off" placeholder="' + text('Например, cocina или маникюр', 'Por ejemplo, cocina o manicura') + '"></label><div class="jobs-city-control"><label for="jobs-city">' + text('Город', 'Ciudad') + '</label><select id="jobs-city" name="city">' + options('city',text('Все города', 'Todas las ciudades')) + '</select><button type="button" data-city-trigger hidden aria-haspopup="listbox" aria-expanded="false" aria-controls="jobs-city-options"><span>' + text('Город', 'Ciudad') + '</span><strong data-city-label>' + text('Все города', 'Todas las ciudades') + '</strong><span aria-hidden="true">⌄</span></button><div class="jobs-city-popover" id="jobs-city-popover" popover="auto"><div class="jobs-popover-head"><label>' + text('Найти город','Buscar ciudad') + '<input type="search" data-city-query autocomplete="off" placeholder="' + text('Название города','Nombre de la ciudad') + '"></label><button type="button" data-city-close aria-label="' + text('Закрыть города','Cerrar ciudades') + '">×</button></div><div id="jobs-city-options" role="listbox" aria-label="' + text('Города с вакансиями','Ciudades con vacantes') + '"></div><p data-city-empty hidden>' + text('Такого города пока нет в подборке.','Todavía no hay vacantes en esa ciudad.') + '</p></div></div><button class="jobs-more" type="button" data-more-filters aria-expanded="false" aria-controls="jobs-extra">' + text('Фильтры', 'Filtros') + ' <span data-more-count></span><span aria-hidden="true">☰</span></button></div><div class="jobs-sectors" role="group" aria-label="' + text('Сфера', 'Sector') + '"><button type="button" data-sector="" aria-pressed="true">' + text('Все сферы','Todos los sectores') + '</button>' + sectors + '</div><input type="hidden" name="industry"><div id="jobs-extra" class="jobs-extra" hidden><label>' + text('Провинция', 'Provincia') + '<select name="province">' + options('province', text('Все провинции','Todas las provincias')) + '</select></label><label>' + text('Занятость','Jornada') + '<select name="schedule"><option value="">' + text('Любая','Cualquiera') + '</option><option value="full">' + text('Полная','Completa') + '</option><option value="part">' + text('Неполная','Parcial') + '</option></select></label><label>' + text('Формат','Modalidad') + '<select name="kind"><option value="">' + text('Любой','Cualquiera') + '</option><option value="employment">' + text('Работа','Empleo') + '</option><option value="internship">' + text('Стажировка','Prácticas') + '</option></select></label><label class="jobs-check-filter"><input type="checkbox" name="pay" value="published">' + text('С опубликованной зарплатой','Con sueldo publicado') + '</label><button type="button" data-hide-filters>' + text('Готово','Listo') + '</button></div><div class="jobs-active" data-active-filters></div></form>' +
    '<div class="jobs-results-meta"><p data-jobs-count role="status" aria-live="polite">' + text('Объявлений: ', 'Anuncios: ') + jobs.length + '</p><span>' + text('Проверено: ', 'Revisado: ') + '<time datetime="' + data.selectionCheckedOn + '">' + dateLabel(data.selectionCheckedOn, spanish) + '</time></span></div><p class="jobs-notice" data-jobs-notice role="status" hidden></p><div class="jobs-empty" data-jobs-empty hidden><h2>' + text('Вакансий не найдено', 'No encontramos vacantes') + '</h2><p>' + text('Попробуйте другой город или уберите фильтры.', 'Probá otra ciudad o borrá los filtros.') + '</p><button type="button" data-clear-filters>' + text('Сбросить фильтры','Borrar filtros') + '</button></div>' +
    '<table class="jobs-table"><caption class="jobs-sr">' + text('Сравнение вакансий в Испании','Comparación de vacantes en España') + '</caption><thead><tr>' + [text('Вакансия и компания','Puesto y empresa'),text('Город','Ciudad'),text('Зарплата','Sueldo publicado'),text('Занятость','Jornada'),text('Язык','Idioma'),text('Проверено','Revisada'),text('Подробнее','Detalles')].map(label => '<th scope="col">' + label + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table><div class="jobs-pagination" data-jobs-pagination hidden><p data-jobs-shown></p><button type="button" data-jobs-more>' + text('Показать ещё','Mostrar más') + '</button></div></section>' +
    '<p class="jobs-independence">' + text('Независимая подборка. Мы не связаны с работодателями. Проверяем объявления по вторникам и пятницам; вакансия может закрыться после проверки.', 'Selección independiente, sin vínculo con los empleadores. Revisamos los anuncios los martes y viernes; pueden cerrarse después de la revisión.') + '</p><p class="jobs-guide"><a href="/resources/spanish-for-job-search/">' + text('Как читать вакансии и обсуждать условия', 'Cómo leer una oferta y hablar de condiciones · guía en ruso') + ' ↗</a></p>' +
    '<dialog open class="jobs-dialog" data-job-dialog><div class="jobs-dialog-toolbar" hidden><button type="button" data-job-back>' + text('← К результатам','← Volver a resultados') + '</button><span>' + text('Условия вакансии','Detalle de la vacante') + '</span><div class="jobs-dialog-languages"><a data-job-locale data-language="ru" href="' + jobsRoute + '" lang="ru" aria-label="Русский"' + (!spanish ? ' aria-current="true"' : '') + '>RU</a><a data-job-locale data-language="es" href="/es' + jobsRoute + '" lang="es" aria-label="Español"' + (spanish ? ' aria-current="true"' : '') + '>ES</a></div></div>' + cards + '</dialog></div>';
}

export function jobDetailRoute(job, language = 'ru') {
  return (language === 'es' ? '/es' : '') + jobsRoute + job.id + '/';
}
export function renderJobDetail(data, job, language = 'ru', now = new Date()) {
  const es = language === 'es';
  const t = (ru, spanish) => es ? spanish : ru;
  const back = '<a class="jobs-detail-back" data-jobs-return href="' + (es ? '/es' : '') + jobsRoute + '">' + t('← Все вакансии','← Todas las vacantes') + '</a>';
  if (jobFreshness(job, now) === 'hidden') return '<section class="job-detail-page wrap">' + back + '<h1>' + esc(es ? job.titleEs : job.titleRu) + '</h1><p class="jobs-closed">' + t('Это объявление больше не входит в актуальную подборку. Посмотрите доступные вакансии.','Este anuncio ya no forma parte de la selección actual. Consultá las vacantes disponibles.') + '</p><p>' + t('Последняя проверка: ','Última revisión: ') + dateLabel(job.lastCheckedDate,es) + '</p></section>';
  const listing=renderJobs({...data,jobs:[job]},language,now);
  const card=listing.match(/<article class="jobs-card"[\s\S]*?<\/article>/)[0].replace('<h2 tabindex="-1"','<h1 tabindex="-1"').replace('</h2>','</h1>');
  return '<section class="job-detail-page wrap">' + back + card + '<p class="jobs-independence">' + t('Независимая подборка. Мы не связаны с работодателем и не получаем комиссию за отклик. Условия подтверждайте в оригинальном источнике.','Selección independiente. No representamos al empleador ni cobramos por candidaturas. Confirmá las condiciones en la fuente original.') + '</p></section>';
}
export function publicJobs(data, base, now = new Date()) {
 return data.jobs.filter(job=>jobFreshness(job,now)!=='hidden').map(job=>({id:job.id,url:base+jobDetailRoute(job),title:job.titleRu,originalTitle:job.titleEs,employer:job.employer,city:job.city,cityRu:job.cityRu,province:job.province,sector:industries[job.industry][0],tasks:job.tasksRu,conditions:job.conditionsRu,languages:job.languagesRu,experience:job.experienceRu,salary:job.salary,salaryNote:job.salaryNoteRu||null,clear:job.clearRu,clarify:job.clarifyRu,question:job.questionEs,questionRu:job.questionRu,source:job.sourceUrl,sourceName:job.sourceName,sourcePublicationDate:job.publicationDate,sourcePublicationNote:job.publicationNoteRu||null,checkedOn:job.lastCheckedDate,expiresAt:job.expiresAt,freshness:jobFreshness(job,now)}));
}
