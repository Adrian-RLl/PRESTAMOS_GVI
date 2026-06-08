'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Save, X, PackagePlus, UploadCloud, Download } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

import * as XLSX from 'xlsx';

export default function NuevoActivo() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!user || user.rol_id === 3)) {
      router.replace('/activos');
    }
  }, [user, isLoading, router]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [formData, setFormData] = useState({
    tipo: '',
    marca: '',
    modelo: '',
    serie: '',
    condicion: 'Nuevo',
    estado: 'Disponible',
    vigencia: '',
    empresa_id: '',
    ubicacion: 'Almacén Principal',
    observaciones: '',
    orden_compra: '',
  });

  useEffect(() => {
    // Cargar empresas
    const fetchEmpresas = async () => {
      try {
        const res = await api.get('/empresas');
        setEmpresas(res.data);
      } catch (err) {
        console.error('Error cargando empresas:', err);
      }
    };
    fetchEmpresas();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Asegurar tipos y enviar
      const payload = { ...formData, empresa_id: formData.empresa_id ? parseInt(formData.empresa_id) : null };
      
      await api.post('/activos', payload);
      router.push('/activos');
    } catch (error) {
      console.error('Error al crear activo:', error);
      alert('Hubo un error al crear el activo. Verifica tus permisos y los datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const batch = data.map((row: any) => ({
          tipo: row.tipo?.toString() || row.Tipo?.toString() || row["Tipo de Activo"]?.toString() || row["Tipo de Activo (Ej. Laptop, Celular)"]?.toString() || 'Otro',
          marca: row.marca?.toString() || row.Marca?.toString() || 'Genérica',
          modelo: row.modelo?.toString() || row.Modelo?.toString() || 'S/M',
          serie: row.serie?.toString() || row.Serie?.toString() || row["Número de Serie"]?.toString() || row["Número de Serie (Debe ser único)"]?.toString() || 'S/N',
          condicion: row.condicion?.toString() || row.Condición?.toString() || row["Condición"]?.toString() || row["Condición (Nuevo, Usado, Malogrado)"]?.toString() || 'Nuevo',
          estado: row.estado?.toString() || row.Estado?.toString() || row["Estado"]?.toString() || row["Estado (Disponible, Asignado)"]?.toString() || 'Disponible',
          vigencia: row.vigencia?.toString() || row.Vigencia?.toString() || row["Vigencia"]?.toString() || row["Vigencia (Ej. 1 año)"]?.toString() || '',
          ubicacion: row.ubicacion?.toString() || row.Ubicacion?.toString() || row["Ubicación"]?.toString() || 'Principal',
          orden_compra: row.orden_compra?.toString() || row.orden?.toString() || row["Orden de Compra"]?.toString() || '',
          observaciones: row.observaciones?.toString() || row.Observaciones?.toString() || '',
          empresa: row.empresa?.toString() || row.Empresa?.toString() || row["Empresa"]?.toString() || row["ID de Empresa"]?.toString() || ''
        }));

        await api.post('/activos/lote', batch);
        alert(`Se importaron los activos correctamente.`);
        router.push('/activos');
      } catch (error: any) {
        console.error("Error importing excel", error);
        alert(error.response?.data?.message || "Hubo un error al procesar el archivo Excel. Asegúrate de que las columnas tengan los nombres correctos.");
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const ws_data = [
      ["Tipo de Activo (Ej. Laptop, Celular)", "Marca", "Modelo", "Número de Serie (Debe ser único)", "Condición (Nuevo, Usado, Malogrado)", "Estado (Disponible, Asignado)", "Vigencia (Ej. 1 año)", "Empresa", "Ubicación", "Orden de Compra", "Observaciones"],
      ["Laptop", "Lenovo", "ThinkPad T14", "PF3B1XYZ", "Nuevo", "Disponible", "3 años", "PROSEMBRA", "Almacén Principal", "123456", "Ninguna"]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // Ajustar anchos de columnas para que se vea bien
    const wscols = [
      {wch: 30}, // Tipo
      {wch: 15}, // Marca
      {wch: 20}, // Modelo
      {wch: 35}, // Serie
      {wch: 30}, // Condición
      {wch: 25}, // Estado
      {wch: 20}, // Vigencia
      {wch: 20}, // Empresa
      {wch: 25}, // Ubicación
      {wch: 20}, // Orden de Compra
      {wch: 30}  // Observaciones
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Activos");
    
    XLSX.writeFile(wb, "Plantilla_Carga_Masiva_Activos.xlsx");
  };

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full pt-4 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 flex items-center gap-3">
            <PackagePlus className="text-blue-600" size={32} />
            Nuevo Activo
          </h1>
          <p className="text-slate-500 mt-1">Registra un nuevo activo en el inventario o realiza una carga masiva.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button onClick={downloadTemplate} type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors">
            <Download size={18} /> Descargar Plantilla
          </button>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            ref={fileInputRef} 
            onChange={handleImportExcel} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={importing}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors cursor-pointer disabled:opacity-75"
          >
            {importing ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <UploadCloud size={18} />}
            {importing ? 'Cargando...' : 'Cargar Excel'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Detalles del Equipo</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Tipo de Activo *</label>
            <select name="tipo" required value={formData.tipo} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
              <option value="">- Seleccione -</option>
              <option value="Laptop">Laptop</option>
              <option value="Monitor">Monitor</option>
              <option value="Celular">Celular</option>
              <option value="Tablet">Tablet</option>
              <option value="Periferico">Periférico</option>
              <option value="Vehículo">Vehículo</option>
              <option value="Mobiliario">Mobiliario</option>
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
            {loading ? 'Guardando...' : 'Guardar Activo'}
          </button>
        </div>
      </form>
    </div>
  );
}
