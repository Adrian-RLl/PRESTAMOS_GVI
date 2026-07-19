"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Mail, Lock, AlertCircle, Eye, EyeOff, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();

  // Estado del Temporizador de Bloqueo
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Cargar Username Recordado
  useEffect(() => {
    const savedUsername = localStorage.getItem('remember_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  // Lógica del Temporizador Regresivo (Lockout)
  useEffect(() => {
    if (lockoutSeconds > 0) {
      const interval = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setError(''); // Limpiamos el error de bloqueo al acabar el tiempo
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutSeconds]);

  const formatLockoutTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')} minutos`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return; // Evitar envíos si está bloqueado

    setError('');

    // Validaciones manuales
    if (!username.trim() && !password.trim()) {
      setError('Por favor, ingresa tu nombre de usuario y tu contraseña.');
      return;
    }
    if (!username.trim()) {
      setError('El nombre de usuario es obligatorio.');
      return;
    }

    if (!password.trim()) {
      setError('La contraseña es obligatoria.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        username,
        contraseña: password,
      });

      if (response.data.token) {
        // Guardar username si se seleccionó "Recordarme"
        if (rememberMe) {
          localStorage.setItem('remember_username', username);
        } else {
          localStorage.removeItem('remember_username');
        }
        login(response.data.token, response.data.usuario);
      }
    } catch (err: any) {
      const apiMessage = err.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
      setError(apiMessage);

      // Detectar si la cuenta ha sido bloqueada
      if (apiMessage.includes('bloqueada') || apiMessage.includes('bloqueado')) {
        // Intentar parsear los minutos devueltos por el backend (ej: "en 15 minutos")
        const matchMinutos = apiMessage.match(/(\d+)\s*minuto/i);
        if (matchMinutos) {
          const minutos = parseInt(matchMinutos[1]);
          setLockoutSeconds(minutos * 60);
        } else {
          setLockoutSeconds(15 * 60); // 15 minutos por defecto
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950 overflow-hidden z-50 p-4 font-sans">
      
      {/* Forzar estilos CSS para anular el color blanco por defecto del autocompletado y el color oscuro por defecto de globals.css */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s;
          box-shadow: inset 0 0 20px 20px #0b1329 !important;
        }
        .login-input {
          color: #ffffff !important;
        }
        .login-input::placeholder {
          color: #64748b !important;
        }
      `}</style>

      {/* Círculos de Gradientes de Fondo (Mesh Gradients Modernos) */}
      <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full bg-blue-600/35 blur-[120px] pointer-events-none animate-pulse duration-5000"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-indigo-600/25 blur-[140px] pointer-events-none"></div>
      <div className="absolute top-[35%] right-[15%] w-[35%] h-[35%] rounded-full bg-emerald-500/10 blur-[110px] pointer-events-none"></div>

      {/* Tarjeta con Efecto Glassmorphism */}
      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-2xl rounded-[32px] border border-white/10 shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Encabezado con Logo Premium */}
        <div className="p-8 text-center bg-white/[0.02] border-b border-white/[0.05] relative">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-slate-950/60 border border-white/10 mb-4 shadow-xl relative group p-3">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-md opacity-50 group-hover:opacity-80 transition-opacity"></div>
            <img src="/favicon.ico" alt="Vanguard Logo" className="w-10 h-10 object-contain relative z-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            VGI Préstamos
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">Ingresa a tu cuenta corporativa para continuar</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5" noValidate>
          
          {/* Mensajes de Alerta/Error */}
          {error && (
            <div className={`border-l-4 p-4 rounded-r-2xl text-sm flex items-start shadow-md animate-in fade-in slide-in-from-top-2 duration-300 ${
              lockoutSeconds > 0 
                ? 'bg-amber-500/10 border-amber-500 text-amber-200' 
                : 'bg-rose-500/10 border-rose-500 text-rose-200'
            }`}>
              {lockoutSeconds > 0 ? (
                <Clock className="w-5 h-5 mr-3 flex-shrink-0 text-amber-400 mt-0.5 animate-spin duration-3000" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 text-rose-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-bold text-white mb-0.5">
                  {lockoutSeconds > 0 ? 'Acceso Suspendido' : 'Error de Acceso'}
                </p>
                <p className="opacity-90 leading-relaxed">
                  {lockoutSeconds > 0 
                    ? `Tu cuenta se ha bloqueado temporalmente por seguridad. Inténtalo de nuevo en: ${formatLockoutTime(lockoutSeconds)}.`
                    : error
                  }
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Campo Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Nombre de Usuario
              </label>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <ShieldCheck size={18} />
                </div>
                
                <input 
                  type="text" 
                  disabled={loading || lockoutSeconds > 0}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej. jperez"
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl border bg-slate-950/60 text-white outline-none transition-all login-input ${
                    error && !username.trim() 
                      ? 'border-rose-500/50 focus:ring-2 focus:ring-rose-500 focus:border-transparent' 
                      : 'border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                />
              </div>

            </div>

            {/* Campo Contraseña */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Contraseña
              </label>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  disabled={loading || lockoutSeconds > 0}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-11 py-3.5 rounded-xl border bg-slate-950/60 text-white outline-none transition-all login-input ${
                    error && !password.trim() && username.trim()
                      ? 'border-rose-500/50 focus:ring-2 focus:ring-rose-500 focus:border-transparent' 
                      : 'border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                />

                {/* Botón de Ojo para ver Contraseña */}
                {password.length > 0 && lockoutSeconds === 0 && (
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Fila Opciones Extras (Recordarme) */}
          {lockoutSeconds === 0 && (
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group text-slate-300 hover:text-white transition-colors">
                <input 
                  type="checkbox" 
                  disabled={loading}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/[0.03] text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span className="text-sm font-medium select-none">Recordarme</span>
              </label>
              
              <Link 
                href="/recuperar" 
                className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          )}

          {/* Botón Enviar */}
          <button 
            type="submit" 
            disabled={loading || lockoutSeconds > 0}
            className={`w-full font-semibold py-3.5 rounded-xl transition-all duration-200 relative overflow-hidden shadow-lg border active:scale-[0.98] ${
              lockoutSeconds > 0 
                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-white/10 text-white shadow-blue-500/10 hover:shadow-blue-500/20'
            } disabled:opacity-75`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                <span>Validando credenciales...</span>
              </span>
            ) : lockoutSeconds > 0 ? (
              <span className="flex items-center justify-center gap-2 text-amber-400">
                <Clock size={16} />
                <span>Bloqueado por Seguridad</span>
              </span>
            ) : (
              <span>Ingresar al Sistema</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
