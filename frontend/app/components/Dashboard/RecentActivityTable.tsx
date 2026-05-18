import React from 'react';


interface Activity {
  id: number;
  fecha_prestamo: string;
  estado: string;
  usuario: {
    nombre: string;
  };
  activo: {
    codigo_patrimonial: string;
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
      case 'Activo': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Devuelto': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Pendiente': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="bg-white/10 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl overflow-hidden flex flex-col h-full">
      <h3 className="text-xl font-bold text-white mb-6">Actividad Reciente</h3>
      
      {activities.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          No hay actividad reciente
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-300 text-sm">
                <th className="pb-3 font-semibold">Usuario</th>
                <th className="pb-3 font-semibold">Activo</th>
                <th className="pb-3 font-semibold">Fecha</th>
                <th className="pb-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="py-4 text-white font-medium">{activity.usuario.nombre}</td>
                  <td className="py-4">
                    <div className="text-white">{activity.activo.tipo}</div>
                    <div className="text-xs text-slate-400">{activity.activo.codigo_patrimonial}</div>
                  </td>
                  <td className="py-4 text-slate-300 text-sm">
                    {new Date(activity.fecha_prestamo).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(activity.estado)}`}>
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
