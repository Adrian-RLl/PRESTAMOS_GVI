import axios from 'axios';

export const api = axios.create({
  baseURL: typeof window !== 'undefined' ? `http://${window.location.hostname}:3001` : 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token dinámicamente a cada petición
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor para manejar errores globalmente (ej. 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Evitamos reiniciar la página si el 401 proviene del intento de login
      if (error.config && !error.config.url?.includes('/auth/login')) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export interface Activo {
  id: number;
  tipo: string;
  marca: string;
  modelo: string;
  serie: string;
  estado: string;
  condicion?: string;
  vigencia?: string;
  ubicacion: string;
  observaciones?: string;
  orden_compra?: string;
  fecha_creacion?: string;
  prestamos?: Prestamo[];
}

export interface EntidadBase {
  id: number;
  nombre: string;
  estado: boolean;
}

export type Empresa = EntidadBase;
export type Gerencia = EntidadBase;
export type Area = EntidadBase;
export type Cargo = EntidadBase;
export type Sede = EntidadBase;

export interface Usuario {
  id: number;
  dni?: string;
  nombre: string;
  correo: string;
  rol_id: number;
  activo: boolean;
  empresa_id?: number;
  gerencia_id?: number;
  area_id?: number;
  cargo_id?: number;
  sede_id?: number;
  
  // Relaciones
  rol?: { id: number; nombre: string };
  empresa?: Empresa;
  gerencia?: Gerencia;
  area?: Area;
  cargo?: Cargo;
  sede?: Sede;
}

export interface Prestamo {
  id: number;
  usuario_id: number;
  activo_id: number;
  fecha_prestamo: string;
  fecha_devolucion: string;
  estado: string;
  firma_digital?: string;
  firma_devolucion?: string;
  usuario?: Usuario;
  usuario_receptor?: Usuario;
  activo?: Activo;
}
