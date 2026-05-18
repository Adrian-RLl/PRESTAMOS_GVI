"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Mail, Lock, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function LoginPage() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones manuales para evitar el aviso por defecto del navegador
    if (!correo.trim() && !password.trim()) {
      setError('Por favor, ingresa tu correo electrónico y tu contraseña.');
      return;
    }
    if (!correo.trim()) {
      setError('El correo electrónico es obligatorio.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@vanguardfresh\.pe$/i;
    if (!emailRegex.test(correo)) {
      setError('Por favor, ingresa un correo corporativo válido (ej. usuario@vanguardfresh.pe).');
      return;
    }

    if (!password.trim()) {
      setError('La contraseña es obligatoria.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        correo,
        contraseña: password,
      });

      if (response.data.token) {
        login(response.data.token, response.data.usuario);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50 z-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 text-center bg-slate-900 text-white">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-blue-600 mb-4 shadow-lg shadow-blue-500/30">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">VGI Préstamos</h1>
          <p className="text-slate-400 mt-2">Ingresa a tu cuenta para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6" noValidate>
          {error && (
            <div className="bg-red-50/80 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl text-sm flex items-start shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-800">Error de acceso</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail size={20} />
                </div>
                <input 
                  type="email" 
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-white text-slate-900 outline-none transition-all ${
                    error && !correo.trim() 
                      ? 'border-red-400 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                      : 'border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="usuario@vanguardfresh.pe"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock size={20} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-white text-slate-900 outline-none transition-all ${
                    error && !password.trim() && correo.trim()
                      ? 'border-red-400 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                      : 'border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-70"
          >
            {loading ? 'Iniciando sesión...' : 'Ingresar al sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
