import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";

export type UserPreferences = {
  batchPreference: "Morning" | "Evening" | null;
  rankingCriteria: "earliest_finish" | "no_morning" | "max_free_days" | "balanced";
  maxTimetables: number;
};

export type AuthUser = {
  id: string;
  vitEmail: string;
  name?: string;
  registrationNumber?: string;
  whatsappNumber?: string;
  preferences: UserPreferences;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (vitEmail: string, password: string) => Promise<void>;
  signup: (
    vitEmail: string,
    password: string,
    confirmPassword: string,
    name?: string,
    registrationNumber?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (payload: Partial<AuthUser>) => Promise<void>;
  updatePreferences: (payload: Partial<UserPreferences>) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiRequest<{ user: AuthUser }>("/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (vitEmail: string, password: string) => {
    const data = await apiRequest<{ user: AuthUser }>("/login", {
      method: "POST",
      body: { vitEmail, password },
    });
    setUser(data.user);
  }, []);

  const signup = useCallback(
    async (
      vitEmail: string,
      password: string,
      confirmPassword: string,
      name?: string,
      registrationNumber?: string
    ) => {
      const data = await apiRequest<{ message: string; user?: AuthUser }>("/signup", {
        method: "POST",
        body: { vitEmail, password, confirmPassword, name, registrationNumber },
      });
      if (data?.user) {
        setUser(data.user);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest("/logout", { method: "POST" });
    } catch {
      // Ignore server-side logout failures and clear local auth state anyway.
    } finally {
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (payload: Partial<AuthUser>) => {
    const data = await apiRequest<{ user: AuthUser }>("/profile", {
      method: "PUT",
      body: payload,
    });
    setUser(data.user);
  }, []);

  const updatePreferences = useCallback(async (payload: Partial<UserPreferences>) => {
    const data = await apiRequest<{ user: AuthUser }>("/preferences", {
      method: "PUT",
      body: payload,
    });
    setUser(data.user);
  }, []);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await apiRequest("/password", {
      method: "PUT",
      body: { currentPassword, newPassword },
    });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      logout,
      refreshUser,
      updateProfile,
      updatePreferences,
      updatePassword,
    }),
    [loading, login, logout, refreshUser, signup, updatePassword, updatePreferences, updateProfile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
