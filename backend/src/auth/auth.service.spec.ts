import { Injectable, UnauthorizedException } from '@nestjs/common';
// Servicio para buscar usuarios
import { UsuariosService } from '../usuarios/usuarios.service';
// Servicio para conectarse a MySQL
import { PrismaService } from '../prisma/prisma.service';
// Librería para encriptar contraseñas
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    // Inyectamos servicio de usuarios
    private usuariosService: UsuariosService,

    // Inyectamos prisma
    private prisma: PrismaService,
  ) {}

  // REGISTRAR USUARIO
  async register(data: any) {
    // Encriptar contraseña
    const hash = await bcrypt.hash(data.contraseña, 10);

    // Crear usuario en base de datos
    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: data.nombre,
        correo: data.correo,
        contraseña: hash,
        rol_id: data.rol_id,
      },
    });

    return {
      mensaje: 'Usuario creado',
      usuario,
    };
  }

  // LOGIN
  async login(correo: string) {
    // Buscar usuario por correo
    const usuario = await this.usuariosService.findByEmail(correo);

    // Si no existe
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      mensaje: 'Login correcto',
      usuario,
    };
  }
}
