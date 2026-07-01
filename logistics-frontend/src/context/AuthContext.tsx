import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  extractRoleFromToken,
  extractUsernameFromToken,
} from '../lib/jwt';
import { UserService, type CurrentUserProfile } from '../services/api';

const TOKEN_KEY = 'logistics.auth.token';

export interface AuthUser {
  username: string | null;
  role: string;
  branchId: string | null;
  branchName: string | null;
}

interface AuthContextValue {
  token: string | null;
  role: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readTokenFromStorage(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function buildUserFromToken(token: string | null): AuthUser | null {
  if (!token) return null;

  const role = extractRoleFromToken(token);
  if (!role) return null;

  return {
    username: extractUsernameFromToken(token),
    role,
    branchId: null,
    branchName: null,
  };
}

function mergeProfile(_base: AuthUser, profile: CurrentUserProfile): AuthUser {
  return {
    username: profile.username,
    role: profile.role,
    branchId: profile.branchId,
    branchName: profile.branchName,
  };
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => readTokenFromStorage());
  const [user, setUser] = useState<AuthUser | null>(() =>
    buildUserFromToken(readTokenFromStorage()),
  );

  useEffect(() => {
    const baseUser = buildUserFromToken(token);
    setUser(baseUser);

    if (!token) return;

    let cancelled = false;

    void UserService.getProfile()
      .then((profile) => {
        if (!cancelled && baseUser) {
          setUser(mergeProfile(baseUser, profile));
        }
      })
      .catch(() => {
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY) {
        setToken(event.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const handleForcedLogout = () => {
      window.localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    };
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  const login = useCallback((newToken: string) => {
    window.localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      role: user?.role ?? null,
      user,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return ctx;
}

export const AUTH_TOKEN_KEY = TOKEN_KEY;
