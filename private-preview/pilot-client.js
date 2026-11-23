import { Conversation } from '@elevenlabs/client';

const byId = id => document.getElementById(id);
const copy = {
  ru: {
    themeTitle: 'Пейзаж', themes: { mallorca: 'Майорка', pinar: 'Сосновый лес', arena: 'Песок' },
    heading: 'Ваша практика', greet: name => `Здравствуйте, ${name}!`, allowance: count => ({ 2: 'Пробная практика · 15 минут', 1: 'Осталась одна беседа · до 7:30' })[count] ?? 'Пробная практика завершена',
    loading: 'Открываем практику…', access: 'Откройте свою личную ссылку.', unavailable: 'Сервис временно недоступен.', voice: 'Голосовая практика пока недоступна.',
    start: 'Начать практику', resume: 'Продолжить практику', opening: 'Подключаем микрофон…', speaking: 'Натали говорит', listening: 'Натали слушает',
    lesson: n => `Урок ${n}`, done: 'завершён', pause: 'Пауза',
    end: 'Завершить', refresh: 'Обновить', pending: 'Сохраняем результаты разговора…', complete: 'Спасибо за практику',
    mic: 'Разрешите доступ к микрофону и попробуйте снова.', network: 'Связь прервалась. Проверьте статус беседы.', memoryTitle: 'Прошлая практика',
    last: 'Последний разговор', history: 'Посмотреть разговор', pastConversations: 'Посмотреть разговоры',
    save: 'Можно остановиться и продолжить позже с оставшегося времени.', loadingHistory: 'Открываем историю…', you: 'Вы',
  },
  es: {
    themeTitle: 'Ambiente', themes: { mallorca: 'Mallorca', pinar: 'Pinar', arena: 'Arena' },
    heading: 'Tu práctica', greet: name => `¡Hola, ${name}!`, allowance: count => ({ 2: 'Prueba · 15 minutos', 1: 'Una charla disponible · hasta 7:30' })[count] ?? 'Prueba completada',
    loading: 'Abriendo tu práctica…', access: 'Abrí tu enlace personal.', unavailable: 'El servicio no está disponible por el momento.', voice: 'La práctica por voz aún no está disponible.',
    start: 'Empezar práctica', resume: 'Continuar práctica', opening: 'Conectando el micrófono…', speaking: 'Natali está hablando', listening: 'Natali te escucha',
    lesson: n => `Clase ${n}`, done: 'completada', pause: 'Pausar',
    end: 'Terminar', refresh: 'Actualizar', pending: 'Guardando tu práctica…', complete: 'Gracias por practicar',
    mic: 'Permití el acceso al micrófono y volvé a intentar.', network: 'Se cortó la conexión. Revisá el estado de la charla.', memoryTitle: 'Práctica anterior',
    last: 'Última conversación', history: 'Ver conversación', pastConversations: 'Ver conversaciones',
    save: 'Podés pausar y seguir más tarde con el tiempo que te quede.', loadingHistory: 'Abriendo tu historial…', you: 'Vos',
  },
};
let language = 'ru';
let profile = null;
let stage = 'loading';
let error = '';
let caption = '';
let conversation = null;
let generation = 0;
let lessonDeadline = 0;
let lessonTimer;
function formatTime(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

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
  const lesson = profile.lesson;
  const seconds = lessonDeadline ? Math.max(0, Math.ceil((lessonDeadline - Date.now()) / 1000)) : lesson?.seconds;
  byId('allowance').hidden = !lesson;
  if (lesson) {
    for (const n of [1, 2]) {
      const isCurrent = n === lesson.completed + 1;
      byId(`lesson-${n}`).dataset.current = String(isCurrent);
      byId(`lesson-label-${n}`).textContent = t.lesson(n);
      byId(`lesson-time-${n}`).textContent = n <= lesson.completed
        ? t.done : formatTime(isCurrent ? seconds : profile.slotSeconds);
    }
  }
  byId('voice-status').textContent = error ? t[error] : (ready ? '' : (t[status] ?? t.pending));
  byId('start').hidden = active || profile.status === 'complete' || profile.status === 'pending';
  byId('start').disabled = !ready;
  byId('start-label').textContent = t[profile.completed || (lesson && lesson.seconds < profile.slotSeconds) ? 'resume' : 'start'];
  byId('end').hidden = !active;
  byId('end').textContent = lesson ? t.pause : t.end;
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
    credentials: 'same-origin', body: JSON.stringify({ action, ...(profile ? { profileKey: profile.profileKey } : {}), ...fields }) });
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
      try {
        profile = await request('refresh');
      } catch (failure) {
        if (!poll || remaining === 1 || profile.status !== 'pending' || failure.message === 'access') throw failure;
        error = 'pending';
        render();
        await new Promise(resolve => setTimeout(resolve, 2400));
        continue;
      }
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
  clearInterval(lessonTimer);
  lessonDeadline = 0;
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
    const { signedUrl, dynamicVariables, lessonSeconds } = await request('start', { language });
    profile.status = 'pending';
    const connected = await Conversation.startSession({ signedUrl, dynamicVariables, connectionType: 'websocket',
      workletPaths: {
        rawAudioProcessor: '/tutor-audio/rawAudioProcessor.js',
        audioConcatProcessor: '/tutor-audio/audioConcatProcessor.js',
      },
      onConnect() {
        if (current !== generation) return;
        stage = 'listening';
        if (lessonSeconds > 0) {
          lessonDeadline = Date.now() + lessonSeconds * 1000;
          lessonTimer = setInterval(() => {
            if (Date.now() >= lessonDeadline) void finish();
            else render();
          }, 1000);
        }
        render();
      },
      onDisconnect() { if (current === generation) void finish(); },
      onError() { if (current === generation) void finish('network'); },
      onModeChange({ mode }) { if (current === generation) { stage = mode; render(); } },
      onMessage(message) { if (current === generation) { caption = message.message; render(); } },
    });
    if (current === generation) conversation = connected;
    else await connected.endSession();
  } catch (failure) {
    if (current !== generation) return;
    if (failure.message === 'access') { profile = null; stage = 'idle'; error = 'access'; render(); return; }
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
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && byId('history').open) {
    byId('history').open = false;
    byId('history-toggle').focus();
  }
});
byId('history').addEventListener('toggle', () => {
  if (byId('history').open) {
    void loadHistory();
    byId('history-list').focus();
  }
});
window.addEventListener('pagehide', () => {
  if (!conversation) return;
  void conversation.endSession();
  void fetch(location.pathname, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'refresh', profileKey: profile.profileKey }), keepalive: true }).catch(() => {});
});
document.addEventListener('visibilitychange', () => {
  if (lessonDeadline && Date.now() >= lessonDeadline) void finish();
  if (!document.hidden && stage === 'idle' && profile?.status === 'pending') void refresh(true);
});
const token = new URLSearchParams(location.hash.slice(1)).get('access');
const invite = /^\/t\/([a-z]{2,16}\/[A-Za-z0-9_-]{16})\/?$/.exec(location.pathname)?.[1];
if (location.hash || invite) window.history.replaceState(null, '', '/tutor-dashboard/');
render();
try {
  if (invite) profile = await request('claim', { invite });
  else profile = token ? await request('claim', { token }) : await request('profile');
  theme = savedTheme = profile.theme;
  stage = 'idle';
  render();
  if (profile.status === 'pending') void refresh(true);
} catch (failure) {
  error = failure.message === 'access' ? 'access' : 'unavailable';
  render();
}
