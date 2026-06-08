"use client";

import { useState, useEffect } from 'react';
import { api, EntidadBase } from '@/lib/api';
import { Plus, Edit2, Trash2, X, Check, Search, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Props {
  title: string;
  endpoint: string;
}

export default function GenericCatalog({ title, endpoint }: Props) {
  const { user } = useAuth();
  const isValidador = user && user.rol_id === 1;

  const [data, setData] = useState<EntidadBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EntidadBase | null>(null);
  const [formData, setFormData] = useState({ nombre: '', estado: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/${endpoint}`);
      setData(res.data);
    } catch (err) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (item?: EntidadBase) => {
    if (item) {
      setEditingItem(item);
      setFormData({ nombre: item.nombre, estado: item.estado });
    } else {
      setEditingItem(null);
      setFormData({ nombre: '', estado: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingItem) {
        await api.patch(`/${endpoint}/${editingItem.id}`, formData);
      } else {
        await api.post(`/${endpoint}`, formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de desactivar este registro?')) {
      try {
        await api.delete(`/${endpoint}/${id}`);
        fetchData();
      } catch (err) {
        setError('Error al eliminar');
      }
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        {isValidador && (
          <button 
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            <span>Nuevo</span>
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Buscar..."
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

      <div className="flex-1 overflow-auto bg-slate-50 rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 text-sm">
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Nombre</th>
              <th className="p-4 font-medium">Estado</th>
              {isValidador && <th className="p-4 font-medium text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isValidador ? 4 : 3} className="p-8 text-center text-slate-500">Cargando...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={isValidador ? 4 : 3} className="p-8 text-center text-slate-500">No hay registros</td></tr>
            ) : (
              filteredData.map(item => (
                <tr key={item.id} className="border-b border-slate-200 hover:bg-white transition-colors">
                  <td className="p-4 text-slate-600">#{item.id}</td>
                  <td className="p-4 font-medium text-slate-800">{item.nombre}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {isValidador && (
                    <td className="p-4 flex justify-end space-x-2">
                      <button 
                        onClick={() => openModal(item)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      {item.estado && (
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                {editingItem ? 'Editar Registro' : 'Nuevo Registro'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              {editingItem && (
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="estado"
                    checked={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.checked})}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <label htmlFor="estado" className="text-sm font-medium text-slate-700">Registro Activo</label>
                </div>
              )}
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-xl transition-colors flex justify-center items-center space-x-2 disabled:opacity-70"
                >
                  {saving ? <span>Guardando...</span> : <><Check size={18} /><span>Guardar</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
