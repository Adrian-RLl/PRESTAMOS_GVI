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
      orderBy: { id: 'desc' },
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
      },
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
      },
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
      },
    });
  }

  async createBatch(dataArray: any[]) {
    // Resolviendo nombres de catálogos a IDs correspondientes
    const resolvedDataArray = await Promise.all(
      dataArray.map(async (data) => {
        let empresa_id: number | null = null;
        let gerencia_id: number | null = null;
        let sede_id: number | null = null;
        let area_id: number | null = null;
        let cargo_id: number | null = null;

        // Buscar IDs por nombre en Prisma
        if (data.empresa) {
          const res = await this.prisma.empresa.findFirst({
            where: { nombre: data.empresa },
          });
          if (res) empresa_id = res.id;
        } else if (data.empresa_id) {
          empresa_id = Number(data.empresa_id);
        }

        if (data.gerencia) {
          const res = await this.prisma.gerencia.findFirst({
            where: { nombre: data.gerencia },
          });
          if (res) gerencia_id = res.id;
        } else if (data.gerencia_id) {
          gerencia_id = Number(data.gerencia_id);
        }

        if (data.sede) {
          const res = await this.prisma.sede.findFirst({
            where: { nombre: data.sede },
          });
          if (res) sede_id = res.id;
        } else if (data.sede_id) {
          sede_id = Number(data.sede_id);
        }

        if (data.area) {
          const res = await this.prisma.area.findFirst({
            where: { nombre: data.area },
          });
          if (res) area_id = res.id;
        } else if (data.area_id) {
          area_id = Number(data.area_id);
        }

        if (data.cargo) {
          const res = await this.prisma.cargo.findFirst({
            where: { nombre: data.cargo },
          });
          if (res) cargo_id = res.id;
        } else if (data.cargo_id) {
          cargo_id = Number(data.cargo_id);
        }

        const nombreCompleto =
          data.nombre ||
          `${data.nombres || ''} ${data.apellido_paterno || ''} ${data.apellido_materno || ''}`.trim();
        const hash = data.contraseña
          ? await bcrypt.hash(data.contraseña, 10)
          : await bcrypt.hash(data.dni || '123456', 10);

        return {
          dni: data.dni ? String(data.dni) : null,
          nombre: nombreCompleto,
          nombres: data.nombres || null,
          apellido_paterno: data.apellido_paterno || null,
          apellido_materno: data.apellido_materno || null,
          correo: data.correo,
          correo_personal: data.correo_personal || null,
          telefono_personal: data.telefono_personal || null,
          celular_personal: data.celular_personal || null,
          celular_empresa: data.celular_empresa || null,
          genero: data.genero || null,
          contraseña: hash,
          rol_id: data.rol_id || 3, // Rol Personal (Usuario normal) por defecto
          empresa_id,
          gerencia_id,
          sede_id,
          area_id,
          cargo_id,
          activo: data.activo !== undefined ? data.activo : true,
        };
      }),
    );

    try {
      const result = await this.prisma.usuario.createMany({
        data: resolvedDataArray,
        skipDuplicates: true, // Salta duplicados de DNI o Correo
      });
      return { success: true, count: result.count };
    } catch (error) {
      throw new BadRequestException(
        'Error al importar usuarios masivamente. Verifique el formato y datos duplicados.',
      );
    }
  }

  async update(id: number, data: any) {
    // Verificar si el correo ya existe en otro usuario
    if (data.correo) {
      const existing = await this.findByEmail(data.correo);
      if (existing && existing.id !== id) {
        throw new BadRequestException(
          'El correo ya está en uso por otro usuario corporativo.',
        );
      }
    }

    // Verificar si el DNI ya existe en otro usuario
    if (data.dni) {
      const existingDni = await this.findByDni(data.dni);
      if (existingDni && existingDni.id !== id) {
        throw new BadRequestException(
          'El DNI ya está en uso por otro usuario.',
        );
      }
    }

    const updateData: any = { ...data };

    if (data.contraseña) {
      updateData.contraseña = await bcrypt.hash(data.contraseña, 10);
    }

    return this.prisma.usuario.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    // Eliminación lógica (desactivar)
    return this.prisma.usuario.update({
      where: { id },
      data: { activo: false },
    });
  }
}
