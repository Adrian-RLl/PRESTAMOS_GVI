"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Redirección Automática en Éxito
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      router.push('/login');
    }
  }, [success, countdown, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('El enlace de recuperación es inválido o no contiene un token válido.');
      return;
    }

    if (!password.trim()) {
      setError('La nueva contraseña es obligatoria.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres por seguridad.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor, verifícalas.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        contrasena: password,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña. Es posible que el token haya expirado o ya se haya usado.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="p-8 text-center space-y-6">
        <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 shadow-xl shadow-rose-500/5">
          <AlertCircle size={32} className="text-rose-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Enlace Inválido</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
            Este enlace de recuperación no es válido. Asegúrate de haber copiado la dirección URL completa del correo electrónico.
          </p>
        </div>
        <div className="pt-2">
          <Link 
            href="/recuperar"
            className="w-full font-semibold py-3.5 rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-lg border active:scale-[0.98] bg-slate-800 border-white/10 hover:bg-slate-700 text-white"
          >
            <span>Solicitar nuevo enlace</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {!success ? (
        <>
          {/* Encabezado */}
          <div className="p-8 text-center bg-white/[0.02] border-b border-white/[0.05]">
            <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-slate-950/60 border border-white/10 mb-4 shadow-xl relative group p-3">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-md opacity-50 group-hover:opacity-80 transition-opacity"></div>
              <img src="/favicon.ico" alt="Vanguard Logo" className="w-10 h-10 object-contain relative z-10" />
            </div>
            
            <h1 className="text-2xl font-bold tracking-tight text-white bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Nueva Contraseña
            </h1>
            <p className="text-slate-400 text-sm mt-1.5 font-medium">Define tu nueva contraseña de acceso corporativo</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5" noValidate>
            
            {/* Mensajes de Alerta/Error */}
            {error && (
              <div className="border-l-4 p-4 rounded-r-2xl text-sm flex items-start shadow-md animate-in fade-in slide-in-from-top-2 duration-300 bg-rose-500/10 border-rose-500 text-rose-200">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-white mb-0.5">Error al Restablecer</p>
                  <p className="opacity-90 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Campo Contraseña Nueva */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Nueva Contraseña
                </label>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-11 pr-11 py-3.5 rounded-xl border border-white/10 bg-slate-950/60 text-white outline-none transition-all login-input focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />

                  {/* Toggle ver contraseña */}
                  {password.length > 0 && (
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

              {/* Campo Confirmar Contraseña */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Confirmar Contraseña
                </label>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    disabled={loading}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
                    className="w-full pl-11 pr-11 py-3.5 rounded-xl border border-white/10 bg-slate-950/60 text-white outline-none transition-all login-input focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />

                  {/* Toggle ver contraseña */}
                  {confirmPassword.length > 0 && (
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )}
                </div>

                {/* Validar coincidencia en vivo */}
                {password && confirmPassword && (
                  <div className="flex justify-end pt-1 animate-in fade-in duration-200">
                    {password === confirmPassword ? (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                        Las contraseñas coinciden
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20">
                        Las contraseñas no coinciden
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Botón Enviar */}
            <button 
              type="submit" 
              disabled={loading || !password.trim() || password !== confirmPassword}
              className="w-full font-semibold py-3.5 rounded-xl transition-all duration-200 relative overflow-hidden shadow-lg border active:scale-[0.98] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-white/10 text-white shadow-blue-500/10 hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Actualizando contraseña...</span>
                </span>
              ) : (
                <span>Restablecer Contraseña</span>
              )}
            </button>
          </form>
        </>
      ) : (
        /* Pantalla de Éxito */
        <div className="p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-400">
          <div className="inline-flex justify-center items-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-xl shadow-emerald-500/5 relative">
            <div className="absolute inset-0 rounded-full bg-emerald-400 blur-md opacity-10"></div>
            <CheckCircle2 size={40} className="text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">¡Contraseña Actualizada!</h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm mx-auto">
              Tu contraseña ha sido restablecida con éxito. Ahora puedes iniciar sesión con tus nuevas credenciales corporativas.
            </p>
            <p className="text-slate-500 text-xs mt-2 animate-pulse">
              Redirigiendo al inicio de sesión en {countdown} segundos...
            </p>
          </div>

          <div className="pt-2">
            <Link 
              href="/login" 
              className="w-full font-semibold py-3.5 rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-lg border active:scale-[0.98] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-white/10 text-white shadow-blue-500/10 hover:shadow-blue-500/20"
            >
              <span>Ir al Login Ahora</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

export default function RestablecerContrasenaPage() {
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
        <Suspense fallback={
          <div className="p-12 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 text-sm font-medium">Cargando verificación de seguridad...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
