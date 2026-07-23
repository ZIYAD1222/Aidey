const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),

  getTasks: (token) => request('/tasks', { token }),
  createTask: (token, task) => request('/tasks', { method: 'POST', body: task, token }),
  updateTask: (token, id, updates) =>
    request(`/tasks/${id}`, { method: 'PATCH', body: updates, token }),
  deleteTask: (token, id) => request(`/tasks/${id}`, { method: 'DELETE', token }),

  parseTask: (token, message) =>
    request('/ai/parse-task', { method: 'POST', body: { message }, token }),
  getInsight: (token) => request('/ai/insight', { token }),
};
