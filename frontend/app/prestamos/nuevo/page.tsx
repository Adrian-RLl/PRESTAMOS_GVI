"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, Trash2, User, Building2, Briefcase, MapPin, Monitor, Calendar, Box, ChevronRight, CheckCircle2 } from 'lucide-react';
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
  const [tipoEntrega, setTipoEntrega] = useState('prestamo');

  // Assets State & Autocomplete
  const [serieBusqueda, setSerieBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<Activo[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [activosAsignados, setActivosAsignados] = useState<Activo[]>([]);
  
  const [error, setError] = useState('');
  
  const sugerenciasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cerrar sugerencias al hacer clic fuera
    const handleClickOutside = (event: MouseEvent) => {
      if (sugerenciasRef.current && !sugerenciasRef.current.contains(event.target as Node)) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Autocomplete
  useEffect(() => {
    const fetchSugerencias = async () => {
      if (serieBusqueda.length >= 2) {
        try {
          const res = await api.get(`/activos/sugerencias/${encodeURIComponent(serieBusqueda)}`);
          if (res.data && res.data.length > 0) {
            setSugerencias(res.data);
            setMostrarSugerencias(true);
          } else {
            setSugerencias([]);
            setMostrarSugerencias(false);
          }
        } catch (e) {
          console.error("Error buscando sugerencias", e);
        }
      } else {
        setSugerencias([]);
        setMostrarSugerencias(false);
      }
    };
    
    const debounceTimeout = setTimeout(fetchSugerencias, 300);
    return () => clearTimeout(debounceTimeout);
  }, [serieBusqueda]);

  const agregarActivo = (activo: Activo) => {
    if (activo.estado !== 'Disponible') {
      setError(`El activo ${activo.serie} no está disponible.`);
      setMostrarSugerencias(false);
      return;
    }
    if (activosAsignados.find(a => a.id === activo.id)) {
      setError('El activo ya está en la lista.');
      setMostrarSugerencias(false);
      return;
    }
    setActivosAsignados([...activosAsignados, activo]);
    setSerieBusqueda('');
    setSugerencias([]);
    setMostrarSugerencias(false);
    setError('');
  };

  const buscarActivoExacto = async () => {
    if (!serieBusqueda) return;
    try {
      const res = await api.get(`/activos/buscar/${encodeURIComponent(serieBusqueda)}`);
      if (res.data) {
        agregarActivo(res.data);
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

  const actualizarObservacion = (id: number, texto: string) => {
    setActivosAsignados(activosAsignados.map(a => 
      a.id === id ? { ...a, observaciones: texto } : a
    ));
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
    if (tipoEntrega === 'prestamo' && !fechaDevolucion) {
      setError('Especifique la fecha estimada de devolución.');
      return;
    }

    const prestamoData = {
      usuario_id: usuarioSeleccionado,
      activos: activosAsignados,
      fecha_prestamo: fechaEntrega,
      fecha_devolucion: tipoEntrega === 'prestamo' ? fechaDevolucion : null
    };
    sessionStorage.setItem('nuevoPrestamo', JSON.stringify(prestamoData));
    router.push('/prestamos/nuevo/firma');
  };

  return (
    <div className="max-w-6xl mx-auto w-full pb-12 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-indigo-600 text-white p-6 rounded-t-2xl shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        <div className="relative z-10 flex items-center space-x-3">
          <div className="p-2 bg-indigo-500 rounded-lg">
            <Box size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Nueva Entrega</h1>
            <p className="text-indigo-200 text-sm">Asigna activos o registra un nuevo préstamo temporal</p>
          </div>
        </div>
        <button onClick={handleSiguiente} className="relative z-10 flex items-center space-x-2 bg-white text-indigo-700 px-5 py-2 rounded-xl font-semibold shadow-sm hover:shadow-md hover:bg-indigo-50 transition-all active:scale-95">
          <span>Siguiente</span>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="bg-slate-50/50 p-6 md:p-8 space-y-8 rounded-b-2xl shadow-md border border-slate-200/60 border-t-0">
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center space-x-3 shadow-sm animate-in slide-in-from-top-2">
            <div className="p-1 bg-red-100 rounded-full"><Box size={16} /></div>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Sección: Datos del Gestor (ReadOnly) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-400"></div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
            <User size={16} className="mr-2" /> Datos del Gestor (Responsable)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nombre</label>
              <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium">
                {usuarios.find(u => u.id === user?.id)?.nombre || user?.nombre || 'Cargando...'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Área</label>
              <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium">
                {usuarios.find(u => u.id === user?.id)?.area?.nombre || '-'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Cargo</label>
              <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium">
                {usuarios.find(u => u.id === user?.id)?.cargo?.nombre || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Datos del Usuario Receptor */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
              <User size={20} className="mr-2 text-blue-500" /> Receptor del Activo
            </h2>
            <button onClick={cargarCatalogos} className="flex items-center space-x-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
              <RefreshCw size={14} />
              <span>Recargar Catálogos</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Buscador DNI */}
            <div className="col-span-1 md:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Buscar por DNI</label>
              <div className="flex shadow-sm rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/30 transition-shadow">
                <input 
                  type="text" 
                  value={dniBusqueda} 
                  onChange={(e) => setDniBusqueda(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && buscarDni()}
                  placeholder="Ej. 70123456"
                  maxLength={8} pattern="\d{8}" title="El DNI debe tener 8 dígitos numéricos"
                  className="flex-1 px-4 py-2.5 outline-none text-sm border-y border-l border-slate-300"
                />
                <button onClick={buscarDni} className="bg-blue-600 text-white px-4 py-2.5 hover:bg-blue-700 transition-colors border border-blue-600">
                  <Search size={18} />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Presiona Enter o el botón para buscar.</p>
            </div>

            {/* Selectores */}
            <div className="col-span-1 md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center">
                  Personal *
                </label>
                <select value={usuarioSeleccionado} onChange={handleUsuarioChange} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                  <option value="">-- Seleccionar --</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center">
                  <Building2 size={14} className="mr-1" /> Empresa
                </label>
                <select value={empresaId} disabled className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed appearance-none">
                  <option value="">-</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center">
                  <MapPin size={14} className="mr-1" /> Sede
                </label>
                <select value={sedeId} disabled className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed appearance-none">
                  <option value="">-</option>
                  {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center">
                  <Briefcase size={14} className="mr-1" /> Gerencia
                </label>
                <select value={gerenciaId} disabled className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed appearance-none">
                  <option value="">-</option>
                  {gerencias.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center">
                  <Briefcase size={14} className="mr-1" /> Área
                </label>
                <select value={areaId} disabled className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed appearance-none">
                  <option value="">-</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center">
                  <Briefcase size={14} className="mr-1" /> Cargo
                </label>
                <select value={cargoId} disabled className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed appearance-none">
                  <option value="">-</option>
                  {cargos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Detalles de la Entrega */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center mb-6">
            <Calendar size={20} className="mr-2 text-amber-500" /> Detalles de la Entrega
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Tipo de Entrega</label>
              <select value={tipoEntrega} onChange={(e) => setTipoEntrega(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-sm transition-all font-medium">
                <option value="prestamo">Préstamo Temporal</option>
                <option value="permanente">Asignación Permanente</option>
              </select>
            </div>
            
            <div className="p-4">
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Fecha de Entrega</label>
              <input type="date" value={fechaEntrega} readOnly className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-500 rounded-xl text-sm font-medium outline-none cursor-not-allowed" />
            </div>
            
            {tipoEntrega === 'prestamo' && (
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                <label className="block text-xs font-bold text-amber-800 mb-2 uppercase tracking-wide">Fecha Est. Devolución *</label>
                <input type="date" value={fechaDevolucion} onChange={(e) => setFechaDevolucion(e.target.value)} className="w-full px-4 py-2.5 border border-amber-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 shadow-sm transition-all bg-white" />
              </div>
            )}
          </div>
        </div>

        {/* Sección: Activos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center mb-6">
            <Monitor size={20} className="mr-2 text-emerald-500" /> Selección de Activos
          </h2>
          
          {/* Autocomplete Search */}
          <div className="mb-6 relative" ref={sugerenciasRef}>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
              Buscar equipo por Serie, IMEI, Marca o Modelo
            </label>
            <div className="flex max-w-2xl shadow-sm rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/30 transition-shadow bg-white">
              <div className="pl-4 flex items-center bg-white border-y border-l border-slate-300 rounded-l-xl">
                <Search size={18} className="text-slate-400" />
              </div>
              <input 
                type="text" 
                value={serieBusqueda}
                onChange={(e) => setSerieBusqueda(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscarActivoExacto()}
                placeholder="Escribe al menos 2 caracteres..."
                className="flex-1 px-3 py-3 outline-none text-sm border-y border-r border-slate-300 rounded-r-xl"
              />
            </div>
            
            {/* Dropdown de Sugerencias */}
            {mostrarSugerencias && sugerencias.length > 0 && (
              <div className="absolute z-50 mt-2 w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-top-2">
                <ul className="max-h-64 overflow-y-auto">
                  {sugerencias.map((activo) => (
                    <li 
                      key={activo.id} 
                      onClick={() => agregarActivo(activo)}
                      className="px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-emerald-50 cursor-pointer flex justify-between items-center transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-700">{activo.tipo} - <span className="font-medium text-slate-500">{activo.marca} {activo.modelo}</span></div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">SN/IMEI: {activo.serie}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-lg">{activo.estado}</span>
                        <ChevronRight size={16} className="text-slate-400" />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {mostrarSugerencias && sugerencias.length === 0 && serieBusqueda.length >= 2 && (
              <div className="absolute z-50 mt-2 w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 p-4 text-center text-slate-500 text-sm">
                No se encontraron equipos disponibles con "{serieBusqueda}"
              </div>
            )}
          </div>

          {/* Tabla de Activos */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-4 w-12 text-center">Acción</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Marca/Modelo</th>
                  <th className="p-4">Serie/IMEI</th>
                  <th className="p-4 text-center">Condición</th>
                  <th className="p-4">Observaciones a la Entrega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activosAsignados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center bg-slate-50/50">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-3">
                          <Box size={24} className="text-slate-300" />
                        </div>
                        <p className="font-semibold text-slate-500">Aún no hay equipos en la lista</p>
                        <p className="text-xs mt-1">Usa el buscador de arriba para agregar activos a esta entrega.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  activosAsignados.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => quitarActivo(a.id)} 
                          className="text-slate-300 group-hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                          title="Remover de la lista"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                      <td className="p-4 font-bold text-slate-700 flex items-center space-x-2">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span>{a.tipo}</span>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{a.marca} {a.modelo}</td>
                      <td className="p-4 text-slate-500 font-mono text-xs bg-slate-50 rounded-md px-2 py-1 my-3 inline-block border border-slate-200">{a.serie}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wider
                          ${a.condicion === 'Nuevo' ? 'bg-green-100 text-green-700 border border-green-200' : 
                            a.condicion === 'Usado' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                            'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          {a.condicion || a.estado}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 truncate max-w-[200px] text-xs">
                        <input
                          type="text"
                          value={a.observaciones || ''}
                          onChange={(e) => actualizarObservacion(a.id, e.target.value)}
                          placeholder="Ej. Pantalla con rasguño..."
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-md outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-6 flex justify-between items-center px-4">
        <button onClick={() => router.push('/prestamos')} className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-800 text-slate-600 rounded-xl text-sm font-bold transition-all shadow-sm">
          Cancelar
        </button>
        <button onClick={handleSiguiente} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center space-x-2">
          <span>Continuar al Resumen</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
