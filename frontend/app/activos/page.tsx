"use client";

import { toast } from 'react-hot-toast';
import { useEffect, useState, Fragment } from 'react';
import { PlusCircle, Edit, Trash2, Download, ArrowUpDown, Search, X, Clock, User, Calendar } from 'lucide-react';
import { api, Activo } from '@/lib/api';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function ActivosPage() {
  const { user } = useAuth();
  const canEdit = user && (user.rol_id === 1 || user.rol_id === 2);
  const canDelete = user && user.rol_id === 1;

  const [activos, setActivos] = useState<Activo[]>([]);
  const [loading, setLoading] = useState(true);

  // History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // General Search
  const [searchTerm, setSearchTerm] = useState('');

  // Column Filters
  const [filters, setFilters] = useState({
    serie: '',
    tipo: '',
    marca: '',
    modelo: '',
    estado: 'Todos',
    ubicacion: '',
    orden: '',
    asignado: '',
  });

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  const fetchActivos = async () => {
    try {
      const response = await api.get('/activos');
      setActivos(response.data);
    } catch (error) {
      console.error("Error fetching activos", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivos();
  }, []);

  const deleteActivo = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este activo?")) {
      try {
        await api.delete(`/activos/${id}`);
        fetchActivos();
      } catch (error) {
        console.error("Error deleting activo", error);
        toast.error("No se pudo eliminar el activo.");
      }
    }
  };

  const openHistory = async (id: number) => {
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const response = await api.get(`/activos/${id}/historial`);
      setHistoryData(response.data);
    } catch (error) {
      console.error("Error fetching history", error);
      toast.error("No se pudo cargar el historial.");
      setHistoryModalOpen(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleExportExcel = () => {
    const data = sortedActivos.map(activo => ({
      'N° Serie': activo.serie,
      'Tipo': activo.tipo,
      'Marca': activo.marca,
      'Modelo': activo.modelo,
      'Estado': activo.estado,
      'Ubicación': activo.ubicacion,
      'Orden de Compra': activo.orden_compra || '-',
      'Asignado A': activo.prestamos?.find(p => p.estado === 'Activo')?.usuario?.nombre || 'No asignado',
      'Fecha Creación': activo.fecha_creacion ? new Date(activo.fecha_creacion).toLocaleDateString('es-PE', { timeZone: 'UTC' }) : '-',
      'Fecha Asignación': activo.estado === 'Asignado' && activo.prestamos?.find(p => p.estado === 'Activo')?.fecha_prestamo 
          ? new Date(activo.prestamos.find(p => p.estado === 'Activo')!.fecha_prestamo).toLocaleDateString('es-PE', { timeZone: 'UTC' }) 
          : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Activos");
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Activos_Exportados_${dateStr}.xlsx`);
    toast.success("Datos exportados a Excel correctamente.");
  };

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

  const filteredActivos = activos.filter((activo) => {
    const pActivo = activo.prestamos?.find(p => p.estado === 'Activo');
    const assignedName = pActivo?.usuario?.nombre || 'No asignado';
    
    // General Search Match
    let searchMatch = true;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchText = [
        activo.serie,
        activo.tipo,
        activo.marca,
        activo.modelo,
        activo.ubicacion,
        activo.orden_compra,
        assignedName
      ].join(' ').toLowerCase();
      searchMatch = matchText.includes(term);
    }

    return searchMatch && (
      (filters.serie === '' || (activo.serie || '').toLowerCase().includes(filters.serie.toLowerCase())) &&
      (filters.tipo === '' || (activo.tipo || '').toLowerCase().includes(filters.tipo.toLowerCase())) &&
      (filters.marca === '' || (activo.marca || '').toLowerCase().includes(filters.marca.toLowerCase())) &&
      (filters.modelo === '' || (activo.modelo || '').toLowerCase().includes(filters.modelo.toLowerCase())) &&
      (filters.estado === 'Todos' || activo.estado === filters.estado) &&
      (filters.ubicacion === '' || (activo.ubicacion || '').toLowerCase().includes(filters.ubicacion.toLowerCase())) &&
      (filters.orden === '' || (activo.orden_compra || '').toLowerCase().includes(filters.orden.toLowerCase())) &&
      (filters.asignado === '' || assignedName.toLowerCase().includes(filters.asignado.toLowerCase()))
    );
  });

  const sortedActivos = [...filteredActivos].sort((a, b) => {
    if (!sortConfig) return 0;
    
    let aValue: any = a[sortConfig.key as keyof Activo] || '';
    let bValue: any = b[sortConfig.key as keyof Activo] || '';

    if (sortConfig.key === 'asignado') {
      aValue = a.prestamos?.find(p => p.estado === 'Activo')?.usuario?.nombre || 'No asignado';
      bValue = b.prestamos?.find(p => p.estado === 'Activo')?.usuario?.nombre || 'No asignado';
    } else if (sortConfig.key === 'fecha_creacion') {
      aValue = new Date(a.fecha_creacion || 0).getTime();
      bValue = new Date(b.fecha_creacion || 0).getTime();
    } else if (sortConfig.key === 'fecha_asignacion') {
      aValue = a.estado === 'Asignado' && a.prestamos?.find(p => p.estado === 'Activo')?.fecha_prestamo ? new Date(a.prestamos.find(p => p.estado === 'Activo')!.fecha_prestamo).getTime() : 0;
      bValue = b.estado === 'Asignado' && b.prestamos?.find(p => p.estado === 'Activo')?.fecha_prestamo ? new Date(b.prestamos.find(p => p.estado === 'Activo')!.fecha_prestamo).getTime() : 0;
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculations
  const totalItems = sortedActivos.length;
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex = itemsPerPage === -1 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === -1 ? totalItems : Math.min(startIndex + itemsPerPage, totalItems);

  const paginatedActivos = itemsPerPage === -1
    ? sortedActivos
    : sortedActivos.slice(startIndex, endIndex);

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Activos</h1>
          <p className="text-slate-500 mt-1">Gestiona el inventario de la empresa</p>
        </div>
        <div className="flex flex-wrap gap-2.5 sm:gap-3">
          <button 
            onClick={handleExportExcel} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
          >
            <Download size={20} />
            Exportar Data
          </button>
          {canEdit && (
            <Link 
              href="/activos/nuevo"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
            >
              <PlusCircle size={20} />
              Nuevo Activo
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
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 text-sm">
                  <th className="p-3 font-semibold cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('serie')}>
                    <div className="flex items-center gap-1">N° Serie <ArrowUpDown size={14} className="text-slate-400" /></div>
                  </th>
                  <th className="p-3 font-semibold cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('tipo')}>
                    <div className="flex items-center gap-1">Tipo <ArrowUpDown size={14} className="text-slate-400" /></div>
                  </th>
                  <th className="p-3 font-semibold cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('marca')}>
                    <div className="flex items-center gap-1">Marca <ArrowUpDown size={14} className="text-slate-400" /></div>
                  </th>
                  <th className="p-3 font-semibold cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('modelo')}>
                    <div className="flex items-center gap-1">Modelo <ArrowUpDown size={14} className="text-slate-400" /></div>
                  </th>
                  <th className="p-3 font-semibold cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('estado')}>
                    <div className="flex items-center gap-1">Estado <ArrowUpDown size={14} className="text-slate-400" /></div>
                  </th>
                  <th className="p-3 font-semibold cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('ubicacion')}>
                    <div className="flex items-center gap-1">Ubicación <ArrowUpDown size={14} className="text-slate-400" /></div>
                  </th>
                  <th className="p-3 font-semibold cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('orden_compra')}>
                    <div className="flex items-center gap-1">Orden de Compra <ArrowUpDown size={14} className="text-slate-400" /></div>
                  </th>
                  <th className="p-3 font-semibold cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('asignado')}>
                    <div className="flex items-center gap-1">Asignado A <ArrowUpDown size={14} className="text-slate-400" /></div>
                  </th>
                  <th className="p-3 font-semibold cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('fecha_creacion')}>
                    <div className="flex items-center gap-1">F. Creación <ArrowUpDown size={14} className="text-slate-400" /></div>
                  </th>
                  <th className="p-3 font-semibold cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('fecha_asignacion')}>
                    <div className="flex items-center gap-1">F. Asignación <ArrowUpDown size={14} className="text-slate-400" /></div>
                  </th>
                  {canEdit && <th className="p-3 font-semibold text-right">Acciones</th>}
                </tr>
                {/* Filtros Row */}
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-2">
                    <div className="relative">
                      <Search size={12} className="absolute left-2 top-2.5 text-slate-400" />
                      <input type="text" placeholder="Filtrar..." value={filters.serie} onChange={(e) => handleFilterChange('serie', e.target.value)} className="w-full text-xs py-1.5 pl-6 pr-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal shadow-inner" />
                    </div>
                  </th>
                  <th className="p-2">
                    <div className="relative">
                      <Search size={12} className="absolute left-2 top-2.5 text-slate-400" />
                      <input type="text" placeholder="Filtrar..." value={filters.tipo} onChange={(e) => handleFilterChange('tipo', e.target.value)} className="w-full text-xs py-1.5 pl-6 pr-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal shadow-inner" />
                    </div>
                  </th>
                  <th className="p-2">
                    <div className="relative">
                      <Search size={12} className="absolute left-2 top-2.5 text-slate-400" />
                      <input type="text" placeholder="Filtrar..." value={filters.marca} onChange={(e) => handleFilterChange('marca', e.target.value)} className="w-full text-xs py-1.5 pl-6 pr-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal shadow-inner" />
                    </div>
                  </th>
                  <th className="p-2">
                    <div className="relative">
                      <Search size={12} className="absolute left-2 top-2.5 text-slate-400" />
                      <input type="text" placeholder="Filtrar..." value={filters.modelo} onChange={(e) => handleFilterChange('modelo', e.target.value)} className="w-full text-xs py-1.5 pl-6 pr-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal shadow-inner" />
                    </div>
                  </th>
                  <th className="p-2">
                    <select value={filters.estado} onChange={(e) => handleFilterChange('estado', e.target.value)} className="w-full text-xs py-1.5 px-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal bg-white shadow-inner">
                      <option value="Todos">Todos</option>
                      <option value="Disponible">Disponible</option>
                      <option value="Asignado">Asignado</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Baja">De Baja</option>
                    </select>
                  </th>
                  <th className="p-2">
                    <div className="relative">
                      <Search size={12} className="absolute left-2 top-2.5 text-slate-400" />
                      <input type="text" placeholder="Filtrar..." value={filters.ubicacion} onChange={(e) => handleFilterChange('ubicacion', e.target.value)} className="w-full text-xs py-1.5 pl-6 pr-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal shadow-inner" />
                    </div>
                  </th>
                  <th className="p-2">
                    <div className="relative">
                      <Search size={12} className="absolute left-2 top-2.5 text-slate-400" />
                      <input type="text" placeholder="Filtrar..." value={filters.orden} onChange={(e) => handleFilterChange('orden', e.target.value)} className="w-full text-xs py-1.5 pl-6 pr-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal shadow-inner" />
                    </div>
                  </th>
                  <th className="p-2">
                    <div className="relative">
                      <Search size={12} className="absolute left-2 top-2.5 text-slate-400" />
                      <input type="text" placeholder="Filtrar..." value={filters.asignado} onChange={(e) => handleFilterChange('asignado', e.target.value)} className="w-full text-xs py-1.5 pl-6 pr-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal shadow-inner" />
                    </div>
                  </th>
                  <th className="p-2"></th>
                  <th className="p-2"></th>
                  {canEdit && <th className="p-2"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedActivos.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 11 : 10} className="p-12 text-center text-slate-500">
                      <Search size={32} className="mx-auto text-slate-300 mb-3" />
                      No se encontraron activos con estos filtros.
                    </td>
                  </tr>
                ) : (
                  paginatedActivos.map((activo) => {
                    const pActivo = activo.prestamos?.find(p => p.estado === 'Activo');
                    
                    return (
                    <tr key={activo.id} onClick={() => openHistory(activo.id)} className="cursor-pointer hover:bg-slate-50 transition-colors group">
                      <td className="p-4 font-medium text-slate-700">{activo.serie}</td>
                      <td className="p-4 font-bold text-slate-800">{activo.tipo}</td>
                      <td className="p-4 text-slate-600">{activo.marca}</td>
                      <td className="p-4">
                        <div className="text-slate-800">{activo.modelo}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          activo.estado === 'Disponible' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                          activo.estado === 'Baja' ? 'bg-red-100 text-red-700 border border-red-200' :
                          activo.estado === 'Mantenimiento' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                          'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                          {activo.estado}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{activo.ubicacion}</td>
                      <td className="p-4 text-slate-600">
                        {activo.orden_compra ? <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono border border-slate-200 text-slate-600">{activo.orden_compra}</span> : '-'}
                      </td>
                      <td className="p-4 text-slate-600 font-medium text-sm">
                        {pActivo?.usuario?.nombre || <span className="text-slate-400 italic font-normal">No asignado</span>}
                      </td>
                      <td className="p-4 text-slate-500 text-sm">
                        {activo.fecha_creacion ? new Date(activo.fecha_creacion).toLocaleDateString('es-PE', { timeZone: 'UTC' }) : '-'}
                      </td>
                      <td className="p-4 text-slate-500 text-sm">
                        {activo.estado === 'Asignado' && pActivo?.fecha_prestamo ? new Date(pActivo.fecha_prestamo).toLocaleDateString('es-PE', { timeZone: 'UTC' }) : <span className="text-slate-300">-</span>}
                      </td>
                      {canEdit && (
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <Link href={`/activos/editar/${activo.id}`} onClick={(e) => e.stopPropagation()} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block" title="Editar">
                              <Edit size={18} />
                            </Link>
                            {canDelete && (
                              <button onClick={(e) => { e.stopPropagation(); deleteActivo(activo.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>

          {sortedActivos.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-slate-200">
              <div className="text-sm text-slate-500 font-medium">
                Mostrando <span className="text-slate-800">{totalItems === 0 ? 0 : startIndex + 1}</span> a <span className="text-slate-800">{endIndex}</span> de <span className="text-slate-800">{totalItems}</span> registros
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 font-medium">Por página:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer font-medium"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={-1}>Todos</option>
                  </select>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                      })
                      .map((page, index, array) => {
                        const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                        return (
                          <Fragment key={page}>
                            {showEllipsisBefore && <span className="px-2 text-slate-400 font-medium">...</span>}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`px-3.5 py-1.5 rounded-xl text-sm font-bold transition-all ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {page}
                            </button>
                          </Fragment>
                        );
                      })}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <Clock size={20} className="text-blue-500" />
                  Historial del Activo
                </h3>
                {!historyLoading && historyData && (
                  <p className="text-sm text-slate-500 mt-1">
                    {historyData.tipo} {historyData.marca} {historyData.modelo} (SN: {historyData.serie})
                  </p>
                )}
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
              {historyLoading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
              ) : historyData?.prestamos?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
                  <Clock size={40} className="text-slate-300" />
                  <p>Este activo no tiene historial de préstamos.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-blue-100 ml-4 space-y-8 pb-4">
                  {historyData?.prestamos?.map((prestamo: any, index: number) => (
                    <div key={prestamo.id} className="relative pl-6">
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                        prestamo.estado === 'Activo' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`} />
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                              prestamo.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {prestamo.estado}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">ID: #{prestamo.id}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                            <Calendar size={14} />
                            {new Date(prestamo.fecha_prestamo).toLocaleDateString('es-PE', { timeZone: 'UTC' })}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">Asignado a</div>
                            <div className="flex items-start gap-2">
                              <User size={16} className="text-slate-400 mt-0.5" />
                              <div>
                                <div className="font-bold text-slate-700">{prestamo.usuario?.nombre}</div>
                                <div className="text-xs text-slate-500">
                                  {prestamo.usuario?.cargo?.nombre} • {prestamo.usuario?.area?.nombre}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">Detalles de Entrega</div>
                            <div className="text-sm text-slate-600">
                              <span className="font-medium">Emisor:</span> {prestamo.usuario_emisor?.nombre || '-'}
                            </div>
                            {prestamo.fecha_devolucion && (
                              <>
                                <div className="text-xs text-slate-400 font-medium mb-1 mt-2 uppercase tracking-wider">Detalles de Devolución</div>
                                <div className="text-sm text-slate-600">
                                  <span className="font-medium">Fecha:</span> {new Date(prestamo.fecha_devolucion).toLocaleDateString('es-PE', { timeZone: 'UTC' })}
                                </div>
                                <div className="text-sm text-slate-600">
                                  <span className="font-medium">Receptor:</span> {prestamo.usuario_receptor?.nombre || '-'}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
              <button 
                onClick={() => setHistoryModalOpen(false)}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
