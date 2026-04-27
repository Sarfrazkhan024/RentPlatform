import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dc_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fileUrl = (urlOrId) => {
  if (!urlOrId) return "";
  if (urlOrId.startsWith("http")) return urlOrId;
  if (urlOrId.startsWith("/api/")) return `${BACKEND_URL}${urlOrId}`;
  return urlOrId;
};
