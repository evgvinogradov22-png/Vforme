const BASE = '/api';

function getToken() { return localStorage.getItem('vforme_token'); }

function headers(isFormData = false) {
  const h = {};
  const token = getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (!isFormData) h['Content-Type'] = 'application/json';
  return h;
}

async function req(method, path, body, isFormData = false) {
  const opts = { method, headers: headers(isFormData) };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : { error: await res.text() };
  if (!res.ok) throw new Error(data.error || `Ошибка сервера (${res.status})`);
  return data;
}

export const auth = {
  register: (email, password, name) => req('POST', '/auth/register', { email, password, name }),
  login: (email, password) => req('POST', '/auth/login', { email, password }),
  me: () => req('GET', '/auth/me'),
};

export const programs = {
  getAll: () => req('GET', '/programs'),
  getOne: (id) => req('GET', `/programs/${id}`),
};

export const recipes = {
  getAll: (cat) => req('GET', `/recipes${cat && cat !== 'Все' ? `?cat=${cat}` : ''}`),
  getOne: (id) => req('GET', `/recipes/${id}`),
  create: (formData) => req('POST', '/recipes', formData, true),
  like: (id) => req('POST', `/recipes/${id}/like`),
  save: (id) => req('POST', `/recipes/${id}/save`),
  saved: () => req('GET', '/recipes/saved/list'),
  random: () => req('GET', '/recipes/random/one'),
  comment: (id, text) => req('POST', `/recipes/${id}/comment`, { text }),
};

export const supplements = {
  getAll: () => req('GET', '/supplements'),
};

export const tracker = {
  getHabits: () => req('GET', '/tracker/habits'),
  saveHabit: (data) => req('POST', '/tracker/habits', data),
  getTasks: () => req('GET', '/tracker/tasks'),
  createTask: (data) => req('POST', '/tracker/tasks', data),
  updateTask: (id, data) => req('PATCH', `/tracker/tasks/${id}`, data),
};

export const profile = {
  get: () => req('GET', '/profile'),
  save: (answers) => req('POST', '/profile', { answers }),
  getProgress: () => req('GET', '/profile/progress'),
  saveProgress: (data) => req('POST', '/profile/progress', data),
};

export const points = {
  get: () => req('GET', '/points'),
  award: (amount, reason, refId, refType) => req('POST', '/points/award', { amount, reason, refId, refType }),
};

export const payment = {
  prepare: (programId, amount, promoId) =>
    req('POST', '/payment/prepare', { programId, amount, promoId }),
  createLink: (programId, programTitle, price, userId, userEmail, promoId) =>
    req('POST', '/payment/create', { programId, programTitle, price, userId, userEmail, promoId }),
};

export const promo = {
  check: (code, programId, price) => req('POST', '/promo/check', { code, programId, price }),
};

export const telegram = {
  getLinkUrl: () => req('POST', '/telegram/link-token'),
  unlink: () => req('POST', '/telegram/unlink'),
};
