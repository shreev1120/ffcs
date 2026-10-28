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
  isGuest?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  isGuest: boolean;
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
  loginAsGuest: (name?: string, regNo?: string) => void;
  refreshUser: () => Promise<void>;
  updateProfile: (payload: Partial<AuthUser>) => Promise<void>;
  updatePreferences: (payload: Partial<UserPreferences>) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Local storage keys for 100% serverless / GitHub Pages account management
const STORAGE_REGISTERED_ACCOUNTS = "vtop_ffcs_registered_accounts";
const STORAGE_CURRENT_USER = "vtop_ffcs_current_user";
const STORAGE_GUEST_USER = "vtop_ffcs_guest_user";

async function hashClientPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "_vit_ffcs_client_salt_2026");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = (hash << 5) - hash + password.charCodeAt(i);
      hash |= 0;
    }
    return `fallback_${hash}`;
  }
}

function getLocalAccounts(): Record<string, { email: string; passwordHash: string; user: AuthUser }> {
  try {
    const raw = localStorage.getItem(STORAGE_REGISTERED_ACCOUNTS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalAccounts(accounts: Record<string, { email: string; passwordHash: string; user: AuthUser }>) {
  try {
    localStorage.setItem(STORAGE_REGISTERED_ACCOUNTS, JSON.stringify(accounts));
  } catch {}
}

function saveCurrentUser(user: AuthUser | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_CURRENT_USER);
    }
  } catch {}
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loginAsGuest = useCallback((name = "Guest Student", regNo = "Instant Access") => {
    const guestUser: AuthUser = {
      id: "guest-vit-student",
      vitEmail: "guest@vitstudent.ac.in",
      name: name || "Guest Student",
      registrationNumber: regNo || "Instant Access",
      isGuest: true,
      preferences: {
        batchPreference: "Morning",
        rankingCriteria: "balanced",
        maxTimetables: 50,
      },
    };
    try {
      localStorage.setItem(STORAGE_GUEST_USER, JSON.stringify(guestUser));
    } catch {}
    setUser(guestUser);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiRequest<{ user: AuthUser }>("/me");
      if (data?.user) {
        setUser(data.user);
        saveCurrentUser(data.user);
        return;
      }
    } catch {
      // Offline / Static host fallback
      try {
        const savedCurrent = localStorage.getItem(STORAGE_CURRENT_USER);
        if (savedCurrent) {
          setUser(JSON.parse(savedCurrent));
          return;
        }
        const savedGuest = localStorage.getItem(STORAGE_GUEST_USER);
        if (savedGuest) {
          setUser(JSON.parse(savedGuest));
          return;
        }
      } catch {}
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (vitEmail: string, password: string) => {
    const cleanEmail = vitEmail.trim().toLowerCase();
    if (!cleanEmail.endsWith("@vitstudent.ac.in")) {
      throw new Error("Invalid email format. Use your VIT student email (@vitstudent.ac.in).");
    }
    if (!password) {
      throw new Error("Password is required.");
    }

    // 1. Try backend API first if available
    try {
      const data = await apiRequest<{ user: AuthUser }>("/login", {
        method: "POST",
        body: { vitEmail: cleanEmail, password },
      });
      if (data?.user) {
        setUser(data.user);
        saveCurrentUser(data.user);
        return;
      }
    } catch (apiErr) {
      const msg = apiErr instanceof Error ? apiErr.message : "";
      // If server explicitly returned wrong password on a real backend, propagate it
      if (msg.includes("Invalid credentials") && !window.location.hostname.endsWith("github.io")) {
        throw apiErr;
      }
    }

    // 2. Client-side account lookup
    const accounts = getLocalAccounts();
    const pwdHash = await hashClientPassword(password);
    const existing = accounts[cleanEmail];

    if (existing) {
      if (existing.passwordHash !== pwdHash) {
        throw new Error("Invalid credentials. Check your email or password.");
      }
      setUser(existing.user);
      saveCurrentUser(existing.user);
      return;
    }

    // 3. Initialize account automatically if registering or logging in for the first time
    const initialUser: AuthUser = {
      id: `student-${Date.now()}`,
      vitEmail: cleanEmail,
      name: cleanEmail.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      registrationNumber: "",
      preferences: {
        batchPreference: "Morning",
        rankingCriteria: "balanced",
        maxTimetables: 50,
      },
      isGuest: false,
    };

    accounts[cleanEmail] = {
      email: cleanEmail,
      passwordHash: pwdHash,
      user: initialUser,
    };

    saveLocalAccounts(accounts);
    saveCurrentUser(initialUser);
    setUser(initialUser);
  }, []);

  const signup = useCallback(
    async (
      vitEmail: string,
      password: string,
      confirmPassword: string,
      name?: string,
      registrationNumber?: string
    ) => {
      const cleanEmail = vitEmail.trim().toLowerCase();
      if (!cleanEmail.endsWith("@vitstudent.ac.in")) {
        throw new Error("VIT student email must end with @vitstudent.ac.in");
      }
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }
      if (confirmPassword && password !== confirmPassword) {
        throw new Error("Password and confirm password do not match.");
      }

      // 1. Try backend API first if available
      try {
        const data = await apiRequest<{ message: string; user?: AuthUser }>("/signup", {
          method: "POST",
          body: { vitEmail: cleanEmail, password, confirmPassword, name, registrationNumber },
        });
        if (data?.user) {
          setUser(data.user);
          saveCurrentUser(data.user);
          return;
        }
      } catch (apiErr) {
        const msg = apiErr instanceof Error ? apiErr.message : "";
        if (msg.includes("already exists") && !window.location.hostname.endsWith("github.io")) {
          throw apiErr;
        }
      }

      // 2. Client-side account persistence
      const accounts = getLocalAccounts();
      const pwdHash = await hashClientPassword(password);

      const registeredUser: AuthUser = {
        id: `student-${Date.now()}`,
        vitEmail: cleanEmail,
        name: (name || cleanEmail.split("@")[0]).trim(),
        registrationNumber: (registrationNumber || "").trim().toUpperCase(),
        preferences: {
          batchPreference: "Morning",
          rankingCriteria: "balanced",
          maxTimetables: 50,
        },
        isGuest: false,
      };

      accounts[cleanEmail] = {
        email: cleanEmail,
        passwordHash: pwdHash,
        user: registeredUser,
      };

      saveLocalAccounts(accounts);
      saveCurrentUser(registeredUser);
      setUser(registeredUser);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest("/logout", { method: "POST" });
    } catch {
      // Non-blocking
    } finally {
      saveCurrentUser(null);
      try {
        localStorage.removeItem(STORAGE_GUEST_USER);
      } catch {}
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (payload: Partial<AuthUser>) => {
    try {
      const data = await apiRequest<{ user: AuthUser }>("/profile", {
        method: "PUT",
        body: payload,
      });
      if (data?.user) {
        setUser(data.user);
        saveCurrentUser(data.user);
        return;
      }
    } catch {}

    setUser((prev) => {
      if (!prev) return null;
      const updated: AuthUser = {
        ...prev,
        name: payload.name !== undefined ? payload.name : prev.name,
        registrationNumber:
          payload.registrationNumber !== undefined ? payload.registrationNumber : prev.registrationNumber,
        whatsappNumber: payload.whatsappNumber !== undefined ? payload.whatsappNumber : prev.whatsappNumber,
      };
      saveCurrentUser(updated);
      const accounts = getLocalAccounts();
      if (accounts[updated.vitEmail]) {
        accounts[updated.vitEmail].user = updated;
        saveLocalAccounts(accounts);
      }
      return updated;
    });
  }, []);

  const updatePreferences = useCallback(async (payload: Partial<UserPreferences>) => {
    try {
      const data = await apiRequest<{ user: AuthUser }>("/preferences", {
        method: "PUT",
        body: payload,
      });
      if (data?.user) {
        setUser(data.user);
        saveCurrentUser(data.user);
        return;
      }
    } catch {}

    setUser((prev) => {
      if (!prev) return null;
      const updated: AuthUser = {
        ...prev,
        preferences: {
          ...prev.preferences,
          ...payload,
        },
      };
      saveCurrentUser(updated);
      const accounts = getLocalAccounts();
      if (accounts[updated.vitEmail]) {
        accounts[updated.vitEmail].user = updated;
        saveLocalAccounts(accounts);
      }
      return updated;
    });
  }, []);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long.");
    }
    try {
      await apiRequest("/password", {
        method: "PUT",
        body: { currentPassword, newPassword },
      });
      saveCurrentUser(null);
      setUser(null);
      return;
    } catch {}

    const accounts = getLocalAccounts();
    const currentUserStr = localStorage.getItem(STORAGE_CURRENT_USER);
    if (!currentUserStr) throw new Error("No active student session.");
    const currentUser: AuthUser = JSON.parse(currentUserStr);

    const currHash = await hashClientPassword(currentPassword);
    const account = accounts[currentUser.vitEmail];
    if (account && account.passwordHash !== currHash) {
      throw new Error("Current password is incorrect.");
    }

    const newHash = await hashClientPassword(newPassword);
    if (account) {
      account.passwordHash = newHash;
      saveLocalAccounts(accounts);
    }
    saveCurrentUser(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isGuest: !!user?.isGuest,
      loading,
      login,
      signup,
      logout,
      loginAsGuest,
      refreshUser,
      updateProfile,
      updatePreferences,
      updatePassword,
    }),
    [loading, login, logout, loginAsGuest, refreshUser, signup, updatePassword, updatePreferences, updateProfile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
