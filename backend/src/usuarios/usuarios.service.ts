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

  async findByDni(dni: string) {
    return this.prisma.usuario.findUnique({
      where: { dni },
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

    // Verificar si el DNI ya existe (si se proporcionó)
    if (data.dni) {
      const existingDni = await this.findByDni(data.dni);
      if (existingDni) {
        throw new BadRequestException('El DNI ya está en uso');
      }
    }

    const hash = await bcrypt.hash(data.contraseña, 10);
    
    return this.prisma.usuario.create({
      data: {
        dni: data.dni,
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

  async createBatch(dataArray: any[]) {
    // Hash contraseñas para todos los usuarios en el batch
    const hashedDataArray = await Promise.all(
      dataArray.map(async (data) => {
        const hash = data.contraseña ? await bcrypt.hash(data.contraseña, 10) : await bcrypt.hash('123456', 10);
        return {
          dni: data.dni,
          nombre: data.nombre,
          nombres: data.nombres,
          apellido_paterno: data.apellido_paterno,
          apellido_materno: data.apellido_materno,
          correo: data.correo,
          correo_personal: data.correo_personal,
          telefono_personal: data.telefono_personal,
          celular_personal: data.celular_personal,
          celular_empresa: data.celular_empresa,
          genero: data.genero,
          contraseña: hash,
          rol_id: data.rol_id || 2, // Por defecto rol 2 (Usuario)
          empresa_id: data.empresa_id,
          area_id: data.area_id,
          cargo_id: data.cargo_id,
          gerencia_id: data.gerencia_id,
          sede_id: data.sede_id,
          activo: data.activo !== undefined ? data.activo : true,
        };
      })
    );

    // Omitimos validaciones exhaustivas de email/DNI en bulk insert para evitar cuellos de botella, 
    // pero Prisma lanzará error si hay duplicados en unique constraints.
    try {
      const result = await this.prisma.usuario.createMany({
        data: hashedDataArray,
        skipDuplicates: true, // Salta los que ya existen por DNI o Correo
      });
      return { success: true, count: result.count };
    } catch (error) {
      throw new BadRequestException('Error al importar usuarios masivamente. Verifique el formato y datos duplicados.');
    }
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
