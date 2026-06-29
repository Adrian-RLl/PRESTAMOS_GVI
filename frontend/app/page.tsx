'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ClipboardList, Users, CheckCircle, ShieldCheck, Plus } from 'lucide-react';
import { KpiCard } from './components/Dashboard/KpiCard';
import { AssetStatusChart } from './components/Dashboard/AssetStatusChart';
import { RecentActivityTable } from './components/Dashboard/RecentActivityTable';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace('/login');
      return;
    }

    if (!isLoading && token) {
      const fetchStats = async () => {
        try {
          const response = await api.get('/dashboard/stats');
          setStats(response.data);
        } catch (error) {
          console.error('Error fetching dashboard stats:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    }
  }, [isLoading, token, router]);

  if (isLoading || !token) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full pt-4 pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
            Panel de Control <ShieldCheck className="text-emerald-500" size={28} />
          </h1>
          <p className="text-slate-500 mt-1">Resumen general del sistema de activos VGI</p>
        </div>
        
        {user && user.rol_id !== 3 && (
          <div className="flex gap-3">
            <Link href="/activos/nuevo" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
              <Plus size={18} /> Nuevo Activo
            </Link>
            <Link href="/prestamos/nuevo" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">
              <ClipboardList size={18} /> Nueva Entrega
            </Link>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* KPIs Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KpiCard 
              title="Total Activos" 
              value={stats.kpis.totalActivos} 
              icon={Package} 
              colorClass="border-blue-200 bg-blue-50/50"
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
            />
            <KpiCard 
              title="Activos Asignados" 
              value={stats.kpis.activosPrestados} 
              icon={ClipboardList} 
              colorClass="border-indigo-200 bg-indigo-50/50"
              iconColor="text-indigo-600"
              iconBg="bg-indigo-100"
            />
            <KpiCard 
              title="Activos Disponibles" 
              value={stats.kpis.activosDisponibles} 
              icon={CheckCircle} 
              colorClass="border-emerald-200 bg-emerald-50/50"
              iconColor="text-emerald-600"
              iconBg="bg-emerald-100"
            />
          </div>

          {/* Charts and Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 h-full">
              <AssetStatusChart data={stats.distribucionActivos} />
            </div>
            <div className="lg:col-span-2 h-full">
              <RecentActivityTable activities={stats.actividadReciente} />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
          <ShieldCheck size={48} className="mx-auto text-slate-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Inicia sesión para ver tus estadísticas</h2>
          <p className="text-slate-500">Debes estar autenticado para acceder al panel de control.</p>
        </div>
      )}
    </div>
  );
}
