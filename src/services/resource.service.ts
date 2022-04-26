import fetch from "node-fetch";
import { IStoredKeystone } from "../types";

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

const apiPost = (url: string, data: any) =>
  fetch(`${API_URL}${url}`, {
    method: "post",
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

export const getDungeons = async () => {
  return apiGet("dungeons.json");
};

export const getKeystones = async () => {
  return apiGet("keystones.json");
};

export const setKeystone = async (
  userId: string,
  char: string,
  msg: IStoredKeystone
) => {
  let userDiscriminator = userId;
  if (char) {
    userDiscriminator += `-${char.toLocaleLowerCase()}`;
  }
  return apiPut(`keystones/${userDiscriminator}.json`, msg);
};

export const clearKeystones = async () => {
  return apiPut(`keystones.json`, {});
};
