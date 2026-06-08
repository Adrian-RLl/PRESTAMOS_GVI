"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, Usuario } from '@/lib/api';

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  login: (token: string, user: Usuario) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

const PUBLIC_PATHS = ['/login', '/recuperar', '/restablecer-contrasena'];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Restaurar sesión desde localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Configurar header por defecto
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Redirigir a login si no hay sesión y no estamos en una página pública
    if (!isLoading) {
      const isPublicPath = PUBLIC_PATHS.includes(pathname || '');
      if (!token && !isPublicPath) {
        router.replace('/login');
      } else if (token && pathname === '/login') {
        router.replace('/');
      }
    }
  }, [token, pathname, isLoading, router]);

  const login = (newToken: string, newUser: Usuario) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    router.push('/login');
  };

  const isPublicPath = PUBLIC_PATHS.includes(pathname || '');
  const shouldRedirectToLogin = !isLoading && !token && !isPublicPath;
  const shouldRedirectToHome = !isLoading && token && pathname === '/login';
  const showLoading = isLoading || shouldRedirectToLogin || shouldRedirectToHome;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {showLoading ? (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-50 fixed inset-0 z-50">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
