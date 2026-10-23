import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, setToken, setUnauthorizedHandler, type User } from "../services/api";

interface AuthState {
  user: User | null;
  notice: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: (notice?: string) => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const logout = useCallback((message?: string) => {
    setToken(null);
    setUser(null);
    setNotice(message ?? null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.login(email, password);
    setToken(data.token);
    setUser(data.user);
    setNotice(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout("Your session has expired. Please log in again."));
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo(() => ({ user, notice, login, logout, setUser }), [user, notice, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
