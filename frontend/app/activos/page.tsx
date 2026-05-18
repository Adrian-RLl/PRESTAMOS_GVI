"use client";

import { useEffect, useState, useRef } from 'react';
import { PlusCircle, Edit, Trash2, FileSpreadsheet, X, Save } from 'lucide-react';
import { api, Activo } from '@/lib/api';
import * as XLSX from 'xlsx';
import Link from 'next/link';

export default function ActivosPage() {
  const [activos, setActivos] = useState<Activo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos');
  const [filterTipo, setFilterTipo] = useState('Todos');
  const [filterOrden, setFilterOrden] = useState('');
  const [isOrdenDropdownOpen, setIsOrdenDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOrdenDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo: '',
    marca: '',
    modelo: '',
    serie: '',
    estado: 'Disponible',
    ubicacion: '',
    observaciones: ''
  });
  const [saving, setSaving] = useState(false);

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/activos', formData);
      setIsModalOpen(false);
      setFormData({
        tipo: '',
        marca: '',
        modelo: '',
        serie: '',
        estado: 'Disponible',
        ubicacion: '',
        observaciones: ''
      });
      fetchActivos();
    } catch (error) {
      console.error("Error saving activo", error);
      alert("Error al guardar el activo. Verifique que el código patrimonial no esté duplicado.");
    } finally {
      setSaving(false);
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
          tipo: row.tipo?.toString() || row.Tipo?.toString() || 'Otro',
          marca: row.marca?.toString() || row.Marca?.toString() || 'Genérica',
          modelo: row.modelo?.toString() || row.Modelo?.toString() || 'S/M',
          serie: row.serie?.toString() || row.Serie?.toString() || 'S/N',
          estado: row.estado?.toString() || row.Estado?.toString() || 'Disponible',
          ubicacion: row.ubicacion?.toString() || row.Ubicacion?.toString() || 'Principal',
          observaciones: row.observaciones?.toString() || row.Observaciones?.toString() || ''
        }));

        await api.post('/activos/lote', batch);
        alert(`Se importaron los activos correctamente.`);
        fetchActivos();
      } catch (error) {
        console.error("Error importing excel", error);
        alert("Hubo un error al procesar el archivo Excel. Asegúrate de que las columnas tengan los nombres correctos.");
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const tiposUnicos = Array.from(new Set(activos.map(a => a.tipo))).filter(Boolean);
  const ordenesUnicas = Array.from(new Set(activos.map(a => a.orden_compra))).filter(Boolean);

  const filteredActivos = activos.filter((activo) => {
    // Filtro por Estado
    const matchEstado = filterEstado === 'Todos' || activo.estado === filterEstado;
    
    // Filtro por Tipo
    const matchTipo = filterTipo === 'Todos' || activo.tipo === filterTipo;

    // Filtro por Orden de Compra
    const matchOrden = filterOrden === '' || (activo.orden_compra || '').toLowerCase().includes(filterOrden.toLowerCase());

    // Buscador general
    const prestamoActivo = activo.prestamos?.find(p => p.estado === 'Activo');
    const nombreUsuario = prestamoActivo?.usuario?.nombre || '';
    
    const term = searchTerm.toLowerCase();
    const matchSearch = term === '' || 
      (activo.serie || '').toLowerCase().includes(term) ||
      (activo.tipo || '').toLowerCase().includes(term) ||
      (activo.marca || '').toLowerCase().includes(term) ||
      (activo.modelo || '').toLowerCase().includes(term) ||
      (activo.ubicacion || '').toLowerCase().includes(term) ||
      (activo.orden_compra || '').toLowerCase().includes(term) ||
      nombreUsuario.toLowerCase().includes(term);

    return matchEstado && matchTipo && matchOrden && matchSearch;
  });

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Activos</h1>
          <p className="text-slate-500 mt-1">Gestiona el inventario de la empresa</p>
        </div>
        <div className="flex gap-3">
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-70"
          >
            {importing ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <FileSpreadsheet size={20} />}
            {importing ? 'Importando...' : 'Importar Excel'}
          </button>
          <Link 
            href="/activos/nuevo"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
          >
            <PlusCircle size={20} />
            Nuevo Activo
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Buscador General</label>
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            
            <div className="w-full md:w-48 flex-shrink-0">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Filtrar Estado</label>
              <select 
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Disponible">Disponible</option>
                <option value="Asignado">Asignado</option>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Baja">De Baja</option>
              </select>
            </div>

            <div className="w-full md:w-48 flex-shrink-0">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Filtrar Tipo</label>
              <select 
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Todos">Todos los tipos</option>
                {tiposUnicos.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-48 flex-shrink-0 relative" ref={dropdownRef}>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Filtrar Orden de Compra</label>
              <input 
                type="text"
                value={filterOrden}
                onChange={(e) => {
                  setFilterOrden(e.target.value);
                  setIsOrdenDropdownOpen(true);
                }}
                onFocus={() => setIsOrdenDropdownOpen(true)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {isOrdenDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-xl max-h-60 overflow-y-auto z-50 overflow-hidden">
                  <div 
                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-slate-500 text-sm border-b border-slate-100 italic"
                    onClick={() => { setFilterOrden(''); setIsOrdenDropdownOpen(false); }}
                  >
                    Borrar selección
                  </div>
                  {ordenesUnicas
                    .filter(o => o.toLowerCase().includes(filterOrden.toLowerCase()))
                    .map(orden => (
                    <div 
                      key={orden} 
                      className="px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700 cursor-pointer text-slate-700 font-medium transition-colors"
                      onClick={() => { setFilterOrden(orden); setIsOrdenDropdownOpen(false); }}
                    >
                      {orden}
                    </div>
                  ))}
                  {ordenesUnicas.filter(o => o.toLowerCase().includes(filterOrden.toLowerCase())).length === 0 && (
                    <div className="px-4 py-3 text-slate-400 text-sm text-center">
                      No hay coincidencias
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">N° Serie</th>
                <th className="p-4 font-semibold">Tipo / Marca</th>
                <th className="p-4 font-semibold">Modelo</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold">Ubicación</th>
                <th className="p-4 font-semibold">Orden de Compra</th>
                <th className="p-4 font-semibold">Asignado A</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No se encontraron activos.
                  </td>
                </tr>
              ) : (
                filteredActivos.map((activo) => (
                  <tr key={activo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-700">{activo.serie}</td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{activo.tipo}</div>
                      <div className="text-sm text-slate-500">{activo.marca}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800">{activo.modelo}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        activo.estado === 'Disponible' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {activo.estado}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{activo.ubicacion}</td>
                    <td className="p-4 text-slate-600">
                      {activo.orden_compra ? <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono border border-slate-200">{activo.orden_compra}</span> : '-'}
                    </td>
                    <td className="p-4 text-slate-600 font-medium text-sm">
                      {activo.prestamos?.find(p => p.estado === 'Activo')?.usuario?.nombre || <span className="text-slate-400 italic font-normal">No asignado</span>}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/activos/editar/${activo.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block">
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
        </>
      )}
    </div>
  );
}
