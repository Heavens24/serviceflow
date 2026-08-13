import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AuthContext from "./authContext";
import authService from "../services/authService";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    authService.getStoredUser(),
  );

  const [loading, setLoading] = useState(() =>
    authService.hasToken(),
  );

  // ==========================
  // Refresh Current User
  // ==========================

  const refreshUser = useCallback(async () => {
    if (!authService.hasToken()) {
      authService.clearSession();
      setUser(null);
      setLoading(false);

      return null;
    }

    setLoading(true);

    try {
      const result =
        await authService.getCurrentUser();

      const currentUser =
        result?.user ?? null;

      setUser(currentUser);

      return currentUser;
    } catch {
      authService.clearSession();
      setUser(null);

      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================
  // Initial Session Validation
  // ==========================

  useEffect(() => {
    if (!authService.hasToken()) {
      return undefined;
    }

    let cancelled = false;

    const validateStoredSession =
      async () => {
        try {
          const result =
            await authService.getCurrentUser();

          if (cancelled) {
            return;
          }

          const currentUser =
            result?.user ?? null;

          setUser(currentUser);
        } catch {
          authService.clearSession();

          if (!cancelled) {
            setUser(null);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    void validateStoredSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================
  // Registration
  // ==========================

  const register = useCallback(
    async (formData) => {
      const result =
        await authService.register(
          formData,
        );

      setUser(result.user);

      return result;
    },
    [],
  );

  // ==========================
  // Login
  // ==========================

  const login = useCallback(
    async (credentials) => {
      const result =
        await authService.login(
          credentials,
        );

      setUser(result.user);

      return result;
    },
    [],
  );

  // ==========================
  // Logout
  // ==========================

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setLoading(false);
  }, []);

  // ==========================
  // Context Value
  // ==========================

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

export default AuthProvider;