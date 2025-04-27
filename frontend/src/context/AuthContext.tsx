// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import authApi, { User } from '../api/authApi';
import axiosInstance from '../api/axiosConfig';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ajusta el header Authorization para axios
  const setAuthHeader = (token: string | null) => {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axiosInstance.defaults.headers.common['Authorization'];
    }
  };

  // Al iniciar la app, miramos si hay token en storage
  useEffect(() => {
    const checkAuth = async () => {
      const access = localStorage.getItem('access_token');
      const refresh = localStorage.getItem('refresh_token');
      if (access) {
        setAuthHeader(access);
        try {
          const userData = await authApi.getMe();
          setUser(userData);
        } catch (err) {
          console.error('Error verificando sesión:', err);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setAuthHeader(null);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const { access, refresh, user: userData } = await authApi.login({ username, password });
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setAuthHeader(access);
      setUser(userData);
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setAuthHeader(null);
    setUser(null);
  };

  const hasRole = (role: string): boolean => {
    return user?.rol === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
