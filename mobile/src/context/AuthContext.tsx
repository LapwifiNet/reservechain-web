import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { api } from "@/api/client";
import type { Investor, InvestorStatus } from "@/api/types";

const TOKEN_KEY = "rc_investor_token";

type AuthContextValue = {
  ready: boolean;
  token: string | null;
  investor: Investor | null;
  status: InvestorStatus | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<void>;
  refreshStatus: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [status, setStatus] = useState<InvestorStatus | null>(null);

  useEffect(() => {
    (async () => {
      const saved = await SecureStore.getItemAsync(TOKEN_KEY);
      if (saved) {
        setToken(saved);
        try {
          setStatus(await api.status(saved));
        } catch {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          setToken(null);
        }
      }
      setReady(true);
    })();
  }, []);

  async function persist(next: { accessToken: string; investor: Investor }) {
    await SecureStore.setItemAsync(TOKEN_KEY, next.accessToken);
    setToken(next.accessToken);
    setInvestor(next.investor);
    setStatus(await api.status(next.accessToken));
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      token,
      investor,
      status,
      login: async (email, password) => {
        persist(await api.login({ email, password }));
      },
      register: async (email, password, fullName) => {
        persist(await api.register({ email, password, fullName }));
      },
      refreshStatus: async () => {
        if (token) setStatus(await api.status(token));
      },
      logout: async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setToken(null);
        setInvestor(null);
        setStatus(null);
      },
    }),
    [ready, token, investor, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
