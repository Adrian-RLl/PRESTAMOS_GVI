import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3001', // El backend corre en el puerto 3001
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Activo {
  id: number;
  codigo_patrimonial: string;
  tipo: string;
  marca: string;
  modelo: string;
  serie: string;
  estado: string;
  ubicacion: string;
  observaciones?: string;
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
  usuario?: Usuario;
  activo?: Activo;
}
