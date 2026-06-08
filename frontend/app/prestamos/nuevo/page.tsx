"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, Trash2 } from 'lucide-react';
import { api, Activo, Usuario, EntidadBase } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function NuevaEntrega() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!user || user.rol_id === 3)) {
      router.replace('/prestamos');
    }
  }, [user, isLoading, router]);
  
  // Catalogs
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<EntidadBase[]>([]);
  const [areas, setAreas] = useState<EntidadBase[]>([]);
  const [cargos, setCargos] = useState<EntidadBase[]>([]);
  const [gerencias, setGerencias] = useState<EntidadBase[]>([]);
  const [sedes, setSedes] = useState<EntidadBase[]>([]);

  // Form State
  const [dniBusqueda, setDniBusqueda] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [empresaId, setEmpresaId] = useState('');
  const [gerenciaId, setGerenciaId] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [cargoId, setCargoId] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState(new Date().toISOString().split('T')[0]);
  const [fechaDevolucion, setFechaDevolucion] = useState('');

  // Assets State
  const [serieBusqueda, setSerieBusqueda] = useState('');
  const [activosAsignados, setActivosAsignados] = useState<Activo[]>([]);
  
  const [error, setError] = useState('');

  const cargarCatalogos = async () => {
    try {
      const [resUsr, resEmp, resAre, resCar, resGer, resSed] = await Promise.all([
        api.get('/usuarios'),
        api.get('/empresas'),
        api.get('/areas'),
        api.get('/cargos'),
        api.get('/gerencias'),
        api.get('/sedes')
      ]);
      setUsuarios(resUsr.data);
      setEmpresas(resEmp.data);
      setAreas(resAre.data);
      setCargos(resCar.data);
      setGerencias(resGer.data);
      setSedes(resSed.data);
    } catch (err) {
      console.error("Error al cargar catálogos", err);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      cargarCatalogos();
    });
  }, []);

  const buscarDni = async () => {
    if (!dniBusqueda) return;
    try {
      const res = await api.get(`/usuarios/dni/${dniBusqueda}`);
      if (res.data) {
        const u = res.data;
        setUsuarioSeleccionado(u.id.toString());
        setEmpresaId(u.empresa_id?.toString() || '');
        setGerenciaId(u.gerencia_id?.toString() || '');
        setSedeId(u.sede_id?.toString() || '');
        setAreaId(u.area_id?.toString() || '');
        setCargoId(u.cargo_id?.toString() || '');
        setError('');
      } else {
        setError('Usuario no encontrado con ese DNI');
      }
    } catch {
      setError('Usuario no encontrado con ese DNI');
    }
  };

  const handleUsuarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setUsuarioSeleccionado(id);
    const u = usuarios.find(usr => usr.id.toString() === id);
    if (u) {
      setEmpresaId(u.empresa_id?.toString() || '');
      setGerenciaId(u.gerencia_id?.toString() || '');
      setSedeId(u.sede_id?.toString() || '');
      setAreaId(u.area_id?.toString() || '');
      setCargoId(u.cargo_id?.toString() || '');
    }
  };

  const buscarActivo = async () => {
    if (!serieBusqueda) return;
    try {
      const res = await api.get(`/activos/buscar/${serieBusqueda}`);
      if (res.data) {
        const activo = res.data;
        if (activo.estado !== 'Disponible') {
          setError(`El activo con Serie ${activo.serie} no está disponible para préstamo.`);
          return;
        }
        if (activosAsignados.find(a => a.id === activo.id)) {
          setError('El activo ya está en la lista.');
          return;
        }
        setActivosAsignados([...activosAsignados, activo]);
        setSerieBusqueda('');
        setError('');
      } else {
        setError('Activo no encontrado');
      }
    } catch {
      setError('Activo no encontrado');
    }
  };

  const quitarActivo = (id: number) => {
    setActivosAsignados(activosAsignados.filter(a => a.id !== id));
  };

  const handleSiguiente = () => {
    if (!usuarioSeleccionado) {
      setError('Seleccione un usuario.');
      return;
    }
    if (activosAsignados.length === 0) {
      setError('Agregue al menos un activo.');
      return;
    }
    if (!fechaDevolucion) {
      setError('Especifique la fecha estimada de devolución.');
      return;
    }

    // Guardar en sessionStorage para el paso 2
    const prestamoData = {
      usuario_id: usuarioSeleccionado,
      activos: activosAsignados,
      fecha_prestamo: fechaEntrega,
      fecha_devolucion: fechaDevolucion
    };
    sessionStorage.setItem('nuevoPrestamo', JSON.stringify(prestamoData));
    router.push('/prestamos/nuevo/firma');
  };

  return (
    <div className="max-w-6xl mx-auto w-full pb-12 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center p-4 bg-slate-500 text-white rounded-t-xl">
        <h1 className="text-xl font-bold">Nueva Entrega</h1>
        <button onClick={handleSiguiente} className="bg-white text-slate-700 px-4 py-1.5 rounded-lg font-medium text-sm hover:bg-slate-100 transition-colors">
          Siguiente &gt;
        </button>
      </div>

      <div className="p-6 space-y-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        {/* Datos del Usuario */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Datos del usuario</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Buscar por DNI</label>
              <div className="flex">
                <input 
                  type="text" 
                  value={dniBusqueda} 
                  onChange={(e) => setDniBusqueda(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && buscarDni()}
                  placeholder="DNI"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-l-md outline-none text-sm focus:border-slate-400"
                />
                <button onClick={buscarDni} className="bg-slate-500 text-white px-3 py-2 rounded-r-md hover:bg-slate-600 transition-colors">
                  <Search size={16} />
                </button>
              </div>
            </div>
            <div className="col-span-2 flex items-end">
              <button onClick={cargarCatalogos} className="flex items-center space-x-2 bg-slate-500 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-600 transition-colors">
                <RefreshCw size={14} />
                <span>Recargar listas seleccionables</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Personal *</label>
              <select value={usuarioSeleccionado} onChange={handleUsuarioChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none">
                <option value="">- Seleccione -</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Empresa *</label>
              <select value={empresaId} disabled className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-md text-sm outline-none text-slate-500 appearance-none">
                <option value="">- Seleccione -</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Gerencia *</label>
              <select value={gerenciaId} disabled className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-md text-sm outline-none text-slate-500 appearance-none">
                <option value="">- Seleccione -</option>
                {gerencias.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Sede *</label>
              <select value={sedeId} disabled className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-md text-sm outline-none text-slate-500 appearance-none">
                <option value="">- Seleccione -</option>
                {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Area *</label>
              <select value={areaId} disabled className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-md text-sm outline-none text-slate-500 appearance-none">
                <option value="">- Seleccione -</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Cargo *</label>
              <select value={cargoId} disabled className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-md text-sm outline-none text-slate-500 appearance-none">
                <option value="">- Seleccione -</option>
                {cargos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Datos del Gestor */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Datos del gestor</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Responsable *</label>
              <input type="text" readOnly value={user?.nombre || ''} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-md text-sm outline-none text-slate-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Area *</label>
              <input type="text" readOnly value={user?.area?.nombre || ''} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-md text-sm outline-none text-slate-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Cargo *</label>
              <input type="text" readOnly value={user?.cargo?.nombre || ''} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-md text-sm outline-none text-slate-500" />
            </div>
          </div>
        </div>

        {/* Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Fecha de entrega</h2>
            <input type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Fecha Est. Devolución *</h2>
            <input type="date" value={fechaDevolucion} onChange={(e) => setFechaDevolucion(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-slate-500" />
          </div>
        </div>

        {/* Activos */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Activos</h2>
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
            <div className="flex-1 max-w-lg">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Buscar activo por número de serie/IMEI (min. 4 carácteres) *</label>
              <div className="flex">
                <input 
                  type="text" 
                  value={serieBusqueda}
                  onChange={(e) => setSerieBusqueda(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && buscarActivo()}
                  placeholder="Serial number / IMEI1 activo"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-l-md outline-none text-sm focus:border-slate-400"
                />
                <button onClick={buscarActivo} className="bg-slate-500 text-white px-3 py-2 rounded-r-md hover:bg-slate-600 transition-colors">
                  <Search size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <th className="p-3 w-10 text-center">Opc.</th>
                  <th className="p-3">Activo</th>
                  <th className="p-3">Marca/Modelo</th>
                  <th className="p-3">Serie/IMEI</th>
                  <th className="p-3 text-center">Condición</th>
                  <th className="p-3">Observaciones de activo</th>
                </tr>
              </thead>
              <tbody>
                {activosAsignados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">Busca y agrega activos a la lista</td>
                  </tr>
                ) : (
                  activosAsignados.map(a => (
                    <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center">
                        <button onClick={() => quitarActivo(a.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                      <td className="p-3 font-medium text-slate-700">{a.tipo}</td>
                      <td className="p-3 text-slate-600">{a.marca} {a.modelo}</td>
                      <td className="p-3 text-slate-600">{a.serie}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">{a.estado}</span>
                      </td>
                      <td className="p-3 text-slate-500 truncate max-w-[200px]">{a.observaciones || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-xl flex justify-between items-center">
        <button onClick={() => router.push('/prestamos')} className="px-6 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-medium transition-colors">
          Cancelar
        </button>
        <button onClick={handleSiguiente} className="px-8 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          Siguiente &gt;
        </button>
      </div>
    </div>
  );
}
