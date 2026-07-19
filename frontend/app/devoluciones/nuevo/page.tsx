"use client";

import { toast } from 'react-hot-toast';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Save, X, RotateCcw, PenTool, CheckCircle, AlertCircle, User, Box, ChevronRight } from 'lucide-react';
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
  const [observaciones, setObservaciones] = useState<Record<number, string>>({});
  const [devueltoPorTercero, setDevueltoPorTercero] = useState('');

  // Action State
  const [loading, setLoading] = useState(false);

  const buscarUsuario = async () => {
    if (!dni) return;
    setSearching(true);
    setError('');
    setUsuarioData(null);
    setActivosPrestados([]);
    setSelectedIds([]);
    setObservaciones({});
    setDevueltoPorTercero('');

    try {
      const res = await api.get(`/prestamos/activos-usuario/${dni}`);
      const items: Prestamo[] = res.data;

      if (items.length === 0) {
        try {
          const uRes = await api.get(`/usuarios/dni/${dni}`);
          setUsuarioData(uRes.data);
          setError('El personal no tiene ningún activo asignado para devolución.');
        } catch {
          setError('DNI no encontrado en la base de datos.');
        }
        return;
      }

      setUsuarioData(items[0].usuario);
      setActivosPrestados(items);
      setSelectedIds(items.map(i => i.id));
      
      const obsInit: Record<number, string> = {};
      items.forEach(i => {
        if (i.activo?.observaciones) {
          obsInit[i.id] = i.activo.observaciones;
        }
      });
      setObservaciones(obsInit);

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

  const updateObservacion = (id: number, val: string) => {
    setObservaciones(prev => ({ ...prev, [id]: val }));
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
      toast.error("Por favor, proporcione una firma digital de conformidad.");
      return;
    }

    setLoading(true);
    const firmaDevolucion = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');

    try {
      await api.post('/prestamos/devolver-lote', {
        prestamos_ids: selectedIds,
        firma_devolucion: firmaDevolucion,
        observaciones_activos: observaciones,
        devuelto_por_tercero: devueltoPorTercero.trim() || undefined
      });
      toast.success('Devolución registrada exitosamente.');
      router.push('/devoluciones');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al guardar la devolución.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full pb-12 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-emerald-600 text-white p-6 rounded-t-2xl shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        <div className="relative z-10 flex items-center space-x-3">
          <div className="p-2 bg-emerald-500 rounded-lg">
            <RotateCcw size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Nueva Devolución</h1>
            <p className="text-emerald-200 text-sm">Registra el retorno de activos al inventario</p>
          </div>
        </div>
        <Link href="/devoluciones" className="relative z-10 flex items-center space-x-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white px-5 py-2 rounded-xl font-semibold transition-all">
          <X size={18} />
          <span>Cancelar</span>
        </Link>
      </div>

      <div className="bg-slate-50/50 p-6 md:p-8 space-y-8 rounded-b-2xl shadow-md border border-slate-200/60 border-t-0">
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Sección: Datos del Personal */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center mb-6">
            <User size={20} className="mr-2 text-emerald-500" /> Datos del Titular
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="col-span-1 md:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Buscar por DNI del Titular</label>
              <div className="flex shadow-sm rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/30 transition-shadow bg-white">
                <input 
                  type="text" 
                  value={dni} 
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && buscarUsuario()}
                  placeholder="Ej. 70123456"
                  maxLength={8} pattern="\d{8}" title="El DNI debe tener 8 dígitos numéricos"
                  className="flex-1 px-4 py-2.5 outline-none text-sm border-y border-l border-slate-300"
                />
                <button 
                  type="button" 
                  onClick={buscarUsuario} 
                  disabled={searching}
                  className="bg-emerald-600 text-white px-4 py-2.5 hover:bg-emerald-700 transition-colors border border-emerald-600 flex items-center justify-center disabled:opacity-70"
                >
                  {searching ? <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin"></div> : <Search size={18} />}
                </button>
              </div>
            </div>

            {usuarioData && (
              <div className="col-span-1 md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Nombre Completo</label>
                  <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium">
                    {usuarioData.nombre || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Empresa</label>
                  <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                    {usuarioData.empresa?.nombre || 'No asignada'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Área / Cargo</label>
                  <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                    {usuarioData.area?.nombre || '-'} / {usuarioData.cargo?.nombre || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Sede</label>
                  <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                    {usuarioData.sede?.nombre || 'No asignada'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Activos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
              <Box size={20} className="mr-2 text-amber-500" /> Equipos en su poder
            </h2>
            {activosPrestados.length > 0 && (
              <button 
                type="button" 
                onClick={selectAll} 
                className="text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-colors border border-amber-200"
              >
                {selectedIds.length === activosPrestados.length ? 'Desmarcar todos' : 'Marcar todos'}
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-4 w-12 text-center">Sel.</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Marca / Modelo</th>
                  <th className="p-4">Serie / IMEI</th>
                  <th className="p-4">Observaciones a la Devolución</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activosPrestados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center bg-slate-50/50">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-3">
                          <Search size={24} className="text-slate-300" />
                        </div>
                        <p className="font-semibold text-slate-500">Busca el DNI para cargar equipos asignados</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  activosPrestados.map(p => {
                    const isSelected = selectedIds.includes(p.id);
                    return (
                      <tr 
                        key={p.id} 
                        className={`transition-colors cursor-pointer ${isSelected ? 'bg-emerald-50/40 hover:bg-emerald-50/60' : 'hover:bg-slate-50/80'}`}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).tagName !== 'INPUT') toggleSelect(p.id);
                        }}
                      >
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => toggleSelect(p.id)}
                            className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                          />
                        </td>
                        <td className="p-4 font-bold text-slate-700">{p.activo?.tipo}</td>
                        <td className="p-4 text-slate-600 font-medium">{p.activo?.marca} {p.activo?.modelo}</td>
                        <td className="p-4 font-mono text-xs bg-white/50 px-2 rounded border border-slate-100 inline-block mt-3">{p.activo?.serie}</td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={observaciones[p.id] || ''}
                            onChange={(e) => updateObservacion(p.id, e.target.value)}
                            placeholder="Ej. Pantalla rota, sin cargador..."
                            disabled={!isSelected}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-xs bg-white disabled:bg-slate-50 disabled:opacity-50"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Firma digital y Devolución por Tercero */}
        {usuarioData && activosPrestados.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 flex items-center gap-2 mb-6">
              <PenTool size={20} className="text-blue-500" />
              Firma Digital de Conformidad
            </h2>
            
            <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl flex items-start gap-4 mb-6 max-w-4xl">
              <CheckCircle size={22} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800 font-medium leading-relaxed">
                El firmante declara hacer devolución formal de los activos seleccionados en el estado descrito, 
                liberando de la asignación temporal registrada en el sistema.
              </p>
            </div>

            <div className="mb-6 max-w-xl">
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
                Nombre de quien devuelve (Solo si es distinto al Titular)
              </label>
              <input 
                type="text" 
                value={devueltoPorTercero}
                onChange={(e) => setDevueltoPorTercero(e.target.value)}
                placeholder="Ej. Juan Pérez (Compañero)"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-sm shadow-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">Si el mismo titular está devolviendo el equipo, deja este campo en blanco.</p>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 relative overflow-hidden group max-w-2xl">
              <SignatureCanvas 
                ref={sigCanvas} 
                canvasProps={{className: 'w-full h-64 cursor-crosshair'}} 
                penColor="black"
              />
              <div className="absolute top-3 right-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <button 
                  type="button" 
                  onClick={clearSignature} 
                  className="bg-white text-slate-500 hover:text-red-500 px-4 py-2 rounded-xl text-sm shadow-sm border border-slate-200 font-bold transition-all hover:border-red-200 hover:bg-red-50"
                >
                  Limpiar Firma
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 font-medium">Usa el mouse o pantalla táctil en el recuadro gris superior para firmar.</p>
          </div>
        )}

        {/* Acciones */}
        <div className="pt-4 flex justify-between items-center">
          <Link 
            href="/devoluciones" 
            className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl font-bold text-sm transition-all shadow-sm"
          >
            Cancelar
          </Link>
          <button 
            type="button" 
            onClick={handleSubmit}
            disabled={loading || !usuarioData || selectedIds.length === 0} 
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save size={18} />}
            {loading ? 'Procesando...' : 'Confirmar Devolución'}
          </button>
        </div>
      </div>
    </div>
  );
}
