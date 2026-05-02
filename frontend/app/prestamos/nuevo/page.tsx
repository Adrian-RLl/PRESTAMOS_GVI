"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, PenTool } from 'lucide-react';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';
import { api, Activo, Usuario } from '@/lib/api';

export default function NuevoPrestamo() {
  const router = useRouter();
  const sigCanvas = useRef<SignatureCanvas>(null);
  
  const [loading, setLoading] = useState(false);
  const [activosDisponibles, setActivosDisponibles] = useState<Activo[]>([]);
  // Usar input de número para usuario si no tienes un endpoint de listar usuarios aún
  const [formData, setFormData] = useState({
    usuario_id: '',
    activo_id: '',
    fecha_prestamo: new Date().toISOString().split('T')[0],
    fecha_devolucion: ''
  });

  useEffect(() => {
    // Cargar solo activos en "Stock"
    api.get('/activos').then(res => {
      const stock = res.data.filter((a: Activo) => a.estado === 'Stock');
      setActivosDisponibles(stock);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sigCanvas.current?.isEmpty()) {
      alert("Por favor, proporcione una firma digital.");
      return;
    }

    setLoading(true);
    
    // Obtener la firma en Base64
    const firmaDigital = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');

    try {
      await api.post('/prestamos', {
        usuario_id: parseInt(formData.usuario_id),
        activo_id: parseInt(formData.activo_id),
        fecha_prestamo: new Date(formData.fecha_prestamo).toISOString(),
        fecha_devolucion: new Date(formData.fecha_devolucion).toISOString(),
        firma_digital: firmaDigital
      });
      router.push('/prestamos');
    } catch (error) {
      console.error(error);
      alert('Error al registrar el préstamo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-12">
      <Link href="/prestamos" className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
        <ArrowLeft size={20} className="mr-2" />
        Volver a préstamos
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-indigo-50/50">
          <h1 className="text-2xl font-bold text-slate-800">Registrar Nuevo Préstamo</h1>
          <p className="text-slate-500 mt-1">Asigna un activo a un usuario con su firma de conformidad</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Columna Izquierda: Datos del Préstamo */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Datos de Asignación</h2>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Activo (Solo disponibles en Stock)</label>
                <select required name="activo_id" value={formData.activo_id} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white">
                  <option value="" disabled>Seleccione un activo...</option>
                  {activosDisponibles.map(a => (
                    <option key={a.id} value={a.id}>{a.codigo_patrimonial} - {a.tipo} {a.marca}</option>
                  ))}
                </select>
                {activosDisponibles.length === 0 && <p className="text-xs text-red-500 mt-1">No hay activos disponibles en Stock.</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">ID del Usuario Responsable</label>
                <input required type="number" min="1" name="usuario_id" value={formData.usuario_id} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Ej. 1" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Fecha de Préstamo</label>
                <input required type="date" name="fecha_prestamo" value={formData.fecha_prestamo} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Fecha Estimada de Devolución</label>
                <input required type="date" name="fecha_devolucion" value={formData.fecha_devolucion} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
            </div>

            {/* Columna Derecha: Firma Digital */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Firma de Conformidad</h2>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <PenTool size={16} />
                  Firma del Usuario
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 relative overflow-hidden group">
                  <SignatureCanvas 
                    ref={sigCanvas} 
                    canvasProps={{className: 'w-full h-64 cursor-crosshair'}} 
                    penColor="black"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={clearSignature} className="bg-white text-slate-500 hover:text-red-500 px-3 py-1 rounded-lg text-sm shadow-sm border border-slate-200 font-medium">
                      Limpiar
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Dibuja la firma en el recuadro superior usando el ratón o la pantalla táctil.</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button disabled={loading || activosDisponibles.length === 0} type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Save size={20} />
              )}
              {loading ? 'Procesando...' : 'Confirmar Préstamo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
