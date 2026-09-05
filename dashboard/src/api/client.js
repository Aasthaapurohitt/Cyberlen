import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const client = axios.create({ baseURL: API_BASE_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("cyberlens_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("cyberlens_token");
      localStorage.removeItem("cyberlens_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (email, password) => client.post("/api/auth/login", { email, password }),
  register: (name, email, password) =>
    client.post("/api/auth/register", { name, email, password }),
  me: () => client.get("/api/auth/me"),
};

export const scanApi = {
  getHistory: (page = 1, limit = 20) =>
    client.get("/api/history", { params: { page, limit } }),
  getScan: (id) => client.get(`/api/history/${id}`),
};

export default client;
