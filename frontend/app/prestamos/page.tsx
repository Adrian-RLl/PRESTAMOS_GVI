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

  const activePrestamos = prestamos.filter(p => p.estado === 'Activo');

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Entregas Activas</h1>
          <p className="text-slate-500 mt-1">Historial y gestión de asignación de activos en uso</p>
        </div>
        {canModify && (
          <Link 
            href="/prestamos/nuevo" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
          >
            <PlusCircle size={20} />
            Nueva Entrega
          </Link>
        )}
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
                <th className="p-4 font-semibold">Usuario</th>
                <th className="p-4 font-semibold">Fechas</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activePrestamos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No hay entregas activas registradas.
                  </td>
                </tr>
              ) : (
                activePrestamos.map((prestamo) => (
                  <tr key={prestamo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{prestamo.activo?.tipo} - {prestamo.activo?.marca}</div>
                      <div className="text-sm text-slate-500">Serie: {prestamo.activo?.serie}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-700">
                      {prestamo.usuario?.nombre || `Usuario ID: ${prestamo.usuario_id}`}
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 text-sm">Entrega: {new Date(prestamo.fecha_prestamo).toLocaleDateString()}</div>
                      <div className="text-slate-500 text-sm">Est. Devolución: {new Date(prestamo.fecha_devolucion).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
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
                        {canModify && (
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
