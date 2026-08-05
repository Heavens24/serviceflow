import api from "./api";

const TOKEN_KEY = "serviceflow_access_token";
const USER_KEY = "serviceflow_user";

const saveSession = (data) => {
  if (data?.access_token) {
    localStorage.setItem(TOKEN_KEY, data.access_token);
  }

  if (data?.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const getStoredUser = () => {
  const storedUser = localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

const register = async (userData) => {
  const response = await api.post("/api/auth/register", userData);
  saveSession(response.data);
  return response.data;
};

const login = async (credentials) => {
  const response = await api.post("/api/auth/login", credentials);
  saveSession(response.data);
  return response.data;
};

const getCurrentUser = async () => {
  const response = await api.get("/api/auth/me");

  if (response.data?.user) {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(response.data.user),
    );
  }

  return response.data;
};

const logout = () => {
  clearSession();
};

const hasToken = () => Boolean(localStorage.getItem(TOKEN_KEY));

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  getStoredUser,
  hasToken,
  saveSession,
  clearSession,
};

export default authService;