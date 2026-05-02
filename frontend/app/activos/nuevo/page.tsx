"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function NuevoActivo() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    codigo_patrimonial: '',
    tipo: '',
    marca: '',
    modelo: '',
    serie: '',
    estado: 'Stock',
    ubicacion: '',
    observaciones: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/activos', formData);
      router.push('/activos');
    } catch (error) {
      console.error(error);
      alert('Error al crear el activo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      <Link href="/activos" className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors">
        <ArrowLeft size={20} className="mr-2" />
        Volver a la lista
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-slate-800">Registrar Nuevo Activo</h1>
          <p className="text-slate-500 mt-1">Ingresa los detalles del activo para añadirlo al inventario</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Código Patrimonial</label>
              <input required type="text" name="codigo_patrimonial" value={formData.codigo_patrimonial} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Ej. ACT-001" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tipo de Activo</label>
              <input required type="text" name="tipo" value={formData.tipo} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Ej. Laptop" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Marca</label>
              <input required type="text" name="marca" value={formData.marca} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Ej. Dell" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Modelo</label>
              <input required type="text" name="modelo" value={formData.modelo} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Ej. XPS 15" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Número de Serie</label>
              <input required type="text" name="serie" value={formData.serie} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="SN..." />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Estado Inicial</label>
              <select name="estado" value={formData.estado} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white">
                <option value="Stock">Stock (Disponible)</option>
                <option value="Asignado" disabled>Asignado (No disponible)</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Ubicación</label>
              <input required type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Ej. Oficina Principal" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Observaciones (Opcional)</label>
              <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none" placeholder="Detalles adicionales..." />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button disabled={loading} type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-70">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Save size={20} />
              )}
              {loading ? 'Guardando...' : 'Guardar Activo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
