"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ClipboardList, Users, LogOut, Menu, X, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const mainNavItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Activos', href: '/activos', icon: Package },
  { name: 'Personal', href: '/personal', icon: Users },
  { name: 'Préstamos', href: '/prestamos', icon: ClipboardList },
];

const maintenanceItems = [
  { name: 'Mantenimiento', href: '/mantenimiento', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // No mostrar sidebar en login
  if (pathname === '/login') return null;

  // Solo Administrador (1) y Analista TI (2) ven Mantenimiento
  const canViewMaintenance = user && (user.rol_id === 1 || user.rol_id === 2);
  const navItems = canViewMaintenance ? [...mainNavItems, ...maintenanceItems] : mainNavItems;

  return (
    <>
      {/* Botón hamburguesa para móvil */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-slate-900 text-white rounded-lg shadow-lg"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay oscuro para móvil */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar principal */}
      <div className={`fixed md:static inset-y-0 left-0 z-40 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-slate-900 text-white min-h-screen flex flex-col shadow-xl`}>
        <div className="p-6 mt-12 md:mt-0">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            VGI Préstamos
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-blue-200' : 'text-slate-400'} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800">
          {user && (
            <div className="mb-4 px-4 py-2 bg-slate-800/50 rounded-xl">
              <p className="text-sm text-slate-400">Usuario</p>
              <p className="font-medium truncate">{user.nombre}</p>
            </div>
          )}
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}
