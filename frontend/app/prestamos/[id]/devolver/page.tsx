"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, PenTool } from 'lucide-react';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';
import { api, Prestamo } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function DevolverPrestamo() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!user || user.rol_id === 3)) {
      router.replace('/prestamos');
    }
  }, [user, isLoading, router]);

  const sigCanvas = useRef<SignatureCanvas>(null);
  
  const [loading, setLoading] = useState(false);
  const [prestamo, setPrestamo] = useState<Prestamo | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (params.id) {
      api.get(`/prestamos/${params.id}`).then(res => {
        setPrestamo(res.data);
      }).catch(err => {
        console.error("Error al obtener préstamo", err);
        alert("No se pudo cargar el préstamo.");
        router.push('/prestamos');
      }).finally(() => {
        setFetching(false);
      });
    }
  }, [params.id, router]);

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sigCanvas.current?.isEmpty()) {
      alert("Por favor, proporcione una firma digital de devolución.");
      return;
    }

    setLoading(true);
    
    // Obtener la firma en Base64
    const firmaDevolucion = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');

    try {
      await api.post(`/prestamos/${params.id}/devolver`, {
        firma_devolucion: firmaDevolucion
      });
      alert("Devolución registrada exitosamente.");
      router.push('/prestamos');
    } catch (error) {
      console.error(error);
      const errMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al procesar la devolución';
      alert(errMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!prestamo) return null;

  return (
    <div className="max-w-4xl mx-auto w-full pb-12">
      <Link href="/prestamos" className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
        <ArrowLeft size={20} className="mr-2" />
        Volver a préstamos
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-emerald-50/50">
          <h1 className="text-2xl font-bold text-slate-800">Confirmar Devolución</h1>
          <p className="text-slate-500 mt-1">Firma la conformidad de recepción del activo devuelto</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Detalles */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Resumen del Activo</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Equipo a devolver</p>
                  <p className="font-semibold text-slate-800">{prestamo.activo?.tipo} {prestamo.activo?.marca} {prestamo.activo?.modelo}</p>
                  <p className="text-sm text-slate-600">Serie: {prestamo.activo?.serie}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">Usuario Responsable</p>
                  <p className="font-semibold text-slate-800">{prestamo.usuario?.nombre}</p>
                  <p className="text-sm text-slate-600">{prestamo.usuario?.correo}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">Fecha Límite de Devolución</p>
                  <p className="font-semibold text-slate-800">{new Date(prestamo.fecha_devolucion).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Firma */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Firma de Devolución</h2>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <PenTool size={16} />
                  Firma (Usuario / Receptor)
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
                <p className="text-xs text-slate-500 mt-2">Dibuja la firma en el recuadro superior para confirmar la devolución en buen estado.</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button disabled={loading} type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Save size={20} />
              )}
              {loading ? 'Procesando...' : 'Confirmar Devolución'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
