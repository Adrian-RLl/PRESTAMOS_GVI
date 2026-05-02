"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, RotateCcw } from 'lucide-react';
import { api, Prestamo } from '@/lib/api';

export default function PrestamosPage() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrestamos();
  }, []);

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

  const devolverActivo = async (id: number) => {
    if (confirm("¿Confirmas la devolución de este activo?")) {
      try {
        await api.post(`/prestamos/${id}/devolver`);
        fetchPrestamos(); // Refrescar lista
      } catch (error) {
        console.error("Error devolviendo activo", error);
        alert("No se pudo procesar la devolución.");
      }
    }
  };

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Préstamos</h1>
          <p className="text-slate-500 mt-1">Historial y gestión de asignación de activos</p>
        </div>
        <Link 
          href="/prestamos/nuevo" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          <PlusCircle size={20} />
          Nuevo Préstamo
        </Link>
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
              {prestamos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No hay préstamos registrados.
                  </td>
                </tr>
              ) : (
                prestamos.map((prestamo) => (
                  <tr key={prestamo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{prestamo.activo?.tipo} - {prestamo.activo?.marca}</div>
                      <div className="text-sm text-slate-500">Cod: {prestamo.activo?.codigo_patrimonial}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-700">
                      {prestamo.usuario?.nombre || `Usuario ID: ${prestamo.usuario_id}`}
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 text-sm">Préstamo: {new Date(prestamo.fecha_prestamo).toLocaleDateString()}</div>
                      <div className="text-slate-500 text-sm">Devolución: {new Date(prestamo.fecha_devolucion).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        prestamo.estado === 'Activo' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {prestamo.estado}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {prestamo.estado === 'Activo' && (
                        <Link 
                          href={`/prestamos/${prestamo.id}/devolver`}
                          className="px-3 py-2 text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors inline-flex items-center gap-1 font-medium"
                        >
                          <RotateCcw size={16} />
                          Devolver
                        </Link>
                      )}
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
