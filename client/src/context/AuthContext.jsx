import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import authService from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.getStoredUser());
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!authService.hasToken()) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const result = await authService.getCurrentUser();
      const currentUser = result.user ?? null;

      setUser(currentUser);
      return currentUser;
    } catch (error) {
      authService.clearSession();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const register = useCallback(async (formData) => {
    const result = await authService.register(formData);
    setUser(result.user);
    return result;
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      register,
      login,
      logout,
      refreshUser,
    }),
    [
      user,
      loading,
      register,
      login,
      logout,
      refreshUser,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}