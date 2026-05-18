'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Save, X, UserPlus, UploadCloud, Download } from 'lucide-react';
import Link from 'next/link';

import * as XLSX from 'xlsx';

export default function NuevoUsuario() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [catalogos, setCatalogos] = useState<any>({
    empresas: [],
    gerencias: [],
    sedes: [],
    areas: [],
    cargos: [],
  });

  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo: '', // Correo Empresa
    correo_personal: '',
    telefono_personal: '',
    celular_personal: '',
    celular_empresa: '',
    genero: '',
    estado: true,
    empresa_id: '',
    gerencia_id: '',
    sede_id: '',
    area_id: '',
    cargo_id: '',
  });

  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [empresas, gerencias, sedes, areas, cargos] = await Promise.all([
          axios.get('http://localhost:3001/empresas', { headers }),
          axios.get('http://localhost:3001/gerencias', { headers }),
          axios.get('http://localhost:3001/sedes', { headers }),
          axios.get('http://localhost:3001/areas', { headers }),
          axios.get('http://localhost:3001/cargos', { headers }),
        ]);

        setCatalogos({
          empresas: empresas.data,
          gerencias: gerencias.data,
          sedes: sedes.data,
          areas: areas.data,
          cargos: cargos.data,
        });
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
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Nombre completo computado
      const nombreCompleto = `${formData.nombres} ${formData.apellido_paterno} ${formData.apellido_materno}`.trim();
      
      const payload = {
        ...formData,
        nombre: nombreCompleto,
        empresa_id: formData.empresa_id ? parseInt(formData.empresa_id) : null,
        gerencia_id: formData.gerencia_id ? parseInt(formData.gerencia_id) : null,
        sede_id: formData.sede_id ? parseInt(formData.sede_id) : null,
        area_id: formData.area_id ? parseInt(formData.area_id) : null,
        cargo_id: formData.cargo_id ? parseInt(formData.cargo_id) : null,
        contraseña: formData.dni, // Por defecto el DNI
        activo: formData.estado,
        rol_id: 3 // Fuerza que sea rol Personal (Usuario normal)
      };
      
      await axios.post('http://localhost:3001/usuarios', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      router.push('/personal');
    } catch (error) {
      console.error('Error al crear usuario:', error);
      alert('Hubo un error al crear el usuario. Verifica tus permisos y los datos.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const ws_data = [
      ["DNI", "Nombres", "Apellido Paterno", "Apellido Materno", "Correo Empresa", "Correo Personal", "Teléfono Fijo", "Celular Personal", "Celular Empresa", "Género (Masculino/Femenino)", "ID Empresa", "ID Gerencia", "ID Sede", "ID Área", "ID Cargo"],
      ["70123456", "Juan Alberto", "Perez", "Gomez", "juan@vgi.com", "juan.gomez@gmail.com", "01456789", "987654321", "999888777", "Masculino", "1", "1", "1", "1", "1"]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // Ajustar anchos de columnas para que se vea bien
    const wscols = [
      {wch: 15}, // DNI
      {wch: 25}, // Nombres
      {wch: 20}, // Apellido Paterno
      {wch: 20}, // Apellido Materno
      {wch: 30}, // Correo Empresa
      {wch: 30}, // Correo Personal
      {wch: 15}, // Teléfono Fijo
      {wch: 20}, // Celular Personal
      {wch: 20}, // Celular Empresa
      {wch: 25}, // Género
      {wch: 15}, // ID Empresa
      {wch: 15}, // ID Gerencia
      {wch: 15}, // ID Sede
      {wch: 15}, // ID Área
      {wch: 15}  // ID Cargo
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
          <p className="text-slate-500 mt-1">Registra un nuevo usuario en el sistema o realiza carga masiva.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button onClick={downloadTemplate} type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors">
            <Download size={18} /> Descargar Plantilla
          </button>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 border border-emerald-300 hover:bg-emerald-200 text-emerald-800 rounded-xl font-medium transition-colors cursor-pointer">
            <UploadCloud size={18} /> Cargar Excel
            <input type="file" className="hidden" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Datos Personales</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">DNI *</label>
            <input type="text" name="dni" required value={formData.dni} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Nombres *</label>
            <input type="text" name="nombres" required value={formData.nombres} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Apellido Paterno *</label>
            <input type="text" name="apellido_paterno" required value={formData.apellido_paterno} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Apellido Materno *</label>
            <input type="text" name="apellido_materno" required value={formData.apellido_materno} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Género</label>
            <select name="genero" value={formData.genero} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all">
              <option value="">- Seleccione -</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Datos Corporativos</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Empresa *</label>
            <select name="empresa_id" required value={formData.empresa_id} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all">
              <option value="">- Seleccione -</option>
              {catalogos.empresas.map((item: any) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Gerencia *</label>
            <select name="gerencia_id" required value={formData.gerencia_id} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all">
              <option value="">- Seleccione -</option>
              {catalogos.gerencias.map((item: any) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Sede *</label>
            <select name="sede_id" required value={formData.sede_id} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all">
              <option value="">- Seleccione -</option>
              {catalogos.sedes.map((item: any) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Área *</label>
            <select name="area_id" required value={formData.area_id} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all">
              <option value="">- Seleccione -</option>
              {catalogos.areas.map((item: any) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Cargo *</label>
            <select name="cargo_id" required value={formData.cargo_id} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all">
              <option value="">- Seleccione -</option>
              {catalogos.cargos.map((item: any) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Correo Empresa *</label>
            <input type="email" name="correo" required value={formData.correo} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Celular Empresa</label>
            <input type="text" name="celular_empresa" value={formData.celular_empresa} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
          </div>
          
          <div className="flex flex-col gap-2 justify-center pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="estado" checked={formData.estado} onChange={handleChange} className="w-5 h-5 accent-emerald-500" />
              <span className="text-sm font-semibold text-slate-700">Usuario Activo</span>
            </label>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Datos de Contacto (Personal)</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Correo Personal</label>
            <input type="email" name="correo_personal" value={formData.correo_personal} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Teléfono Fijo</label>
            <input type="text" name="telefono_personal" value={formData.telefono_personal} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Celular Personal</label>
            <input type="text" name="celular_personal" value={formData.celular_personal} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
          </div>
        </div>

        <div className="mt-10 flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
          <Link href="/personal" className="px-6 py-2.5 text-slate-600 hover:text-slate-900 font-medium transition-colors flex items-center gap-2">
            <X size={18} /> Cancelar
          </Link>
          <button type="submit" disabled={loading} className="px-8 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-500/20">
            {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save size={18} />}
            {loading ? 'Guardando...' : 'Guardar Personal'}
          </button>
        </div>
      </form>
    </div>
  );
}
