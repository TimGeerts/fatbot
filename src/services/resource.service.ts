import fetch from 'node-fetch';

const API_URL = process.env.FB_API; //won't work without the firebase api url
const apiGet = (url: string) =>
  fetch(`${API_URL}${url}`)
    .then((r) => r.json())
    .catch((r) => r.statusText);

const apiPut = (url: string, data: any) =>
  fetch(`${API_URL}${url}`, {
    method: 'put',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })
    .then((r) => r.json())
    .catch((r) => r.statusText);

const apiDelete = (url: string) =>
  fetch(`${API_URL}${url}`, {
    method: 'delete',
  })
    .then((r) => r.json())
    .catch((r) => r.statusText);

export const getReminders = async () => {
  return apiGet('reminders.json');
};

export const getDungeons = async () => {
  return apiGet('dungeons.json');
};
