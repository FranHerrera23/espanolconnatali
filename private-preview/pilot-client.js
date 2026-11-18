import { Conversation } from '@elevenlabs/client';

const byId = id => document.getElementById(id);
const copy = {
  ru: {
    themeTitle: 'Пейзаж', themes: { mallorca: 'Майорка', pinar: 'Сосновый лес', arena: 'Песок' },
    heading: 'Ваша практика', greet: name => `Здравствуйте, ${name}!`, allowance: count => ({ 2: 'Пробная практика · 15 минут', 1: 'Осталась одна беседа · до 7:30' })[count] ?? 'Пробная практика завершена',
    loading: 'Открываем практику…', access: 'Откройте свою личную ссылку.', unavailable: 'Сервис временно недоступен.', voice: 'Голосовая практика пока недоступна.',
    start: 'Начать практику', resume: 'Продолжить практику', opening: 'Подключаем микрофон…', speaking: 'Натали говорит', listening: 'Натали слушает',
    end: 'Завершить', refresh: 'Обновить', pending: 'Сохраняем результаты разговора…', complete: 'Спасибо за практику',
    mic: 'Разрешите доступ к микрофону и попробуйте снова.', network: 'Связь прервалась. Проверьте статус беседы.', memoryTitle: 'Прошлая практика',
    last: 'Последний разговор', history: 'Посмотреть разговор', pastConversations: 'Посмотреть разговоры', forget: 'Удалить историю',
    save: 'Текст разговора сохраняется автоматически.', loadingHistory: 'Открываем историю…', you: 'Вы',
    deleteHistory: 'Удалить', cancel: 'Отмена', confirm: 'Удалить разговоры из личного кабинета?',
  },
  es: {
    themeTitle: 'Ambiente', themes: { mallorca: 'Mallorca', pinar: 'Pinar', arena: 'Arena' },
    heading: 'Tu práctica', greet: name => `¡Hola, ${name}!`, allowance: count => ({ 2: 'Prueba · 15 minutos', 1: 'Una charla disponible · hasta 7:30' })[count] ?? 'Prueba completada',
    loading: 'Abriendo tu práctica…', access: 'Abrí tu enlace personal.', unavailable: 'El servicio no está disponible por el momento.', voice: 'La práctica por voz aún no está disponible.',
    start: 'Empezar práctica', resume: 'Continuar práctica', opening: 'Conectando el micrófono…', speaking: 'Natali está hablando', listening: 'Natali te escucha',
    end: 'Terminar', refresh: 'Actualizar', pending: 'Guardando tu práctica…', complete: 'Gracias por practicar',
    mic: 'Permití el acceso al micrófono y volvé a intentar.', network: 'Se cortó la conexión. Revisá el estado de la charla.', memoryTitle: 'Práctica anterior',
    last: 'Última conversación', history: 'Ver conversación', pastConversations: 'Ver conversaciones', forget: 'Borrar historial',
    save: 'El texto de tu charla se guarda automáticamente.', loadingHistory: 'Abriendo tu historial…', you: 'Vos',
    deleteHistory: 'Borrar', cancel: 'Cancelar', confirm: '¿Borrar las conversaciones de tu panel?',
  },
};
let language = 'ru';
let profile = null;
let stage = 'loading';
let error = '';
let caption = '';
let conversation = null;
let generation = 0;
let history = null;
let historyStatus = 'loadingHistory';
let refreshing = false;
let theme = 'mallorca';
let savedTheme = 'mallorca';
let savingTheme = Promise.resolve();

