"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Eye, Search, AlertCircle } from 'lucide-react';
import { api, Prestamo } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function DevolucionesPage() {
  const { user } = useAuth();
  const canModify = user && user.rol_id !== 3;

  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
      alert("No se pudo descargar el acta de devolución.");
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchPrestamos();
    });
  }, []);

  const devoluciones = prestamos.filter(p => p.estado === 'Devuelto');

  const filteredDevoluciones = devoluciones.filter(d => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    
    return (
      (d.activo?.tipo || '').toLowerCase().includes(term) ||
      (d.activo?.marca || '').toLowerCase().includes(term) ||
      (d.activo?.modelo || '').toLowerCase().includes(term) ||
      (d.activo?.serie || '').toLowerCase().includes(term) ||
      (d.usuario?.nombre || '').toLowerCase().includes(term) ||
      (d.usuario?.dni || '').includes(term)
    );
  });

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
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
          placeholder="Buscar por DNI, nombre, tipo de activo, marca o serie..."
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
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Activo</th>
                <th className="p-4 font-semibold">Usuario</th>
                <th className="p-4 font-semibold">Fechas</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold text-right">Constancia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDevoluciones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No hay devoluciones registradas.
                  </td>
                </tr>
              ) : (
                filteredDevoluciones.map((prestamo) => (
                  <tr key={prestamo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{prestamo.activo?.tipo} - {prestamo.activo?.marca}</div>
                      <div className="text-sm text-slate-500">Serie: {prestamo.activo?.serie}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">{prestamo.usuario?.nombre}</div>
                      <div className="text-xs text-slate-500">DNI: {prestamo.usuario?.dni || 'No registrado'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 text-sm">Entrega: {new Date(prestamo.fecha_prestamo).toLocaleDateString()}</div>
                      <div className="text-emerald-600 text-sm font-medium">Devuelto: {new Date(prestamo.fecha_devolucion).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        {prestamo.estado}
                      </span>
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

