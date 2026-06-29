"use client";

import { toast } from 'react-hot-toast';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, PenTool, CheckCircle } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { api, Activo, Usuario } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function FirmaPrestamo() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!user || user.rol_id === 3)) {
      router.replace('/prestamos');
    }
  }, [user, isLoading, router]);

  const sigCanvas = useRef<SignatureCanvas>(null);
  
  const [loading, setLoading] = useState(false);
  const [prestamoData, setPrestamoData] = useState<{
    usuario_id: string;
    activos: Activo[];
    fecha_prestamo: string;
    fecha_devolucion: string;
  } | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    const dataStr = sessionStorage.getItem('nuevoPrestamo');
    if (!dataStr) {
      router.push('/prestamos/nuevo');
      return;
    }
    const data = JSON.parse(dataStr);
    Promise.resolve().then(() => {
      setPrestamoData(data);
    });

    // Fetch user details for the document
    api.get(`/usuarios/${data.usuario_id}`).then(res => {
      setUsuario(res.data);
    }).catch(err => {
      console.error("Error al cargar usuario", err);
    });
  }, [router]);

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prestamoData) return;
    if (sigCanvas.current?.isEmpty()) {
      toast.error("Por favor, proporcione una firma digital.");
      return;
    }

    setLoading(true);
    const firmaDigital = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');

    try {
      await api.post('/prestamos', {
        usuario_id: parseInt(prestamoData.usuario_id),
        activos_ids: prestamoData.activos.map((a: Activo) => a.id),
        fecha_prestamo: new Date(prestamoData.fecha_prestamo).toISOString(),
        fecha_devolucion: prestamoData.fecha_devolucion ? new Date(prestamoData.fecha_devolucion).toISOString() : null,
        firma_digital: firmaDigital,
        activos_observaciones: prestamoData.activos.reduce((acc, activo) => {
          if (activo.observaciones) acc[activo.id] = activo.observaciones;
          return acc;
        }, {} as Record<string, string>)
      });
      sessionStorage.removeItem('nuevoPrestamo');
      router.push('/prestamos');
    } catch (error) {
      console.error(error);
      toast.error('Error al registrar el préstamo');
    } finally {
      setLoading(false);
    }
  };

  if (!prestamoData || !usuario) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full pb-12">
      <button onClick={() => router.push('/prestamos/nuevo')} className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
        <ArrowLeft size={20} className="mr-2" />
        Volver a la selección de activos
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50">
          <h1 className="text-2xl font-bold text-slate-800">Firma de Declaración Jurada</h1>
          <p className="text-slate-500 mt-1">Revisa los activos asignados y firma de conformidad</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Documento Resumen */}
          <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 text-sm text-slate-700 leading-relaxed">
            <h3 className="text-lg font-bold text-center mb-4 text-slate-800">ACTA DE ENTREGA DE ACTIVOS</h3>
            
            <p className="mb-4">
              Conste por el presente documento que, con fecha <strong>{new Date(prestamoData.fecha_prestamo).toLocaleDateString('es-PE', { timeZone: 'UTC' })}</strong>, 
              se hace entrega formal de los siguientes activos propiedad de VGI a:
            </p>

            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li><strong>Nombre:</strong> {usuario.nombre}</li>
              <li><strong>DNI:</strong> {usuario.dni || '-'}</li>
              <li><strong>Área:</strong> {usuario.area?.nombre || '-'}</li>
              <li><strong>Cargo:</strong> {usuario.cargo?.nombre || '-'}</li>
            </ul>

            <h4 className="font-bold mt-4 mb-2">Activos Asignados:</h4>
            <div className="overflow-hidden border border-slate-200 rounded-lg mb-4">
              <table className="w-full text-left text-xs bg-white">
                <thead className="bg-slate-100 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2">Tipo</th>
                    <th className="p-2">Marca/Modelo</th>
                    <th className="p-2">Serie/IMEI</th>
                  </tr>
                </thead>
                <tbody>
                  {prestamoData.activos.map((a: Activo, index: number) => (
                    <tr key={a.id} className="border-b border-slate-100 last:border-0">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{a.tipo}</td>
                      <td className="p-2">{a.marca} {a.modelo}</td>
                      <td className="p-2">{a.serie}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-100 flex items-start space-x-3">
              <CheckCircle size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">
                Declaro haber recibido los activos listados en perfectas condiciones de funcionamiento. 
                {prestamoData.fecha_devolucion 
                  ? ` Me comprometo a cuidarlos y devolverlos a más tardar el ${new Date(prestamoData.fecha_devolucion).toLocaleDateString('es-PE', { timeZone: 'UTC' })}. `
                  : ` Me comprometo a cuidarlos mientras dure esta asignación permanente. `}
                En caso de pérdida o daño por negligencia, asumo la responsabilidad correspondiente.
              </p>
            </div>
          </div>

          {/* Firma Digital */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <PenTool size={18} />
              Firma Digital
            </h2>
            
            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 relative overflow-hidden group">
              <SignatureCanvas 
                ref={sigCanvas} 
                canvasProps={{className: 'w-full h-64 cursor-crosshair'}} 
                penColor="black"
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={clearSignature} className="bg-white text-slate-500 hover:text-red-500 px-3 py-1 rounded-lg text-sm shadow-sm border border-slate-200 font-medium transition-colors">
                  Limpiar
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center">Dibuja tu firma en el recuadro superior usando el ratón o pantalla táctil.</p>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button disabled={loading} type="submit" className="bg-slate-700 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Save size={20} />
              )}
              {loading ? 'Procesando...' : 'Confirmar y Guardar Préstamo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
