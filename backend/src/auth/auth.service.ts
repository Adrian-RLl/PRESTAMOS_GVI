import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: any) {
    const hash = await bcrypt.hash(data.contraseña, 10);

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
      usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo },
    };
  }

  async login(correo: string, pass: string) {
    const usuario = await this.usuariosService.findByEmail(correo);

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    if (!usuario.activo) {
      throw new UnauthorizedException('Su cuenta ha sido desactivada');
    }

    const isMatch = await bcrypt.compare(pass, usuario.contraseña);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: usuario.id, email: usuario.correo, rol: usuario.rol_id };
    const token = await this.jwtService.signAsync(payload);

    return {
      mensaje: 'Login correcto',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol_id: usuario.rol_id,
        activo: usuario.activo,
      }
    };
  }
}
