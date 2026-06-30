'use client';

import { toast } from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Save, X, PackagePlus, UploadCloud, Download, AlertCircle, AlertTriangle, Info } from 'lucide-react';
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
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [tiposActivos, setTiposActivos] = useState<any[]>([]);
  
  // Guardamos las series y su estado actual
  const [existingAssets, setExistingAssets] = useState<Map<string, string>>(new Map());
  
  // Preview State
  const [previewData, setPreviewData] = useState<any[]>([]);

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
    const fetchData = async () => {
      try {
        const [resEmpresas, resTipos, resActivos] = await Promise.all([
          api.get('/empresas'),
          api.get('/tipos-activos'),
          api.get('/activos')
        ]);
        setEmpresas(resEmpresas.data.filter((e: any) => e.estado));
        setTiposActivos(resTipos.data.filter((t: any) => t.estado));
        
        const assetsMap = new Map();
        resActivos.data.forEach((a: any) => {
          assetsMap.set(a.serie.toLowerCase(), a.estado);
        });
        setExistingAssets(assetsMap);
      } catch (err) {
        console.error('Error cargando catálogos:', err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (existingAssets.has(formData.serie.toLowerCase())) {
      toast.error('Este Número de Serie ya se encuentra registrado en el sistema.');
      return;
    }

    setLoading(true);
    try {
      const payload = { ...formData, empresa_id: formData.empresa_id ? parseInt(formData.empresa_id) : null };
      await api.post('/activos', payload);
      toast.success('Activo creado correctamente.');
      router.push('/activos');
    } catch (error) {
      console.error('Error al crear activo:', error);
      toast.error('Hubo un error al crear el activo. Verifica tus permisos y los datos.');
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
        
        const seriesSet = new Set<string>();

        const batch = data.map((row: any) => {
          const rawTipo = row.tipo?.toString() || row.Tipo?.toString() || row["Tipo de Activo"]?.toString() || row["Tipo de Activo (Ej. Laptop, Celular)"]?.toString() || '';
          
          let matchedTipo = rawTipo;
          if (rawTipo) {
            const matchedObj = tiposActivos.find((t: any) => t.nombre.toLowerCase() === rawTipo.toLowerCase().trim());
            if (matchedObj) {
              matchedTipo = matchedObj.nombre;
            }
          }

          const item = {
            tipo: matchedTipo,
            marca: row.marca?.toString() || row.Marca?.toString() || '',
            modelo: row.modelo?.toString() || row.Modelo?.toString() || 'S/M',
            serie: row.serie?.toString() || row.Serie?.toString() || row["Número de Serie"]?.toString() || row["Número de Serie (Debe ser único)"]?.toString() || '',
            condicion: row.condicion?.toString() || row.Condición?.toString() || row["Condición"]?.toString() || row["Condición (Nuevo, Usado, Malogrado)"]?.toString() || 'Nuevo',
            estado: row.estado?.toString() || row.Estado?.toString() || row["Estado"]?.toString() || row["Estado (Disponible, Asignado)"]?.toString() || 'Disponible',
            vigencia: row.vigencia?.toString() || row.Vigencia?.toString() || row["Vigencia"]?.toString() || row["Vigencia (Ej. 1 año)"]?.toString() || '',
            ubicacion: row.ubicacion?.toString() || row.Ubicacion?.toString() || row["Ubicación"]?.toString() || 'Principal',
            orden_compra: row.orden_compra?.toString() || row.orden?.toString() || row["Orden de Compra"]?.toString() || '',
            observaciones: row.observaciones?.toString() || row.Observaciones?.toString() || '',
            empresa: row.empresa?.toString() || row.Empresa?.toString() || row["Empresa"]?.toString() || row["ID de Empresa"]?.toString() || '',
            _errors: [] as string[],
            _warnings: [] as string[]
          };

          // Validaciones estrictas
          if (!item.tipo) {
            item._errors.push('Falta el Tipo de Activo');
          } else if (!tiposActivos.find((t: any) => t.nombre === item.tipo)) {
            item._errors.push(`Tipo '${item.tipo}' no está registrado en el catálogo`);
          }

          if (!item.marca) item._errors.push('Falta la Marca');
          if (!item.serie) item._errors.push('Falta el Número de Serie');
          
          if (item.serie) {
            const lowSerie = item.serie.toLowerCase();
            
            // Duplicado dentro del mismo excel
            if (seriesSet.has(lowSerie)) {
              item._errors.push('Número de Serie duplicado en este archivo');
            } 
            // Ya existe en BD
            else if (existingAssets.has(lowSerie)) {
              const currentStatus = existingAssets.get(lowSerie);
              if (currentStatus === 'Asignado') {
                 item._errors.push('El equipo existe y está ASIGNADO. No se puede sobrescribir.');
              } else {
                 item._warnings.push('El equipo existe y sus datos serán actualizados.');
              }
            }
            seriesSet.add(lowSerie);
          }

          if (!['Nuevo', 'Usado', 'Malogrado'].includes(item.condicion)) {
             item._errors.push('Condición inválida');
          }

          if (!['Disponible', 'Asignado', 'Mantenimiento', 'Baja'].includes(item.estado)) {
             item._errors.push('Estado inválido');
          }

          return item;
        });

        setPreviewData(batch);
      } catch (error: any) {
        console.error("Error al procesar excel", error);
        toast.error("Hubo un error al leer el archivo Excel. Revisa el formato.");
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const hasErrors = previewData.some(row => row._errors.length > 0);
  const hasWarnings = previewData.some(row => row._warnings.length > 0);

  const handleConfirmImport = async () => {
    if (hasErrors) return;

    setImporting(true);
    try {
      // Remover _errors y _warnings antes de enviar
      const payload = previewData.map(({ _errors, _warnings, ...rest }) => rest);
      const res = await api.post('/activos/lote', payload);
      
      const created = res.data?.created || 0;
      const updated = res.data?.updated || 0;
      
      if (updated > 0) {
         toast.success(`Se importaron ${created} nuevos y se actualizaron ${updated} activos.`);
      } else {
         toast.success(`Se importaron ${created} activos correctamente.`);
      }
      
      router.push('/activos');
    } catch (error: any) {
      console.error("Error al guardar importación", error);
      toast.error(error.response?.data?.message || "Hubo un error al guardar los activos. Verifica que los números de serie no estén duplicados en el sistema.");
    } finally {
      setImporting(false);
      setPreviewData([]);
    }
  };

  const downloadTemplate = () => {
    const ws_data = [
      ["Tipo de Activo (Ej. Laptop, Celular)", "Marca", "Modelo", "Número de Serie (Debe ser único)", "Condición (Nuevo, Usado, Malogrado)", "Estado (Disponible, Asignado)", "Vigencia (Ej. 1 año)", "Empresa", "Ubicación", "Orden de Compra", "Observaciones"],
      ["Laptop", "Lenovo", "ThinkPad T14", "PF3B1XYZ", "Nuevo", "Disponible", "3 años", "PROSEMBRA", "Almacén Principal", "123456", "Ninguna"]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wscols = [
      {wch: 30}, {wch: 15}, {wch: 20}, {wch: 35}, {wch: 30}, {wch: 25}, {wch: 20}, {wch: 20}, {wch: 25}, {wch: 20}, {wch: 30}
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
            {importing ? 'Leyendo...' : 'Cargar Excel'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Detalles del Equipo</h2>
        
        {/* Form fields exist below... */}
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
            {loading ? 'Guardando...' : 'Guardar Activo'}
          </button>
        </div>
      </form>

      {/* Modal de Previsualización y Validación */}
      {previewData.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
              <h3 className="font-bold text-xl text-slate-800">Previsualización y Validación</h3>
              <button onClick={() => setPreviewData([])} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-auto flex-1 bg-slate-50/50">
              {hasErrors ? (
                <div className="flex items-start gap-3 text-red-800 bg-red-50 p-4 rounded-xl border border-red-200 mb-6 shadow-sm">
                  <AlertTriangle size={24} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold">Se encontraron errores en el archivo</h4>
                    <p className="text-sm mt-1">Corrige las filas con errores resaltadas en rojo y vuelve a cargar el archivo.</p>
                  </div>
                </div>
              ) : hasWarnings ? (
                <div className="flex items-start gap-3 text-yellow-800 bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-6 shadow-sm">
                  <Info size={24} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold">Hay activos que se van a sobrescribir</h4>
                    <p className="text-sm mt-1">Hemos detectado series existentes. Al confirmar, los datos de los activos se actualizarán con la información del Excel.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 p-4 rounded-xl border border-emerald-200 mb-6 shadow-sm">
                  <AlertCircle size={20} className="flex-shrink-0" />
                  <p>Todos los <strong>{previewData.length}</strong> activos son nuevos y tienen un formato válido.</p>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-sm">
                      <th className="p-4 font-semibold">N°</th>
                      <th className="p-4 font-semibold">Tipo</th>
                      <th className="p-4 font-semibold">Marca</th>
                      <th className="p-4 font-semibold">Modelo</th>
                      <th className="p-4 font-semibold">N° Serie</th>
                      <th className="p-4 font-semibold">Condición</th>
                      <th className="p-4 font-semibold">Estado</th>
                      <th className="p-4 font-semibold">Vigencia</th>
                      <th className="p-4 font-semibold">Empresa</th>
                      <th className="p-4 font-semibold">Ubicación</th>
                      <th className="p-4 font-semibold">Orden de Compra</th>
                      <th className="p-4 font-semibold">Observaciones</th>
                      <th className="p-4 font-semibold sticky right-0 bg-slate-100 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">Validación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {previewData.map((row, idx) => {
                      const hasErr = row._errors.length > 0;
                      const hasWarn = row._warnings.length > 0;
                      let bgClass = 'hover:bg-slate-50';
                      if (hasErr) bgClass = 'bg-red-50/50 hover:bg-red-50';
                      else if (hasWarn) bgClass = 'bg-yellow-50/30 hover:bg-yellow-50/50';

                      return (
                        <tr key={idx} className={`${bgClass} text-slate-700 transition-colors`}>
                          <td className="p-4 text-slate-400 font-medium">{idx + 1}</td>
                          <td className={`p-4 font-medium ${!row.tipo && 'text-red-500 italic'}`}>{row.tipo || 'Falta'}</td>
                          <td className={`p-4 ${!row.marca && 'text-red-500 italic'}`}>{row.marca || 'Falta'}</td>
                          <td className="p-4">{row.modelo}</td>
                          <td className={`p-4 font-mono font-medium ${!row.serie ? 'text-red-500 italic' : 'text-slate-900'}`}>{row.serie || 'Falta'}</td>
                          <td className="p-4">{row.condicion}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                              row.estado === 'Disponible' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {row.estado}
                            </span>
                          </td>
                          <td className="p-4">{row.vigencia}</td>
                          <td className="p-4">{row.empresa}</td>
                          <td className="p-4">{row.ubicacion}</td>
                          <td className="p-4">{row.orden_compra}</td>
                          <td className="p-4 truncate max-w-xs">{row.observaciones}</td>
                          <td className={`p-4 sticky right-0 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] ${hasErr ? 'bg-red-50' : hasWarn ? 'bg-yellow-50' : 'bg-white'}`}>
                            {hasErr ? (
                              <div className="flex flex-col gap-1">
                                {row._errors.map((err: string, i: number) => (
                                  <span key={i} className="text-red-600 text-xs font-medium bg-red-100 px-2 py-0.5 rounded flex items-center gap-1 w-max">
                                    <AlertTriangle size={10} /> {err}
                                  </span>
                                ))}
                              </div>
                            ) : hasWarn ? (
                              <div className="flex flex-col gap-1">
                                {row._warnings.map((wrn: string, i: number) => (
                                  <span key={i} className="text-yellow-700 text-xs font-medium bg-yellow-100 border border-yellow-200 px-2 py-0.5 rounded flex items-center gap-1 w-max">
                                    <Info size={10} /> {wrn}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-emerald-600 text-xs font-bold uppercase flex items-center gap-1">
                                Nuevo
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Removed truncation block */}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white rounded-b-3xl">
              <button 
                onClick={() => setPreviewData([])} 
                className="px-6 py-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 font-medium rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmImport} 
                disabled={importing || hasErrors} 
                className={`px-8 py-2.5 font-bold rounded-xl transition-colors flex items-center gap-2 shadow-md ${
                  hasErrors 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                    : hasWarnings
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-yellow-500/20'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                }`}
              >
                {importing ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Save size={18} />}
                {importing ? 'Procesando...' : hasWarnings ? 'Confirmar y Sobrescribir' : 'Confirmar Importación'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
