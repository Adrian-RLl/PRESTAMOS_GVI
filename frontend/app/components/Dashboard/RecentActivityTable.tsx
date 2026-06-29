import React from 'react';


interface Activity {
  id: number;
  fecha_prestamo: string;
  estado: string;
  usuario: {
    nombre: string;
  };
  activo: {
    serie: string;
    tipo: string;
    marca: string;
  };
}

interface RecentActivityTableProps {
  activities: Activity[];
}

export function RecentActivityTable({ activities }: RecentActivityTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activo': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Devuelto': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pendiente': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col h-full">
      <h3 className="text-xl font-bold text-slate-800 mb-6">Actividad Reciente</h3>
      
      {activities.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          No hay actividad reciente
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-sm">
                <th className="pb-3 font-semibold">Usuario</th>
                <th className="pb-3 font-semibold">Activo</th>
                <th className="pb-3 font-semibold">Fecha</th>
                <th className="pb-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="py-4 text-slate-800 font-medium">{activity.usuario.nombre}</td>
                  <td className="py-4">
                    <div className="text-slate-800 font-medium">{activity.activo.tipo}</div>
                    <div className="text-xs text-slate-500">S/N: {activity.activo.serie}</div>
                  </td>
                  <td className="py-4 text-slate-600 text-sm">
                    {new Date(activity.fecha_prestamo).toLocaleDateString('es-PE', { timeZone: 'UTC' })}
                  </td>
                  <td className="py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusColor(activity.estado)}`}>
                      {activity.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
