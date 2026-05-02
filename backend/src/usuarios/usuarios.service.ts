import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(correo: string) {
    return this.prisma.usuario.findUnique({
      where: { correo },
    });
  }

  async findAll() {
    return this.prisma.usuario.findMany({
      include: {
        rol: true,
        empresa: true,
        area: true,
        cargo: true,
        gerencia: true,
        sede: true,
      },
      orderBy: { id: 'desc' }
    });
  }

  async findOne(id: number) {
    return this.prisma.usuario.findUnique({
      where: { id },
      include: {
        rol: true,
        empresa: true,
        area: true,
        cargo: true,
        gerencia: true,
        sede: true,
      }
    });
  }

  async create(data: any) {
    // Verificar si el correo ya existe
    const existing = await this.findByEmail(data.correo);
    if (existing) {
      throw new BadRequestException('El correo ya está en uso');
    }

    const hash = await bcrypt.hash(data.contraseña, 10);
    
    return this.prisma.usuario.create({
      data: {
        nombre: data.nombre,
        correo: data.correo,
        contraseña: hash,
        rol_id: data.rol_id,
        empresa_id: data.empresa_id,
        area_id: data.area_id,
        cargo_id: data.cargo_id,
        gerencia_id: data.gerencia_id,
        sede_id: data.sede_id,
        activo: data.activo ?? true,
      }
    });
  }

  async update(id: number, data: any) {
    const updateData: any = { ...data };
    
    if (data.contraseña) {
      updateData.contraseña = await bcrypt.hash(data.contraseña, 10);
    }

    return this.prisma.usuario.update({
      where: { id },
      data: updateData
    });
  }

  async remove(id: number) {
    // Eliminación lógica (desactivar)
    return this.prisma.usuario.update({
      where: { id },
      data: { activo: false }
    });
  }
}
