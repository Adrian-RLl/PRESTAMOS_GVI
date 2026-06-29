'use client';

import { toast } from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Save, X, Edit } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function EditarActivo() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!user || user.rol_id === 3)) {
      router.replace('/activos');
    }
  }, [user, isLoading, router]);
  const id = params?.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [empresas, setEmpresas] = useState([]);
  const [tiposActivos, setTiposActivos] = useState([]);
  const [formData, setFormData] = useState({
    tipo: '',
    marca: '',
    modelo: '',
    serie: '',
    condicion: 'Nuevo',
    estado: 'Disponible',
    vigencia: '',
    empresa_id: '',
    ubicacion: '',
    observaciones: '',
    orden_compra: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [empresasRes, activoRes, tiposRes] = await Promise.all([
          api.get('/empresas'),
          api.get(`/activos/${id}`),
          api.get('/tipos-activos')
        ]);
        
        setEmpresas(empresasRes.data.filter((e: any) => e.estado));
        setTiposActivos(tiposRes.data.filter((t: any) => t.estado));
        
        const activo = activoRes.data;
        setFormData({
          tipo: activo.tipo || '',
          marca: activo.marca || '',
          modelo: activo.modelo || '',
          serie: activo.serie || '',
          condicion: activo.condicion || 'Nuevo',
          estado: activo.estado || 'Disponible',
          vigencia: activo.vigencia || '',
          empresa_id: activo.empresa_id ? activo.empresa_id.toString() : '',
          ubicacion: activo.ubicacion || '',
          observaciones: activo.observaciones || '',
          orden_compra: activo.orden_compra || '',
        });
      } catch (err) {
        console.error('Error cargando datos:', err);
        toast.error('Hubo un error al cargar el activo.');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, empresa_id: formData.empresa_id ? parseInt(formData.empresa_id) : null };
      await api.patch(`/activos/${id}`, payload);
      router.push('/activos');
    } catch (error) {
      console.error('Error al actualizar activo:', error);
      toast.error('Hubo un error al actualizar el activo. Verifica tus permisos y los datos.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex-1 flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full pt-4 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 flex items-center gap-3">
            <Edit className="text-blue-600" size={32} />
            Editar Activo
          </h1>
          <p className="text-slate-500 mt-1">Modifica los detalles del activo seleccionado.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Detalles del Equipo</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Tipo de Activo *</label>
            <select name="tipo" required value={formData.tipo} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
              <option value="">- Seleccione -</option>
              {tiposActivos.map((tipo: any) => (
                <option key={tipo.id} value={tipo.nombre}>{tipo.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Empresa</label>
            <select name="empresa_id" value={formData.empresa_id} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
              <option value="">- Seleccione -</option>
              {empresas.map((emp: any) => (
                <option key={emp.id} value={emp.id}>{emp.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Marca *</label>
            <input type="text" name="marca" required value={formData.marca} onChange={handleChange} placeholder="Ej. Dell, Lenovo" className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Modelo</label>
            <input type="text" name="modelo" value={formData.modelo} onChange={handleChange} placeholder="Ej. Latitude 5420" className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Número de Serie *</label>
            <input type="text" name="serie" required value={formData.serie} onChange={handleChange} placeholder="S/N del equipo" className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Condición *</label>
            <select name="condicion" required value={formData.condicion} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
              <option value="Nuevo">Nuevo</option>
              <option value="Usado">Usado (Operativo)</option>
              <option value="Malogrado">Malogrado</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Estado de Activo *</label>
            <select name="estado" required value={formData.estado} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
              <option value="Disponible">Disponible</option>
              <option value="Asignado">Asignado</option>
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Baja">De Baja</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Vigencia</label>
            <select name="vigencia" value={formData.vigencia} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
              <option value="">- Seleccione -</option>
              <option value="1 año">1 año</option>
              <option value="2 años">2 años</option>
              <option value="3 años">3 años</option>
              <option value="4 años">4 años</option>
              <option value="5 años">5 años</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Ubicación *</label>
            <input type="text" name="ubicacion" required value={formData.ubicacion} onChange={handleChange} placeholder="Ej. Almacén Principal" className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Orden de Compra</label>
            <input type="text" name="orden_compra" value={formData.orden_compra} onChange={handleChange} placeholder="Ej. 123456" className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Observaciones</label>
          <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} placeholder="Detalles adicionales..." rows={3} className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"></textarea>
        </div>

        <div className="mt-10 flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
          <Link href="/activos" className="px-6 py-2.5 text-slate-600 hover:text-slate-900 font-medium transition-colors flex items-center gap-2">
            <X size={18} /> Cancelar
          </Link>
          <button type="submit" disabled={loading} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20">
            {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save size={18} />}
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
