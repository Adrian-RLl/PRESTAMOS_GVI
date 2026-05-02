"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Building2, MapPin, Briefcase, Network, Layers } from 'lucide-react';

const navItems = [
  { name: 'Usuarios', href: '/mantenimiento/usuarios', icon: Users },
  { name: 'Empresas', href: '/mantenimiento/empresas', icon: Building2 },
  { name: 'Gerencias', href: '/mantenimiento/gerencias', icon: Network },
  { name: 'Áreas', href: '/mantenimiento/areas', icon: Layers },
  { name: 'Cargos', href: '/mantenimiento/cargos', icon: Briefcase },
  { name: 'Sedes', href: '/mantenimiento/sedes', icon: MapPin },
];

export default function MantenimientoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Mantenimiento</h1>
          <p className="text-slate-500 mt-1">Gestión de catálogos y usuarios del sistema</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon size={16} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
