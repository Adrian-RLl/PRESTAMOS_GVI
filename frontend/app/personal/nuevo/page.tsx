'use client';

import { toast } from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Save, X, UserPlus, UploadCloud, Download, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

import * as XLSX from 'xlsx';

export default function NuevoUsuario() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!user || user.rol_id !== 1)) {
      router.replace('/personal');
    }
  }, [user, isLoading, router]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catalogos, setCatalogos] = useState<any>({
    empresas: [],
    gerencias: [],
    sedes: [],
    areas: [],
    cargos: [],
  });

  const [existingUsers, setExistingUsers] = useState<Set<string>>(new Set());

  // Preview State
  const [previewData, setPreviewData] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo: '', 
    correo_personal: '',
    telefono_personal: '',
    celular_personal: '',
    celular_empresa: '',
    genero: '',
    estado: true,
    empresa: '',
    gerencia: '',
    sede: '',
    area: '',
    cargo: '',
  });

  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [empresas, gerencias, sedes, areas, cargos, usuariosRes] = await Promise.all([
          api.get('/empresas'),
          api.get('/gerencias'),
          api.get('/sedes'),
          api.get('/areas'),
          api.get('/cargos'),
          api.get('/usuarios'), // Fetch all users to get existing DNIs
        ]);

        setCatalogos({
          empresas: empresas.data.filter((x: any) => x.estado),
          gerencias: gerencias.data.filter((x: any) => x.estado),
          sedes: sedes.data.filter((x: any) => x.estado),
          areas: areas.data.filter((x: any) => x.estado),
          cargos: cargos.data.filter((x: any) => x.estado),
        });

        const dnis = new Set<string>();
        usuariosRes.data.forEach((u: any) => {
          if (u.dni) dnis.add(u.dni.toString());
        });
        setExistingUsers(dnis);

      } catch (err) {
        console.error('Error cargando catálogos:', err);
      }
    };
    fetchCatalogos();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.dni && existingUsers.has(formData.dni)) {
      toast.error('Este DNI ya está registrado en el sistema.');
      return;
    }

    setLoading(true);
    try {
      const nombreCompleto = `${formData.nombres} ${formData.apellido_paterno} ${formData.apellido_materno}`.trim();
      
      const payload = {
        ...formData,
        nombre: nombreCompleto,
        empresa: formData.empresa || null,
        gerencia: formData.gerencia || null,
        sede: formData.sede || null,
        area: formData.area || null,
        cargo: formData.cargo || null,
        contraseña: formData.dni, 
        activo: formData.estado,
        rol_id: 3 
      };
      
      await api.post('/usuarios', payload);
      toast.success('Usuario creado correctamente');
      router.push('/personal');
    } catch (error) {
      console.error('Error al crear usuario:', error);
      toast.error('Hubo un error al crear el usuario. Verifica tus permisos y los datos.');
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
        
        const dniSet = new Set<string>();

        const batch = data.map((row: any) => {
          const item = {
            dni: row["DNI"]?.toString() || row["dni"]?.toString() || '',
            nombres: row["Nombres"]?.toString() || row["nombres"]?.toString() || '',
            apellido_paterno: row["Apellido Paterno"]?.toString() || row["apellido_paterno"]?.toString() || '',
            apellido_materno: row["Apellido Materno"]?.toString() || row["apellido_materno"]?.toString() || '',
            correo: row["Correo Empresa"]?.toString() || row["Correo"]?.toString() || row["correo"]?.toString() || '',
            correo_personal: row["Correo Personal"]?.toString() || row["correo_personal"]?.toString() || '',
            telefono_personal: row["Teléfono Fijo"]?.toString() || row["telefono_personal"]?.toString() || '',
            celular_personal: row["Celular Personal"]?.toString() || row["celular_personal"]?.toString() || '',
            celular_empresa: row["Celular Empresa"]?.toString() || row["celular_empresa"]?.toString() || '',
            genero: row["Género"]?.toString() || row["Género (Masculino/Femenino)"]?.toString() || row["genero"]?.toString() || '',
            empresa: row["Empresa"]?.toString() || row["ID Empresa"]?.toString() || '',
            gerencia: row["Gerencia"]?.toString() || row["ID Gerencia"]?.toString() || '',
            sede: row["Sede"]?.toString() || row["ID Sede"]?.toString() || '',
            area: row["Área"]?.toString() || row["ID Área"]?.toString() || '',
            cargo: row["Cargo"]?.toString() || row["ID Cargo"]?.toString() || '',
            _errors: [] as string[],
            _warnings: [] as string[]
          };

          if (!item.dni) {
             item._errors.push('Falta el DNI');
          } else if (!/^\d{8}$/.test(item.dni)) {
             item._errors.push('El DNI debe tener 8 dígitos');
          } else {
             if (dniSet.has(item.dni)) {
               item._errors.push('DNI duplicado en este mismo archivo excel');
             } else if (existingUsers.has(item.dni)) {
               item._warnings.push('El usuario ya existe (se actualizarán sus datos)');
             }
             dniSet.add(item.dni);
          }

          if (!item.nombres) item._errors.push('Falta Nombres');
          if (!item.apellido_paterno) item._errors.push('Falta Apellido Paterno');
          if (!item.correo) item._errors.push('Falta Correo Empresa');
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.correo)) {
             item._errors.push('Correo Empresa inválido');
          }

          return item;
        });

        setPreviewData(batch);
      } catch (error: any) {
        console.error("Error importing excel", error);
        toast.error("Hubo un error al procesar el archivo Excel. Asegúrate de que las columnas tengan los nombres correctos.");
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
      const payload = previewData.map(({ _errors, _warnings, ...rest }) => rest);
      const res = await api.post('/usuarios/lote', payload);
      
      const created = res.data?.created || 0;
      const updated = res.data?.updated || 0;
      
      if (updated > 0) {
         toast.success(`Se importaron ${created} nuevos y se actualizaron ${updated} usuarios.`);
      } else {
         toast.success(`Se importaron ${created} usuarios correctamente.`);
      }
      
      router.push('/personal');
    } catch (error: any) {
      console.error("Error al guardar importación", error);
      toast.error(error.response?.data?.message || "Hubo un error al guardar los usuarios.");
    } finally {
      setImporting(false);
      setPreviewData([]);
    }
  };

  const downloadTemplate = () => {
    const ws_data = [
      ["DNI", "Nombres", "Apellido Paterno", "Apellido Materno", "Correo Empresa", "Correo Personal", "Teléfono Fijo", "Celular Personal", "Celular Empresa", "Género (Masculino/Femenino)", "Empresa", "Gerencia", "Sede", "Área", "Cargo"],
      ["70123456", "Juan Alberto", "Perez", "Gomez", "juan@vgi.com", "juan.gomez@gmail.com", "01456789", "987654321", "999888777", "Masculino", "PROSEMBRA", "Operaciones", "Sede Principal", "Sistemas", "Analista"]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    const wscols = [
      {wch: 15}, {wch: 25}, {wch: 20}, {wch: 20}, {wch: 30}, {wch: 30}, {wch: 15}, {wch: 20}, {wch: 20}, {wch: 25}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Usuarios");
    
    XLSX.writeFile(wb, "Plantilla_Carga_Masiva_Personal.xlsx");
  };

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full pt-4 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 flex items-center gap-3">
            <UserPlus className="text-purple-600" size={32} />
            Nuevo Personal
          </h1>
          <p className="text-slate-500 mt-1">Registra un nuevo miembro del personal o realiza una carga masiva.</p>
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
        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Datos Personales</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">DNI *</label>
            <input type="text" name="dni" required maxLength={8} value={formData.dni} onChange={handleChange} placeholder="8 dígitos" className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Nombres *</label>
            <input type="text" name="nombres" required value={formData.nombres} onChange={handleChange} placeholder="Nombres" className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Apellido Paterno *</label>
            <input type="text" name="apellido_paterno" required value={formData.apellido_paterno} onChange={handleChange} placeholder="Paterno" className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Apellido Materno *</label>
            <input type="text" name="apellido_materno" required value={formData.apellido_materno} onChange={handleChange} placeholder="Materno" className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Correo Empresa</label>
            <input type="email" name="correo" value={formData.correo} onChange={handleChange} placeholder="correo@empresa.com" className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Celular Empresa</label>
            <input type="tel" name="celular_empresa" maxLength={9} value={formData.celular_empresa} onChange={handleChange} placeholder="9 dígitos" className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Celular Personal</label>
            <input type="tel" name="celular_personal" maxLength={9} value={formData.celular_personal} onChange={handleChange} placeholder="9 dígitos" className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
          </div>

          <div className="flex flex-col gap-2 pt-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" name="estado" checked={formData.estado} onChange={handleChange} className="sr-only" />
                <div className={`block w-14 h-8 rounded-full transition-colors ${formData.estado ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formData.estado ? 'transform translate-x-6' : ''}`}></div>
              </div>
              <span className="text-sm font-semibold text-slate-700">Usuario Activo</span>
            </label>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4 mt-10">Datos Corporativos</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Empresa *</label>
            <input list="empresas-list" name="empresa" required value={formData.empresa} onChange={handleChange} placeholder="Escribe o selecciona..." className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            <datalist id="empresas-list">
              {catalogos.empresas.map((x: any) => (
                <option key={x.id} value={x.nombre} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Gerencia *</label>
            <input list="gerencias-list" name="gerencia" required value={formData.gerencia} onChange={handleChange} placeholder="Escribe o selecciona..." className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            <datalist id="gerencias-list">
              {catalogos.gerencias.map((x: any) => (
                <option key={x.id} value={x.nombre} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Área *</label>
            <input list="areas-list" name="area" required value={formData.area} onChange={handleChange} placeholder="Escribe o selecciona..." className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            <datalist id="areas-list">
              {catalogos.areas.map((x: any) => (
                <option key={x.id} value={x.nombre} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Cargo *</label>
            <input list="cargos-list" name="cargo" required value={formData.cargo} onChange={handleChange} placeholder="Escribe o selecciona..." className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            <datalist id="cargos-list">
              {catalogos.cargos.map((x: any) => (
                <option key={x.id} value={x.nombre} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Sede *</label>
            <input list="sedes-list" name="sede" required value={formData.sede} onChange={handleChange} placeholder="Escribe o selecciona..." className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            <datalist id="sedes-list">
              {catalogos.sedes.map((x: any) => (
                <option key={x.id} value={x.nombre} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
          <Link href="/personal" className="px-6 py-2.5 text-slate-600 hover:text-slate-900 font-medium transition-colors flex items-center gap-2">
            <X size={18} /> Cancelar
          </Link>
          <button type="submit" disabled={loading} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20">
            {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save size={18} />}
            {loading ? 'Guardando...' : 'Guardar Personal'}
          </button>
        </div>
      </form>

      {/* Modal de Previsualización y Validación */}
      {previewData.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
              <h3 className="font-bold text-xl text-slate-800">Previsualización de Personal</h3>
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
                    <h4 className="font-bold">Hay personal que se va a sobrescribir</h4>
                    <p className="text-sm mt-1">Hemos detectado DNIs existentes. Al confirmar, los datos de esas personas se actualizarán con la información del Excel.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 p-4 rounded-xl border border-emerald-200 mb-6 shadow-sm">
                  <AlertCircle size={20} className="flex-shrink-0" />
                  <p>Todos los <strong>{previewData.length}</strong> usuarios son nuevos y tienen un formato válido.</p>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-sm">
                      <th className="p-4 font-semibold">N°</th>
                      <th className="p-4 font-semibold">DNI</th>
                      <th className="p-4 font-semibold">Nombres</th>
                      <th className="p-4 font-semibold">Apellidos</th>
                      <th className="p-4 font-semibold">Correo Emp.</th>
                      <th className="p-4 font-semibold">Correo Pers.</th>
                      <th className="p-4 font-semibold">Tel. Fijo</th>
                      <th className="p-4 font-semibold">Cel. Emp.</th>
                      <th className="p-4 font-semibold">Cel. Pers.</th>
                      <th className="p-4 font-semibold">Género</th>
                      <th className="p-4 font-semibold">Empresa</th>
                      <th className="p-4 font-semibold">Gerencia</th>
                      <th className="p-4 font-semibold">Sede</th>
                      <th className="p-4 font-semibold">Área</th>
                      <th className="p-4 font-semibold">Cargo</th>
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
                          <td className={`p-4 font-medium ${!row.dni && 'text-red-500 italic'}`}>{row.dni || 'Falta'}</td>
                          <td className={`p-4 ${!row.nombres && 'text-red-500 italic'}`}>{row.nombres || 'Falta'}</td>
                          <td className="p-4">{row.apellido_paterno} {row.apellido_materno}</td>
                          <td className="p-4">{row.correo}</td>
                          <td className="p-4">{row.correo_personal}</td>
                          <td className="p-4">{row.telefono_personal}</td>
                          <td className="p-4">{row.celular_empresa}</td>
                          <td className="p-4">{row.celular_personal}</td>
                          <td className="p-4">{row.genero}</td>
                          <td className="p-4">{row.empresa}</td>
                          <td className="p-4">{row.gerencia}</td>
                          <td className="p-4">{row.sede}</td>
                          <td className="p-4">{row.area}</td>
                          <td className="p-4">{row.cargo}</td>
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
