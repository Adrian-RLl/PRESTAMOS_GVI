"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Save, X, RotateCcw, PenTool, CheckCircle, AlertCircle } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { api, Prestamo } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function NuevaDevolucion() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!user || user.rol_id === 3)) {
      router.replace('/devoluciones');
    }
  }, [user, isLoading, router]);

  const sigCanvas = useRef<SignatureCanvas>(null);
  
  // Search State
  const [dni, setDni] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [usuarioData, setUsuarioData] = useState<any>(null);
  const [activosPrestados, setActivosPrestados] = useState<Prestamo[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Action State
  const [loading, setLoading] = useState(false);

  const buscarUsuario = async () => {
    if (!dni) return;
    setSearching(true);
    setError('');
    setUsuarioData(null);
    setActivosPrestados([]);
    setSelectedIds([]);

    try {
      // 1. Obtener los activos en préstamo activo del usuario por DNI
      const res = await api.get(`/prestamos/activos-usuario/${dni}`);
      const items: Prestamo[] = res.data;

      if (items.length === 0) {
        // Buscar el usuario para ver si al menos existe
        try {
          const uRes = await api.get(`/usuarios/dni/${dni}`);
          setUsuarioData(uRes.data);
          setError('El personal no tiene ningún activo asignado para devolución.');
        } catch {
          setError('DNI no encontrado en la base de datos.');
        }
        return;
      }

      // El primer registro tiene la información del usuario
      setUsuarioData(items[0].usuario);
      setActivosPrestados(items);
      // Seleccionar todos por defecto
      setSelectedIds(items.map(i => i.id));
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al buscar el personal y sus préstamos.');
    } finally {
      setSearching(false);
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedIds.length === activosPrestados.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activosPrestados.map(i => i.id));
    }
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioData || activosPrestados.length === 0) {
      setError('Por favor, busca un usuario con activos asignados.');
      return;
    }
    if (selectedIds.length === 0) {
      setError('Debes seleccionar al menos un activo para realizar la devolución.');
      return;
    }
    if (sigCanvas.current?.isEmpty()) {
      alert("Por favor, proporcione una firma digital de conformidad.");
      return;
    }

    setLoading(true);
    const firmaDevolucion = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');

    try {
      await api.post('/prestamos/devolver-lote', {
        prestamos_ids: selectedIds,
        firma_devolucion: firmaDevolucion
      });
      alert('Devolución general registrada exitosamente.');
      router.push('/devoluciones');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al guardar la devolución general.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full pb-12 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center p-4 bg-emerald-600 text-white rounded-t-xl">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <RotateCcw size={20} />
          Nueva Devolución General
        </h1>
        <Link href="/devoluciones" className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 font-medium border border-white/10">
          <X size={16} /> Cancelar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-2">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Datos del Usuario */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Datos del personal</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Buscar por DNI del Personal *</label>
              <div className="flex">
                <input 
                  type="text" 
                  value={dni} 
                  onChange={(e) => setDni(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscarUsuario())}
                  placeholder="Ej. 70123456"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-l-xl outline-none text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                />
                <button 
                  type="button" 
                  onClick={buscarUsuario} 
                  disabled={searching}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-r-xl hover:bg-emerald-700 transition-colors flex items-center justify-center disabled:opacity-70"
                >
                  {searching ? <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin"></div> : <Search size={16} />}
                </button>
              </div>
            </div>

            {usuarioData && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Completo</label>
                  <input type="text" readOnly value={usuarioData.nombre || ''} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none text-slate-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Empresa</label>
                  <input type="text" readOnly value={usuarioData.empresa?.nombre || 'No asignada'} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none text-slate-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Área / Cargo</label>
                  <input type="text" readOnly value={`${usuarioData.area?.nombre || '-'} / ${usuarioData.cargo?.nombre || '-'}`} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none text-slate-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sede</label>
                  <input type="text" readOnly value={usuarioData.sede?.nombre || 'No asignada'} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none text-slate-600" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Lista de Activos */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center justify-between">
            <span>Equipos en su poder</span>
            {activosPrestados.length > 0 && (
              <button 
                type="button" 
                onClick={selectAll} 
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                {selectedIds.length === activosPrestados.length ? 'Desmarcar todos' : 'Marcar todos'}
              </button>
            )}
          </h2>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <th className="p-3 w-10 text-center">Devolver</th>
                  <th className="p-3">Activo</th>
                  <th className="p-3">Marca / Modelo</th>
                  <th className="p-3">Serie / IMEI</th>
                  <th className="p-3">Fecha Entrega</th>
                  <th className="p-3">Fecha Est. Devolución</th>
                </tr>
              </thead>
              <tbody>
                {activosPrestados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                      Ingresa el DNI del personal para cargar sus equipos activos
                    </td>
                  </tr>
                ) : (
                  activosPrestados.map(p => (
                    <tr 
                      key={p.id} 
                      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer ${
                        selectedIds.includes(p.id) ? 'bg-emerald-50/20' : ''
                      }`}
                      onClick={() => toggleSelect(p.id)}
                    >
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(p.id)} 
                          onChange={() => toggleSelect(p.id)}
                          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-medium text-slate-700">{p.activo?.tipo}</td>
                      <td className="p-3 text-slate-600">{p.activo?.marca} {p.activo?.modelo}</td>
                      <td className="p-3 font-mono text-slate-600">{p.activo?.serie}</td>
                      <td className="p-3 text-slate-500">{new Date(p.fecha_prestamo).toLocaleDateString()}</td>
                      <td className="p-3 text-slate-500">{new Date(p.fecha_devolucion).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Firma digital */}
        {usuarioData && activosPrestados.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
              <PenTool size={18} />
              Firma Digital de Conformidad (Devolución)
            </h2>
            
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3 mb-4 max-w-4xl">
              <CheckCircle size={20} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-emerald-800 font-medium leading-relaxed">
                El firmante declara hacer devolución formal de los activos seleccionados en el checklist en el estado actual, 
                liberando de la asignación temporal registrada en el sistema de control.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 relative overflow-hidden group max-w-2xl">
              <SignatureCanvas 
                ref={sigCanvas} 
                canvasProps={{className: 'w-full h-60 cursor-crosshair'}} 
                penColor="black"
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  type="button" 
                  onClick={clearSignature} 
                  className="bg-white text-slate-500 hover:text-red-500 px-3 py-1.5 rounded-lg text-sm shadow-sm border border-slate-200 font-semibold transition-colors"
                >
                  Limpiar Firma
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500">Usa el mouse o pantalla táctil en el recuadro gris superior para firmar.</p>
          </div>
        )}

        {/* Acciones */}
        <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
          <Link 
            href="/devoluciones" 
            className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl font-medium text-sm transition-colors"
          >
            Cancelar
          </Link>
          <button 
            type="submit" 
            disabled={loading || !usuarioData || selectedIds.length === 0} 
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors shadow-md shadow-emerald-600/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save size={18} />}
            {loading ? 'Procesando...' : 'Confirmar Devolución'}
          </button>
        </div>
      </form>
    </div>
  );
}
