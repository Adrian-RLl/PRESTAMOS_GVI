"use client";

import { toast } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Eye, Search, AlertCircle, ArrowUpDown } from 'lucide-react';
import { api, Prestamo } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function DevolucionesPage() {
  const { user } = useAuth();
  const canModify = user && user.rol_id !== 3;

  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');

  // Column Filters
  const [filters, setFilters] = useState({
    activo: '',
    usuario: '',
    fechas: '',
    estado: 'Todos',
    analista: ''
  });

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const fetchPrestamos = async () => {
    try {
      const response = await api.get('/prestamos');
      setPrestamos(response.data);
    } catch (error) {
      console.error("Error fetching prestamos", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (prestamoId: number) => {
    try {
      const res = await api.get(`/prestamos/${prestamoId}/pdf-devolucion`, { responseType: 'blob' });
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      console.error("Error al descargar PDF de devolución", err);
      toast.error("No se pudo descargar el acta de devolución.");
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchPrestamos();
    });
  }, []);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const devoluciones = prestamos.filter(p => p.estado === 'Devuelto');

  const filteredDevoluciones = devoluciones.filter(d => {
    // General Search
    let searchMatch = true;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchText = [
        d.usuario?.nombre,
        d.usuario?.dni,
        d.activo?.serie,
        d.activo?.marca,
        d.activo?.tipo,
        d.usuario_receptor?.nombre
      ].join(' ').toLowerCase();
      searchMatch = matchText.includes(term);
    }

    if (!searchMatch) return false;

    // Column Filters
    if (filters.estado !== 'Todos' && d.estado !== filters.estado) return false;
    
    const activoText = [d.activo?.tipo, d.activo?.marca, d.activo?.serie].join(' ').toLowerCase();
    if (filters.activo && !activoText.includes(filters.activo.toLowerCase())) return false;

    const usuarioText = [d.usuario?.nombre, (d.usuario as any)?.area?.nombre, (d.usuario as any)?.sede?.nombre].join(' ').toLowerCase();
    if (filters.usuario && !usuarioText.includes(filters.usuario.toLowerCase())) return false;

    const analistaText = (d.usuario_receptor?.nombre || '').toLowerCase();
    if (filters.analista && !analistaText.includes(filters.analista.toLowerCase())) return false;

    if (filters.fechas) {
      const pDate1 = new Date(d.fecha_prestamo).toLocaleDateString('es-PE', { timeZone: 'UTC' });
      const pDate2 = d.fecha_devolucion ? new Date(d.fecha_devolucion).toLocaleDateString('es-PE', { timeZone: 'UTC' }) : '';
      const datesText = `${pDate1} ${pDate2}`;
      if (!datesText.includes(filters.fechas)) return false;
    }

    return true;
  });

  const sortedDevoluciones = [...filteredDevoluciones].sort((a, b) => {
    if (!sortConfig) return 0;
    
    let aValue: any = '';
    let bValue: any = '';

    if (sortConfig.key === 'activo') {
      aValue = `${a.activo?.tipo} ${a.activo?.marca} ${a.activo?.serie}`;
      bValue = `${b.activo?.tipo} ${b.activo?.marca} ${b.activo?.serie}`;
    } else if (sortConfig.key === 'usuario') {
      aValue = `${a.usuario?.nombre} ${(a.usuario as any)?.area?.nombre}`;
      bValue = `${b.usuario?.nombre} ${(b.usuario as any)?.area?.nombre}`;
    } else if (sortConfig.key === 'fechas') {
      aValue = new Date(a.fecha_devolucion || 0).getTime();
      bValue = new Date(b.fecha_devolucion || 0).getTime();
    } else if (sortConfig.key === 'estado') {
      aValue = a.estado;
      bValue = b.estado;
    } else if (sortConfig.key === 'analista') {
      aValue = a.usuario_receptor?.nombre || '';
      bValue = b.usuario_receptor?.nombre || '';
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Historial de Devoluciones</h1>
          <p className="text-slate-500 mt-1">Registro y constancias de devolución de activos</p>
        </div>
        {canModify && (
          <Link 
            href="/devoluciones/nuevo" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors w-full sm:w-auto shadow-sm"
          >
            <PlusCircle size={20} />
            Nueva Devolución
          </Link>
        )}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Búsqueda general..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 text-sm">
                <th className="p-3 font-semibold cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('activo')}>
                  <div className="flex items-center gap-1">Activo <ArrowUpDown size={14} className="text-slate-400" /></div>
                </th>
                <th className="p-3 font-semibold cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('usuario')}>
                  <div className="flex items-center gap-1">Usuario y Área <ArrowUpDown size={14} className="text-slate-400" /></div>
                </th>
                <th className="p-3 font-semibold cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('fechas')}>
                  <div className="flex items-center gap-1">Fechas <ArrowUpDown size={14} className="text-slate-400" /></div>
                </th>
                <th className="p-3 font-semibold cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('estado')}>
                  <div className="flex items-center gap-1">Estado <ArrowUpDown size={14} className="text-slate-400" /></div>
                </th>
                <th className="p-3 font-semibold cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('analista')}>
                  <div className="flex items-center gap-1">Analista (Receptor) <ArrowUpDown size={14} className="text-slate-400" /></div>
                </th>
                <th className="p-3 font-semibold text-right">Constancia</th>
              </tr>
              {/* Filtros Row */}
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-2">
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-2.5 text-slate-400" />
                    <input type="text" placeholder="Filtrar activo..." value={filters.activo} onChange={(e) => handleFilterChange('activo', e.target.value)} className="w-full text-xs py-1.5 pl-6 pr-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-normal shadow-inner" />
                  </div>
                </th>
                <th className="p-2">
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-2.5 text-slate-400" />
                    <input type="text" placeholder="Filtrar usuario..." value={filters.usuario} onChange={(e) => handleFilterChange('usuario', e.target.value)} className="w-full text-xs py-1.5 pl-6 pr-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-normal shadow-inner" />
                  </div>
                </th>
                <th className="p-2">
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-2.5 text-slate-400" />
                    <input type="text" placeholder="Filtrar fecha..." value={filters.fechas} onChange={(e) => handleFilterChange('fechas', e.target.value)} className="w-full text-xs py-1.5 pl-6 pr-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-normal shadow-inner" />
                  </div>
                </th>
                <th className="p-2">
                  <select value={filters.estado} onChange={(e) => handleFilterChange('estado', e.target.value)} className="w-full text-xs py-1.5 px-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-normal bg-white shadow-inner">
                    <option value="Todos">Todos</option>
                    <option value="Devuelto">Devueltos</option>
                  </select>
                </th>
                <th className="p-2">
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-2.5 text-slate-400" />
                    <input type="text" placeholder="Filtrar analista..." value={filters.analista} onChange={(e) => handleFilterChange('analista', e.target.value)} className="w-full text-xs py-1.5 pl-6 pr-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-normal shadow-inner" />
                  </div>
                </th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedDevoluciones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <Search size={32} className="mx-auto text-slate-300 mb-3" />
                    No hay devoluciones registradas con los filtros actuales.
                  </td>
                </tr>
              ) : (
                sortedDevoluciones.map((prestamo) => (
                  <tr key={prestamo.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{prestamo.activo?.tipo} - {prestamo.activo?.marca}</div>
                      <div className="text-sm text-slate-500 font-medium">Serie: {prestamo.activo?.serie}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">{prestamo.usuario?.nombre}</div>
                      <div className="text-xs text-slate-500">{(prestamo.usuario as any)?.area?.nombre} | {(prestamo.usuario as any)?.sede?.nombre}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 text-sm">Entregado: {new Date(prestamo.fecha_prestamo).toLocaleDateString('es-PE', { timeZone: 'UTC' })}</div>
                      <div className="text-emerald-600 text-sm font-medium">Devuelto: {new Date(prestamo.fecha_devolucion!).toLocaleDateString('es-PE', { timeZone: 'UTC' })}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                        {prestamo.estado}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-700 font-medium text-sm">
                        {prestamo.usuario_receptor?.nombre || <span className="text-slate-400 italic font-normal">S/R</span>}
                      </div>
                    </td>
                    <td className="p-4 text-right font-medium">
                      <button 
                        onClick={() => handleDownloadPdf(prestamo.id)}
                        className="px-3 py-2 text-sm bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors inline-flex items-center gap-1 font-medium border border-slate-200"
                      >
                        Ver Acta
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
