const BASE = '/api';

function getToken() { return localStorage.getItem('vforme_admin_token'); }

function headers() {
  const h = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

function formHeaders() {
  const h = {};
  const token = getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function req(method, path, body) {
  const opts = { method, headers: headers(), cache: 'no-store' };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

async function reqForm(method, path, formData) {
  const opts = { method, headers: formHeaders(), body: formData };
  const res = await fetch(BASE + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export const auth = {
  login: (email, password) => req('POST', '/auth/login', { email, password }),
  me: () => req('GET', '/auth/me'),
};

export const users = {
  getAll: () => req('GET', '/admin/users'),
  create: (data) => req('POST', '/admin/users', data),
  setRole: (id, role) => req('PUT', `/admin/users/${id}/role`, { role }),
  delete: (id) => req('DELETE', `/admin/users/${id}`),
  // access to programs
  setAccess: (userId, programId, granted) => req('POST', `/admin/users/${userId}/access`, { programId, granted }),
  setClub: (userId, active, days) => req('POST', `/admin/users/${userId}/club`, { active, days }),
};

export const programs = {
  getAll: () => req('GET', '/admin/programs'),
  create: (data) => req('POST', '/admin/programs', data),
  update: (id, data) => req('PUT', `/admin/programs/${id}`, data),
  delete: (id) => req('DELETE', `/admin/programs/${id}`),
};

export const modules = {
  create: (data) => req('POST', '/admin/modules', data),
  update: (id, data) => req('PUT', `/admin/modules/${id}`, data),
  delete: (id) => req('DELETE', `/admin/modules/${id}`),
};

export const lectures = {
  create: (data) => req('POST', '/admin/lectures', data),
  update: (id, data) => req('PUT', `/admin/lectures/${id}`, data),
  delete: (id) => req('DELETE', `/admin/lectures/${id}`),
};

export const recipes = {
  getAll: () => req('GET', '/admin/recipes'),
  create: (formData) => reqForm('POST', '/admin/recipes', formData),
  update: (id, data) => req('PUT', `/admin/recipes/${id}`, data),
  delete: (id) => req('DELETE', `/admin/recipes/${id}`),
};

export const schemes = {
  getAll: () => req('GET', '/admin/schemes'),
  create: (data) => req('POST', '/admin/schemes', data),
  update: (id, data) => req('PUT', `/admin/schemes/${id}`, data),
  delete: (id) => req('DELETE', `/admin/schemes/${id}`),
};

export const supplements = {
  create: (data) => req('POST', '/admin/supplements', data),
  update: (id, data) => req('PUT', `/admin/supplements/${id}`, data),
  delete: (id) => req('DELETE', `/admin/supplements/${id}`),
};

export const ai = {
  fill: (type, text) => req('POST', '/admin/ai-fill', { type, text }),
};

export const broadcast = {
  audience: () => req('GET', '/broadcast/audience'),
  segments: () => req('GET', '/broadcast/segments'),
  send: (data) => req('POST', '/broadcast/send', data),
  history: () => req('GET', '/broadcast/history'),
};
