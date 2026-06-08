"use client";

import { useState } from 'react';
import { Mail, ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function RecuperarPage() {
  const [correo, setCorreo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!correo.trim()) {
      setError('El correo electrónico es obligatorio.');
      return;
    }

    const emailRegex = /^[^\s@]+@vanguardfresh\.pe$/i;
    if (!emailRegex.test(correo)) {
      setError('Por favor, ingresa un correo corporativo válido (ej. usuario@vanguardfresh.pe).');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { correo });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Hubo un error al procesar tu solicitud. Inténtalo más tarde.');
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
        
        {!success ? (
          <>
            {/* Encabezado */}
            <div className="p-8 text-center bg-white/[0.02] border-b border-white/[0.05] relative">
              <Link 
                href="/login" 
                className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08]"
              >
                <ArrowLeft size={18} />
              </Link>
              
              <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-slate-950/60 border border-white/10 mb-4 shadow-xl relative group p-3">
                <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-md opacity-50 group-hover:opacity-80 transition-opacity"></div>
                <img src="/favicon.ico" alt="Vanguard Logo" className="w-10 h-10 object-contain relative z-10" />
              </div>
              
              <h1 className="text-2xl font-bold tracking-tight text-white bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Recuperar Contraseña
              </h1>
              <p className="text-slate-400 text-sm mt-1.5 font-medium">Ingresa tu correo para recibir las instrucciones</p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-8 space-y-5" noValidate>
              
              {/* Mensajes de Alerta/Error */}
              {error && (
                <div className="border-l-4 p-4 rounded-r-2xl text-sm flex items-start shadow-md animate-in fade-in slide-in-from-top-2 duration-300 bg-rose-500/10 border-rose-500 text-rose-200">
                  <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 text-rose-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-white mb-0.5">Error de Solicitud</p>
                    <p className="opacity-90 leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Campo Correo Electrónico */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Correo Electrónico Corporativo
                  </label>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    
                    <input 
                      type="email" 
                      disabled={loading}
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      placeholder="usuario@vanguardfresh.pe"
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl border bg-slate-950/60 text-white outline-none transition-all login-input ${
                        error && !correo.trim() 
                          ? 'border-rose-500/50 focus:ring-2 focus:ring-rose-500 focus:border-transparent' 
                          : 'border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    />
                  </div>

                  {/* Sugerencia de Autocompletado */}
                  {!correo.includes('@') && correo.trim().length > 0 && (
                    <div className="flex justify-end animate-in fade-in slide-in-from-top-1 duration-200">
                      <button 
                        type="button" 
                        onClick={() => setCorreo(correo + '@vanguardfresh.pe')}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/25 px-2.5 py-1.5 rounded-lg border border-blue-500/20 active:scale-95 duration-100"
                      >
                        Autocompletar @vanguardfresh.pe
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón Enviar */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full font-semibold py-3.5 rounded-xl transition-all duration-200 relative overflow-hidden shadow-lg border active:scale-[0.98] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-white/10 text-white shadow-blue-500/10 hover:shadow-blue-500/20 disabled:opacity-75"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    <span>Procesando solicitud...</span>
                  </span>
                ) : (
                  <span>Enviar Enlace de Recuperación</span>
                )}
              </button>

              <div className="text-center pt-2">
                <Link 
                  href="/login" 
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
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
              <h2 className="text-2xl font-bold tracking-tight text-white">¡Enlace Enviado!</h2>
              <p className="text-slate-300 text-sm leading-relaxed max-w-sm mx-auto">
                Si la cuenta <strong className="text-blue-400 font-semibold">{correo}</strong> está registrada en nuestro sistema, recibirás un correo electrónico con las instrucciones para restablecer tu contraseña.
              </p>
              <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 mt-4 text-left">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Instrucciones:</h4>
                <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4">
                  <li>Revisa tu correo corporativo (incluyendo spam o no deseados).</li>
                  <li>El enlace de recuperación expira en <span className="text-white font-semibold">30 minutos</span>.</li>
                  <li>Si estás en modo de desarrollo local, el link se ha impreso también en la consola del backend.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2">
              <Link 
                href="/login" 
                className="w-full font-semibold py-3.5 rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-lg border active:scale-[0.98] bg-slate-800 border-white/10 hover:bg-slate-700 text-white"
              >
                <ArrowLeft size={16} />
                <span>Volver al Login</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
