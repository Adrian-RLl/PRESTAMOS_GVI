"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { api, Activo } from '@/lib/api';

export default function ActivosPage() {
  const [activos, setActivos] = useState<Activo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivos();
  }, []);

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

  const deleteActivo = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este activo?")) {
      try {
        await api.delete(`/activos/${id}`);
        fetchActivos();
      } catch (error) {
        console.error("Error deleting activo", error);
        alert("No se pudo eliminar el activo.");
      }
    }
  };

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Activos</h1>
          <p className="text-slate-500 mt-1">Gestiona el inventario de la empresa</p>
        </div>
        <Link 
          href="/activos/nuevo" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          <PlusCircle size={20} />
          Nuevo Activo
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Código</th>
                <th className="p-4 font-semibold">Tipo / Marca</th>
                <th className="p-4 font-semibold">Modelo / Serie</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold">Ubicación</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No hay activos registrados.
                  </td>
                </tr>
              ) : (
                activos.map((activo) => (
                  <tr key={activo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-700">{activo.codigo_patrimonial}</td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{activo.tipo}</div>
                      <div className="text-sm text-slate-500">{activo.marca}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800">{activo.modelo}</div>
                      <div className="text-sm text-slate-500">{activo.serie}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        activo.estado === 'Stock' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {activo.estado}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{activo.ubicacion}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/activos/${activo.id}/editar`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit size={18} />
                        </Link>
                        <button onClick={() => deleteActivo(activo.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
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
