"use client";

import { toast } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, RotateCcw, ArrowUpDown, Search } from 'lucide-react';
import { api, Prestamo } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function PrestamosPage() {
  const { user } = useAuth();
  const canModify = user && user.rol_id !== 3;

  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');

  // Column Filters
  const [filters, setFilters] = useState({
    activo: '',
    usuario: '',
    gestor: '',
    fechas: '',
    estado: 'Todos'
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

  const handleDownloadPdf = async (prestamoId: number, type: 'entrega' | 'devolucion') => {
    try {
      const url = type === 'entrega' ? `/prestamos/${prestamoId}/pdf` : `/prestamos/${prestamoId}/pdf-devolucion`;
      const res = await api.get(url, { responseType: 'blob' });
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      console.error("Error al descargar PDF", err);
      toast.error("No se pudo descargar el acta.");
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

  const filteredPrestamos = prestamos.filter(p => {
    // General Search
    let searchMatch = true;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchText = [
        p.usuario?.nombre,
        p.usuario?.dni,
        p.activo?.serie,
        p.activo?.marca,
        p.activo?.tipo,
        (p as any).usuario_emisor?.nombre
      ].join(' ').toLowerCase();
      searchMatch = matchText.includes(term);
    }

    if (!searchMatch) return false;

    // Column Filters
    if (filters.estado !== 'Todos' && p.estado !== filters.estado) return false;
    
    const activoText = [p.activo?.tipo, p.activo?.marca, p.activo?.serie].join(' ').toLowerCase();
    if (filters.activo && !activoText.includes(filters.activo.toLowerCase())) return false;

    const usuarioText = [p.usuario?.nombre, (p.usuario as any)?.area?.nombre, (p.usuario as any)?.sede?.nombre].join(' ').toLowerCase();
    if (filters.usuario && !usuarioText.includes(filters.usuario.toLowerCase())) return false;

    const gestorText = ((p as any).usuario_emisor?.nombre || '').toLowerCase();
    if (filters.gestor && !gestorText.includes(filters.gestor.toLowerCase())) return false;

    if (filters.fechas) {
      const pDate1 = new Date(p.fecha_prestamo).toLocaleDateString('es-PE', { timeZone: 'UTC' });
      const pDate2 = p.fecha_devolucion ? new Date(p.fecha_devolucion).toLocaleDateString('es-PE', { timeZone: 'UTC' }) : '';
      const datesText = `${pDate1} ${pDate2}`;
      if (!datesText.includes(filters.fechas)) return false;
    }

    return true;
  });

  const sortedPrestamos = [...filteredPrestamos].sort((a, b) => {
    if (!sortConfig) return 0;
    
    let aValue: any = '';
    let bValue: any = '';

    if (sortConfig.key === 'activo') {
      aValue = `${a.activo?.tipo} ${a.activo?.marca} ${a.activo?.serie}`;
      bValue = `${b.activo?.tipo} ${b.activo?.marca} ${b.activo?.serie}`;
    } else if (sortConfig.key === 'usuario') {
      aValue = `${a.usuario?.nombre} ${(a.usuario as any)?.area?.nombre}`;
      bValue = `${b.usuario?.nombre} ${(b.usuario as any)?.area?.nombre}`;
    } else if (sortConfig.key === 'gestor') {
      aValue = (a as any).usuario_emisor?.nombre || '';
      bValue = (b as any).usuario_emisor?.nombre || '';
    } else if (sortConfig.key === 'fechas') {
      aValue = new Date(a.fecha_prestamo).getTime();
      bValue = new Date(b.fecha_prestamo).getTime();
    } else if (sortConfig.key === 'estado') {
      aValue = a.estado;
      bValue = b.estado;
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Historial de Entregas</h1>
          <p className="text-slate-500 mt-1">Gestión y búsqueda de activos entregados</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {canModify && (
            <Link 
              href="/prestamos/nuevo" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors w-full sm:w-auto shadow-sm"
            >
              <PlusCircle size={20} />
              Nueva Entrega
            </Link>
          )}
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Búsqueda general..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
                <th className="p-3 font-semibold cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('gestor')}>
                  <div className="flex items-center gap-1">Gestor/Analista <ArrowUpDown size={14} className="text-slate-400" /></div>
                </th>
                <th className="p-3 font-semibold cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('fechas')}>
                  <div className="flex items-center gap-1">Fechas <ArrowUpDown size={14} className="text-slate-400" /></div>
                </th>
                <th className="p-3 font-semibold cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('estado')}>
                  <div className="flex items-center gap-1">Estado <ArrowUpDown size={14} className="text-slate-400" /></div>
                </th>
                <th className="p-3 font-semibold text-right">Acciones</th>
              </tr>
              {/* Filtros Row */}
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-2">
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-2.5 text-slate-400" />
                    <input type="text" placeholder="Filtrar activo..." value={filters.activo} onChange={(e) => handleFilterChange('activo', e.target.value)} className="w-full text-xs py-1.5 pl-6 pr-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal shadow-inner" />
                  </div>
                </th>
                <th className="p-2">
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-2.5 text-slate-400" />
                    <input type="text" placeholder="Filtrar usuario..." value={filters.usuario} onChange={(e) => handleFilterChange('usuario', e.target.value)} className="w-full text-xs py-1.5 pl-6 pr-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal shadow-inner" />
                  </div>
                </th>
                <th className="p-2">
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-2.5 text-slate-400" />
                    <input type="text" placeholder="Filtrar gestor..." value={filters.gestor} onChange={(e) => handleFilterChange('gestor', e.target.value)} className="w-full text-xs py-1.5 pl-6 pr-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal shadow-inner" />
                  </div>
                </th>
                <th className="p-2">
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-2.5 text-slate-400" />
                    <input type="text" placeholder="Filtrar fecha..." value={filters.fechas} onChange={(e) => handleFilterChange('fechas', e.target.value)} className="w-full text-xs py-1.5 pl-6 pr-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal shadow-inner" />
                  </div>
                </th>
                <th className="p-2">
                  <select value={filters.estado} onChange={(e) => handleFilterChange('estado', e.target.value)} className="w-full text-xs py-1.5 px-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal bg-white shadow-inner">
                    <option value="Todos">Todos</option>
                    <option value="Activo">Activos</option>
                    <option value="Devuelto">Devueltos</option>
                  </select>
                </th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedPrestamos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <Search size={32} className="mx-auto text-slate-300 mb-3" />
                    No hay entregas registradas con los filtros actuales.
                  </td>
                </tr>
              ) : (
                sortedPrestamos.map((prestamo) => (
                  <tr key={prestamo.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{prestamo.activo?.tipo} - {prestamo.activo?.marca}</div>
                      <div className="text-sm text-slate-500 font-medium">Serie: {prestamo.activo?.serie}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">{prestamo.usuario?.nombre || `ID: ${prestamo.usuario_id}`}</div>
                      <div className="text-xs text-slate-500">{(prestamo.usuario as any)?.area?.nombre} | {(prestamo.usuario as any)?.sede?.nombre}</div>
                    </td>
                    <td className="p-4 text-slate-600 text-sm font-medium">
                      {(prestamo as any).usuario_emisor?.nombre || '-'}
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 text-sm">Entregado: {new Date(prestamo.fecha_prestamo).toLocaleDateString('es-PE', { timeZone: 'UTC' })}</div>
                      <div className="text-slate-500 text-sm">Devolución: {prestamo.fecha_devolucion ? new Date(prestamo.fecha_devolucion).toLocaleDateString('es-PE', { timeZone: 'UTC' }) : 'Permanente'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        prestamo.estado === 'Activo' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        {prestamo.estado}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          onClick={() => handleDownloadPdf(prestamo.id, 'entrega')}
                          className="px-3 py-2 text-sm bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors inline-flex items-center gap-1 font-medium border border-slate-200"
                        >
                          Ver Acta
                        </button>
                        {canModify && prestamo.estado === 'Activo' && (
                          <Link 
                            href={`/prestamos/${prestamo.id}/devolver`}
                            className="px-3 py-2 text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors inline-flex items-center gap-1 font-medium"
                          >
                            <RotateCcw size={16} />
                            Devolver
                          </Link>
                        )}
                      </div>
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