function render() {
  const t = copy[language];
  document.documentElement.lang = language;
  document.querySelectorAll('[data-lang]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === language)));
  byId('theme-title').textContent = t.themeTitle;
  for (const button of document.querySelectorAll('.scene')) button.lastElementChild.textContent = t.themes[button.dataset.theme];
  renderTheme();
  byId('entrance').hidden = Boolean(profile);
  byId('entrance').textContent = t[error || 'loading'];
  byId('dashboard').hidden = !profile;
  byId('greeting').textContent = profile ? t.greet(profile.name) : t.heading;
  if (!profile) return;
  const active = stage === 'listening' || stage === 'speaking';
  const idle = stage === 'idle';
  const ready = idle && profile.status === 'ready';
  const status = idle ? profile.status : stage;
  byId('allowance').textContent = t.allowance(profile.remaining);
  byId('voice-status').textContent = error ? t[error] : (ready ? '' : (t[status] ?? t.pending));
  byId('start').hidden = active || profile.status === 'complete' || profile.status === 'pending';
  byId('start').disabled = !ready;
  byId('start-label').textContent = t[profile.completed ? 'resume' : 'start'];
  byId('end').hidden = !active;
  byId('end').textContent = t.end;
  byId('refresh').hidden = !idle || profile.status !== 'pending' || !error;
  byId('refresh').textContent = t.refresh;
  byId('save-note').textContent = ready ? t.save : '';
  byId('caption').textContent = caption;
  byId('previous').hidden = active || !profile.lastPracticeAt;
  byId('memory-title').textContent = t.memoryTitle;
  byId('last-practice').textContent = profile.lastPracticeAt
    ? `${t.last} · ${date(profile.lastPracticeAt)}` : '';
  byId('phrase').hidden = !profile.memory;
  byId('phrase').textContent = profile.memory ? `«${profile.memory}»` : '';
  byId('history').hidden = !profile.historyCount;
  byId('history-toggle').textContent = t[profile.historyCount > 1 ? 'pastConversations' : 'history'];
  byId('forget').textContent = t.forget;
  byId('forget').disabled = profile.status === 'pending';
  byId('forget-question').textContent = t.confirm;
  byId('delete-history').textContent = t.deleteHistory;
  byId('cancel-forget').textContent = t.cancel;
  if (byId('history').open) renderHistory();
}

function renderTheme() {
  document.body.dataset.theme = theme;
  for (const button of document.querySelectorAll('.scene')) {
    button.disabled = !profile;
    button.setAttribute('aria-pressed', String(button.dataset.theme === theme));
  }
}

function chooseTheme(next) {
  if (!profile || next === theme) return;
  theme = next;
  renderTheme();
  savingTheme = savingTheme.then(async () => {
    if (theme !== next) return;
    try {
      let choice;
      try { choice = await request('appearance', { theme: next }); }
      catch (failure) {
        if (failure.message !== 'conflict') throw failure;
        choice = await request('appearance', { theme: next });
      }
      savedTheme = choice.theme;
    } catch {
      if (theme === next) { theme = savedTheme; renderTheme(); }
    }
  });
}

function date(value) {
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(value);
}

function renderHistory() {
  const list = byId('history-list');
  const t = copy[language];
  if (!history) { list.textContent = t[historyStatus]; return; }
  list.replaceChildren();
  for (const session of [...history].reverse()) {
    const entry = document.createElement('section');
    entry.className = 'history-entry';
    const timestamp = document.createElement('p');
    timestamp.className = 'history-date';
    timestamp.textContent = date(session.finishedAt);
    entry.append(timestamp);
    for (const { role, text } of session.transcript) {
      const line = document.createElement('p');
      line.className = 'history-line';
      const who = document.createElement('span');
      who.className = 'history-who';
      who.textContent = role === 'agent' ? 'Natali' : t.you;
      line.append(who, document.createTextNode(text));
      entry.append(line);
    }
    list.append(entry);
  }
}

async function loadHistory() {
  try {
    const saved = await request('history');
    if (profile.historyCount === saved.length) history = saved;
  }
  catch { historyStatus = 'unavailable'; }
  renderHistory();
}

async function request(action, fields) {
  const response = await fetch(location.pathname, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin', body: JSON.stringify({ action, ...fields }) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error);
  return payload;
}

async function refresh(poll = false) {
  if (refreshing) return;
  refreshing = true;
  try {
    for (let remaining = poll ? 9 : 1; remaining > 0; remaining--) {
      const previousCount = profile.historyCount;
      profile = await request('refresh');
      if (previousCount !== profile.historyCount && byId('history').open) void loadHistory();
      if (profile.status === 'pending' && remaining === 1) error = 'pending';
      if (profile.status !== 'pending' && error === 'pending') error = '';
      render();
      if (profile.status !== 'pending' || remaining === 1) return;
      await new Promise(resolve => setTimeout(resolve, 2400));
    }
  } catch (failure) {
    if (failure.message === 'access') profile = null;
    error = failure.message === 'conflict' ? 'pending' : (profile ? 'unavailable' : 'access');
    render();
  } finally { refreshing = false; }
}

async function finish(callError = '') {
  generation++;
  const current = conversation;
  conversation = null;
  stage = 'idle';
  error = callError;
  caption = '';
  render();
  try { await current?.endSession(); } finally { if (profile?.status === 'pending') await refresh(true); }
}

async function start() {
  if (stage !== 'idle' || profile.status !== 'ready') return;
  const current = ++generation;
  error = ''; caption = ''; stage = 'opening'; render();
  try {
    const permission = await navigator.mediaDevices.getUserMedia({ audio: true });
    permission.getTracks().forEach(track => track.stop());
    if (current !== generation) return;
    const { signedUrl, dynamicVariables } = await request('start', { language });
    profile.status = 'pending';
    const connected = await Conversation.startSession({ signedUrl, dynamicVariables, connectionType: 'websocket',
      onConnect() { if (current === generation) { stage = 'listening'; render(); } },
      onDisconnect() { if (current === generation) void finish(); },
      onError() { if (current === generation) void finish('network'); },
      onModeChange({ mode }) { if (current === generation) { stage = mode; render(); } },
      onMessage(message) { if (current === generation) { caption = message.message; render(); } },
    });
    if (current === generation) conversation = connected;
    else await connected.endSession();
  } catch (failure) {
    if (current !== generation) return;
    if (failure.message === 'pending' || failure.message === 'conflict' || failure.message === 'complete') {
      await finish();
      return refresh();
    }
    await finish(failure.name === 'NotAllowedError' ? 'mic' : failure.message === 'voice' ? 'voice' : 'network');
  }
}

document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => { language = button.dataset.lang; render(); }));
document.querySelectorAll('.scene').forEach(button => button.addEventListener('click', () => chooseTheme(button.dataset.theme)));
byId('start').addEventListener('click', start);
byId('end').addEventListener('click', () => finish());
byId('refresh').addEventListener('click', () => { error = ''; void refresh(); });
byId('history').addEventListener('toggle', () => {
  if (byId('history').open) void loadHistory();
  else byId('confirm-forget').hidden = true;
});
byId('forget').addEventListener('click', () => { byId('confirm-forget').hidden = false; byId('cancel-forget').focus(); });
byId('cancel-forget').addEventListener('click', () => { byId('confirm-forget').hidden = true; byId('forget').focus(); });
byId('delete-history').addEventListener('click', async () => {
  try {
    profile = await request('forget'); history = null; error = '';
    byId('history').open = false;
  } catch { error = 'unavailable'; }
  render();
  byId('greeting').focus();
});
window.addEventListener('pagehide', () => {
  if (!conversation) return;
  void conversation.endSession();
  void fetch(location.pathname, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'refresh' }), keepalive: true }).catch(() => {});
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && stage === 'idle' && profile?.status === 'pending') void refresh(true);
});
const token = new URLSearchParams(location.hash.slice(1)).get('access');
if (location.hash) window.history.replaceState(null, '', location.pathname);
render();
try {
  profile = token ? await request('claim', { token }) : await request('profile');
  theme = savedTheme = profile.theme;
  stage = 'idle';
  render();
  if (profile.status === 'pending') void refresh(true);
} catch (failure) {
  error = failure.message === 'access' ? 'access' : 'unavailable';
  render();
}
