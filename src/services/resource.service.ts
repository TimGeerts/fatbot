import fetch from "node-fetch";
import { IStoredMessage } from "../types";

const API_URL = process.env.FB_API; //won't work without the firebase api url
const apiGet = (url: string) =>
  fetch(`${API_URL}${url}`)
    .then((r) => r.json())
    .catch((r) => r.statusText);

const apiPut = (url: string, data: any) =>
  fetch(`${API_URL}${url}`, {
    method: "put",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  })
    .then((r) => r.json())
    .catch((r) => r.statusText);

const apiDelete = (url: string) =>
  fetch(`${API_URL}${url}`, {
    method: "delete",
  })
    .then((r) => r.json())
    .catch((r) => r.statusText);

export const getReminders = async () => {
  return apiGet("reminders.json");
};

export const getQuickLinks = async () => {
  return apiGet("quicklinks.json");
};

export const getGuides = async () => {
  return apiGet("guides.json");
};

export const getRoles = async () => {
  return apiGet("roles.json");
};

export const getRoleMessage = async () => {
  return apiGet("rolemessage.json");
};

export const setRoleMessage = async (msg: IStoredMessage) => {
  return apiPut("rolemessage.json", msg);
};

export const getDungeons = async () => {
  return apiGet("dungeons.json");
};
