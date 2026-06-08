"use client";

import { useState, useEffect } from 'react';
import { api, Usuario, EntidadBase } from '@/lib/api';
import { Plus, Edit2, Trash2, X, Check, Search, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const roles = [
  { id: 1, nombre: 'Administrador' },
  { id: 2, nombre: 'Analista TI' },
  { id: 3, nombre: 'Usuario' }
];

export default function PersonalCatalog() {
  const { user } = useAuth();
  const isValidador = user && user.rol_id === 1;

  const [data, setData] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Catalogs
  const [empresas, setEmpresas] = useState<EntidadBase[]>([]);
  const [areas, setAreas] = useState<EntidadBase[]>([]);
  const [cargos, setCargos] = useState<EntidadBase[]>([]);
  const [gerencias, setGerencias] = useState<EntidadBase[]>([]);
  const [sedes, setSedes] = useState<EntidadBase[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({ 
    dni: '', nombre: '', correo: '', contraseña: '', rol_id: 3, activo: true,
    empresa_id: '', area_id: '', cargo_id: '', gerencia_id: '', sede_id: '' 
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
    fetchCatalogs();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/usuarios');
      setData(res.data);
    } catch (err) {
      setError('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalogs = async () => {
    try {
      const [resEmp, resAre, resCar, resGer, resSed] = await Promise.all([
        api.get('/empresas'), api.get('/areas'), api.get('/cargos'), api.get('/gerencias'), api.get('/sedes')
      ]);
      setEmpresas(resEmp.data); setAreas(resAre.data); setCargos(resCar.data);
      setGerencias(resGer.data); setSedes(resSed.data);
    } catch (err) {
      console.error("Error cargando catálogos", err);
    }
  };

  const filteredData = data.filter(item => 
    item.rol_id === 3 &&
    (item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.dni || '').includes(searchTerm))
  );

  const openModal = (item?: Usuario) => {
    if (item) {
      setEditingItem(item);
      setFormData({ 
        dni: item.dni || '',
        nombre: item.nombre, correo: item.correo, contraseña: '', rol_id: item.rol_id, activo: item.activo,
        empresa_id: item.empresa_id ? String(item.empresa_id) : '',
        area_id: item.area_id ? String(item.area_id) : '',
        cargo_id: item.cargo_id ? String(item.cargo_id) : '',
        gerencia_id: item.gerencia_id ? String(item.gerencia_id) : '',
        sede_id: item.sede_id ? String(item.sede_id) : ''
      });
    } else {
      setEditingItem(null);
      setFormData({ 
        dni: '', nombre: '', correo: '', contraseña: '', rol_id: 3, activo: true,
        empresa_id: '', area_id: '', cargo_id: '', gerencia_id: '', sede_id: '' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const payload: any = {
        dni: formData.dni || null,
        nombre: formData.nombre,
        correo: formData.correo,
        rol_id: Number(formData.rol_id),
        activo: formData.activo,
        empresa_id: formData.empresa_id ? Number(formData.empresa_id) : null,
        area_id: formData.area_id ? Number(formData.area_id) : null,
        cargo_id: formData.cargo_id ? Number(formData.cargo_id) : null,
        gerencia_id: formData.gerencia_id ? Number(formData.gerencia_id) : null,
        sede_id: formData.sede_id ? Number(formData.sede_id) : null,
      };

      if (formData.contraseña) {
        payload.contraseña = formData.contraseña;
      }

      if (editingItem) {
        await api.patch(`/usuarios/${editingItem.id}`, payload);
      } else {
        await api.post('/usuarios', payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de desactivar este personal? No podrá recibir nuevos préstamos.')) {
      try {
        await api.delete(`/usuarios/${id}`);
        fetchData();
      } catch (err) {
        setError('Error al desactivar el usuario');
      }
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Personal</h1>
          <p className="text-slate-500 mt-1">Gestiona los empleados que recibirán equipos prestados</p>
        </div>
        {isValidador && (
          <Link 
            href="/personal/nuevo"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-colors text-sm font-medium shadow-sm w-full sm:w-auto"
          >
            <Plus size={18} />
            <span>Nuevo Personal</span>
          </Link>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Buscar por DNI, nombre o correo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center space-x-2 text-sm border border-red-100">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-auto bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 text-sm">
              <th className="p-4 font-medium">DNI</th>
              <th className="p-4 font-medium">Nombre / Correo</th>
              <th className="p-4 font-medium">Empresa</th>
              <th className="p-4 font-medium">Área / Cargo</th>
              <th className="p-4 font-medium">Estado</th>
              {isValidador && <th className="p-4 font-medium text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isValidador ? 6 : 5} className="p-8 text-center text-slate-500">Cargando usuarios...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={isValidador ? 6 : 5} className="p-8 text-center text-slate-500">No se encontraron usuarios</td></tr>
            ) : (
              filteredData.map(item => (
                <tr key={item.id} className="border-b border-slate-200 hover:bg-white transition-colors">
                  <td className="p-4 font-medium text-slate-700">
                    {item.dni || <span className="text-slate-400 italic">No registrado</span>}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{item.nombre}</div>
                    <div className="text-sm text-slate-500">{item.correo}</div>
                  </td>
                  <td className="p-4 text-slate-600">
                    {item.empresa ? item.empresa.nombre : <span className="text-slate-400 italic">No asignada</span>}
                  </td>
                  <td className="p-4 text-slate-600">
                    <div className="font-medium text-slate-800">{item.area?.nombre || <span className="text-slate-400 italic">No asignada</span>}</div>
                    <div className="text-sm text-slate-500">{item.cargo?.nombre || <span className="text-slate-400 italic">No asignado</span>}</div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {isValidador && (
                    <td className="p-4 flex justify-end space-x-2 items-center h-full">
                      <button 
                        onClick={() => openModal(item)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mt-1"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      {item.activo && (
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                          title="Desactivar"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-8">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
              <h3 className="font-bold text-xl text-slate-800">
                {editingItem ? 'Editar Personal' : 'Nuevo Personal'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Sección Datos Personales */}
              <div>
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Datos Personales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">DNI <span className="text-red-500">*</span></label>
                    <input 
                      type="text" value={formData.dni} onChange={(e) => setFormData({...formData, dni: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
                    <input 
                      type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico <span className="text-red-500">*</span></label>
                    <input 
                      type="email" value={formData.correo} onChange={(e) => setFormData({...formData, correo: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required
                    />
                  </div>
                </div>
              </div>
 
              {/* Sección Datos Organizacionales */}
              <div>
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Datos Organizacionales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Empresa <span className="text-red-500">*</span></label>
                    <select 
                      value={formData.empresa_id} onChange={(e) => setFormData({...formData, empresa_id: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white" required
                    >
                      <option value="">Seleccione Empresa...</option>
                      {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Área <span className="text-red-500">*</span></label>
                    <select 
                      value={formData.area_id} onChange={(e) => setFormData({...formData, area_id: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white" required
                    >
                      <option value="">Seleccione Área...</option>
                      {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cargo <span className="text-red-500">*</span></label>
                    <select 
                      value={formData.cargo_id} onChange={(e) => setFormData({...formData, cargo_id: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white" required
                    >
                      <option value="">Seleccione Cargo...</option>
                      {cargos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gerencia (Opcional)</label>
                    <select 
                      value={formData.gerencia_id} onChange={(e) => setFormData({...formData, gerencia_id: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="">Seleccione Gerencia...</option>
                      {gerencias.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sede (Opcional)</label>
                    <select 
                      value={formData.sede_id} onChange={(e) => setFormData({...formData, sede_id: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="">Seleccione Sede...</option>
                      {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                  </div>
                </div>
              </div>
 
              {editingItem && (
                <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <input 
                    type="checkbox" id="activo" checked={formData.activo}
                    onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                    className="rounded text-blue-600 focus:ring-blue-500 w-5 h-5"
                  />
                  <div>
                    <label htmlFor="activo" className="text-sm font-semibold text-slate-800">Personal Activo</label>
                    <p className="text-xs text-slate-500">Si se desmarca, el personal estará inactivo y no se le podrán asignar préstamos.</p>
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-6 border-t border-slate-100">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="w-1/3 px-4 py-3 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 font-medium rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" disabled={saving}
                  className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center space-x-2 disabled:opacity-70 shadow-md shadow-blue-500/20"
                >
                  {saving ? <span>Guardando...</span> : <><Check size={20} /><span>Guardar Cambios</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
