import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { AuthUser, UserRole } from '../types/auth';
import { USER_TOKEN_STORAGE_KEY, USER_DETAILS_STORAGE_KEY } from '../services/apiClient';
import { decodeJwt, isJwtExpired } from '../utils/jwt';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Costruisce un oggetto AuthUser tipizzato estraendo i dati dal token JWT decodificato */
const buildAuthUserFromToken = (token: string): AuthUser | null => {
  const payload = decodeJwt(token);
  if (!payload) {
    return null;
  }
  const role: UserRole = payload.role === 'ADMIN' ? 'ADMIN' : 'USER';
  return {
    id: payload.userId,
    email: payload.sub,
    username: payload.username,
    role,
    token,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedToken = localStorage.getItem(USER_TOKEN_STORAGE_KEY);
    const storedUserJson = localStorage.getItem(USER_DETAILS_STORAGE_KEY);

    if (!storedToken || isJwtExpired(storedToken)) {
      if (storedToken) {
        localStorage.removeItem(USER_TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_DETAILS_STORAGE_KEY);
      }
      return null;
    }

    if (storedUserJson) {
      try {
        return JSON.parse(storedUserJson) as AuthUser;
      } catch {
        // Fallback: se il JSON salvato è corrotto, lo ricostruisce dal token
      }
    }

    const authUser = buildAuthUserFromToken(storedToken);
    if (authUser) {
      localStorage.setItem(USER_DETAILS_STORAGE_KEY, JSON.stringify(authUser));
    }
    return authUser;
  });

  const logout = useCallback(() => {
    localStorage.removeItem(USER_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_DETAILS_STORAGE_KEY);
    setUser(null);
  }, []);

  const login = useCallback(
    (token: string) => {
      const authUser = buildAuthUserFromToken(token);
      if (!authUser) {
        logout();
        return;
      }

      localStorage.setItem(USER_TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_DETAILS_STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
    },
    [logout]
  );

  // Ascolto dell'evento di logout forzato (401) emesso da apiClient
  useEffect(() => {
    window.addEventListener('auth:unauthorized', logout);
    return () => {
      window.removeEventListener('auth:unauthorized', logout);
    };
  }, [logout]);

  const value: AuthContextType = useMemo(
    () => ({
      user: user,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'ADMIN',
      isLoading: false,
      login: login,
      logout: logout,
    }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve essere utilizzato all'interno di un AuthProvider");
  }
  return context;
};
