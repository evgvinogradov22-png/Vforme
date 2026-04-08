// Хук для логирования событий пользователя
const SESSION_ID = Math.random().toString(36).slice(2);
const SESSION_START = Date.now();

function send(event, data = {}) {
  const token = localStorage.getItem('vforme_token');
  if (!token) return;
  const duration = Math.round((Date.now() - SESSION_START) / 1000);
  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ event, data, sessionId: SESSION_ID, duration }),
  }).catch(() => {});
}

// Логируем время на сайте при закрытии вкладки
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    send('session_end', { duration: Math.round((Date.now() - SESSION_START) / 1000) });
  });
}

export const log = {
  login: () => send('login'),
  register: () => send('register'),
  sessionStart: () => send('session_start'),
  programOpen: (programId, title) => send('program_open', { programId, title }),
  protocolOpen: (protocolId, title) => send('protocol_open', { protocolId, title }),
  paymentStart: (title, price) => send('payment_start', { title, price }),
  paymentSuccess: (title, price) => send('payment_success', { title, price }),
  buttonClick: (button, context) => send('button_click', { button, context }),
  chatMessage: () => send('chat_message'),
  tabSwitch: (tab) => send('tab_switch', { tab }),
};
