"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, RotateCcw } from 'lucide-react';
import { api, Prestamo } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function PrestamosPage() {
  const { user } = useAuth();
  const canModify = user && user.rol_id !== 3;

  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('Todas');
  const [filterSede, setFilterSede] = useState('Todas');
  const [filterDate, setFilterDate] = useState('');

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
      alert("No se pudo descargar el acta.");
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchPrestamos();
    });
  }, []);

  const uniqueAreas = Array.from(new Set(prestamos.map(p => (p.usuario as any)?.area?.nombre).filter(Boolean))) as string[];
  const uniqueSedes = Array.from(new Set(prestamos.map(p => (p.usuario as any)?.sede?.nombre).filter(Boolean))) as string[];

  const filteredPrestamos = prestamos.filter(p => {
    // Filtro Estado
    if (filterEstado !== 'Todos' && p.estado !== filterEstado) return false;
    
    // Filtro Área
    const area = (p.usuario as any)?.area?.nombre;
    if (filterArea !== 'Todas' && area !== filterArea) return false;
    
    // Filtro Sede
    const sede = (p.usuario as any)?.sede?.nombre;
    if (filterSede !== 'Todas' && sede !== filterSede) return false;
    
    // Filtro Fecha (Fecha de Entrega)
    if (filterDate) {
      const pDate = new Date(p.fecha_prestamo).toISOString().split('T')[0];
      if (pDate !== filterDate) return false;
    }
    
    // Filtro Búsqueda Texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchText = [
        p.usuario?.nombre,
        p.usuario?.dni,
        p.activo?.serie,
        p.activo?.marca,
        p.activo?.tipo,
        (p as any).usuario_emisor?.nombre // Nombre del analista
      ].join(' ').toLowerCase();
      
      if (!matchText.includes(term)) return false;
    }

    return true;
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

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Buscar</label>
          <input 
            type="text"
            placeholder="Usuario, serie, gestor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Estado</label>
          <select 
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
          >
            <option value="Todos">Todas las Entregas</option>
            <option value="Activo">Solo Activas</option>
            <option value="Devuelto">Devueltas</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Área</label>
          <select 
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
          >
            <option value="Todas">Todas las áreas</option>
            {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Sede</label>
          <select 
            value={filterSede}
            onChange={(e) => setFilterSede(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
          >
            <option value="Todas">Todas las sedes</option>
            {uniqueSedes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha Entrega</label>
          <input 
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Activo</th>
                <th className="p-4 font-semibold">Usuario y Área</th>
                <th className="p-4 font-semibold">Gestor/Analista</th>
                <th className="p-4 font-semibold">Fechas</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPrestamos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No hay entregas registradas con el filtro actual.
                  </td>
                </tr>
              ) : (
                filteredPrestamos.map((prestamo) => (
                  <tr key={prestamo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{prestamo.activo?.tipo} - {prestamo.activo?.marca}</div>
                      <div className="text-sm text-slate-500">Serie: {prestamo.activo?.serie}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">{prestamo.usuario?.nombre || `ID: ${prestamo.usuario_id}`}</div>
                      <div className="text-xs text-slate-500">{(prestamo.usuario as any)?.area?.nombre} | {(prestamo.usuario as any)?.sede?.nombre}</div>
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      {(prestamo as any).usuario_emisor?.nombre || '-'}
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 text-sm">Entregado: {new Date(prestamo.fecha_prestamo).toLocaleDateString()}</div>
                      <div className="text-slate-500 text-sm">Devolución: {prestamo.fecha_devolucion ? new Date(prestamo.fecha_devolucion).toLocaleDateString() : 'Permanente'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        prestamo.estado === 'Activo' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
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
