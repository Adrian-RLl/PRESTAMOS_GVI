import Link from 'next/link';
import { Package, ClipboardList, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 max-w-5xl mx-auto w-full pt-8">
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 rounded-3xl p-10 md:p-16 text-white shadow-2xl relative overflow-hidden">
        {/* Decoraciones de fondo */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500 opacity-20 blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Sistema Seguro de VGI</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Gestión de Préstamos y <br className="hidden md:block"/> Control de Activos
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mb-10 leading-relaxed">
            Bienvenido al sistema unificado para la asignación y rastreo de recursos de la empresa. Control total, historial detallado y firmas digitales integradas.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
            <Link href="/activos" className="group bg-white/10 hover:bg-white/20 border border-white/20 p-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl backdrop-blur-sm">
              <div className="bg-blue-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Package size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Inventario de Activos</h3>
              <p className="text-blue-200 text-sm">Gestiona el stock, añade nuevos equipos y controla su ubicación actual.</p>
            </Link>

            <Link href="/prestamos" className="group bg-white/10 hover:bg-white/20 border border-white/20 p-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl backdrop-blur-sm">
              <div className="bg-indigo-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ClipboardList size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Préstamos</h3>
              <p className="text-indigo-200 text-sm">Asigna activos a los usuarios con firma digital de responsabilidad.</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
