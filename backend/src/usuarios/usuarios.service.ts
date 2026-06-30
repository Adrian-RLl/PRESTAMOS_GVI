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
    if (!data.nombre || data.nombre.trim() === '') {
      throw new BadRequestException('El nombre es obligatorio y no puede estar vacío.');
    }
    
    if (data.dni && !/^\d{8}$/.test(String(data.dni))) {
      throw new BadRequestException('El DNI debe tener exactamente 8 números.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.correo && !emailRegex.test(data.correo)) {
      throw new BadRequestException('El correo corporativo no tiene un formato válido.');
    }
    if (data.correo_personal && !emailRegex.test(data.correo_personal)) {
      throw new BadRequestException('El correo personal no tiene un formato válido.');
    }

    const phoneRegex = /^\d{9}$/;
    if (data.telefono_personal && !phoneRegex.test(data.telefono_personal)) {
      throw new BadRequestException('El teléfono personal debe tener 9 dígitos numéricos.');
    }
    if (data.celular_personal && !phoneRegex.test(data.celular_personal)) {
      throw new BadRequestException('El celular personal debe tener 9 dígitos numéricos.');
    }
    if (data.celular_empresa && !phoneRegex.test(data.celular_empresa)) {
      throw new BadRequestException('El celular empresa debe tener 9 dígitos numéricos.');
    }

    // Verificar si el correo ya existe
    if (data.correo) {
      const existing = await this.findByEmail(data.correo);
      if (existing) {
        throw new BadRequestException('El correo ya está en uso por otro usuario.');
      }
    }

    // Verificar si el DNI ya existe (si se proporcionó)
    if (data.dni) {
      const existingDni = await this.findByDni(data.dni);
      if (existingDni) {
        throw new BadRequestException('El DNI ya está en uso');
      }
    }

    // Auto-create catalogs if string names are provided
    if (data.empresa && typeof data.empresa === 'string') {
      let res = await this.prisma.empresa.findFirst({ where: { nombre: data.empresa } });
      if (!res) res = await this.prisma.empresa.create({ data: { nombre: data.empresa, estado: true } });
      data.empresa_id = res.id;
    }
    if (data.gerencia && typeof data.gerencia === 'string') {
      let res = await this.prisma.gerencia.findFirst({ where: { nombre: data.gerencia } });
      if (!res) res = await this.prisma.gerencia.create({ data: { nombre: data.gerencia, estado: true } });
      data.gerencia_id = res.id;
    }
    if (data.sede && typeof data.sede === 'string') {
      let res = await this.prisma.sede.findFirst({ where: { nombre: data.sede } });
      if (!res) res = await this.prisma.sede.create({ data: { nombre: data.sede, estado: true } });
      data.sede_id = res.id;
    }
    if (data.area && typeof data.area === 'string') {
      let res = await this.prisma.area.findFirst({ where: { nombre: data.area } });
      if (!res) res = await this.prisma.area.create({ data: { nombre: data.area, estado: true } });
      data.area_id = res.id;
    }
    if (data.cargo && typeof data.cargo === 'string') {
      let res = await this.prisma.cargo.findFirst({ where: { nombre: data.cargo } });
      if (!res) res = await this.prisma.cargo.create({ data: { nombre: data.cargo, estado: true } });
      data.cargo_id = res.id;
    }

    const hash = await bcrypt.hash(data.contraseña, 10);

    return this.prisma.usuario.create({
      data: {
        dni: data.dni,
        nombre: data.nombre,
        nombres: data.nombres,
        apellido_paterno: data.apellido_paterno,
        apellido_materno: data.apellido_materno,
        correo: data.correo || null,
        correo_personal: data.correo_personal,
        telefono_personal: data.telefono_personal,
        celular_personal: data.celular_personal,
        celular_empresa: data.celular_empresa,
        genero: data.genero,
        contraseña: hash,
        rol_id: data.rol_id,
        empresa_id: data.empresa_id ? Number(data.empresa_id) : null,
        area_id: data.area_id ? Number(data.area_id) : null,
        cargo_id: data.cargo_id ? Number(data.cargo_id) : null,
        gerencia_id: data.gerencia_id ? Number(data.gerencia_id) : null,
        sede_id: data.sede_id ? Number(data.sede_id) : null,
        activo: data.activo ?? true,
      },
    });
  }

  async createBatch(dataArray: any[]) {
    try {
      let createdCount = 0;
      let updatedCount = 0;

      for (const data of dataArray) {
        let empresa_id: number | null = null;
        let gerencia_id: number | null = null;
        let sede_id: number | null = null;
        let area_id: number | null = null;
        let cargo_id: number | null = null;

        // Buscar IDs por nombre en Prisma, si no existen, los creamos
        if (data.empresa) {
          let res = await this.prisma.empresa.findFirst({ where: { nombre: data.empresa } });
          if (!res) res = await this.prisma.empresa.create({ data: { nombre: data.empresa, estado: true } });
          empresa_id = res.id;
        } else if (data.empresa_id) {
          empresa_id = Number(data.empresa_id);
        }

        if (data.gerencia) {
          let res = await this.prisma.gerencia.findFirst({ where: { nombre: data.gerencia } });
          if (!res) res = await this.prisma.gerencia.create({ data: { nombre: data.gerencia, estado: true } });
          gerencia_id = res.id;
        } else if (data.gerencia_id) {
          gerencia_id = Number(data.gerencia_id);
        }

        if (data.sede) {
          let res = await this.prisma.sede.findFirst({ where: { nombre: data.sede } });
          if (!res) res = await this.prisma.sede.create({ data: { nombre: data.sede, estado: true } });
          sede_id = res.id;
        } else if (data.sede_id) {
          sede_id = Number(data.sede_id);
        }

        if (data.area) {
          let res = await this.prisma.area.findFirst({ where: { nombre: data.area } });
          if (!res) res = await this.prisma.area.create({ data: { nombre: data.area, estado: true } });
          area_id = res.id;
        } else if (data.area_id) {
          area_id = Number(data.area_id);
        }

        if (data.cargo) {
          let res = await this.prisma.cargo.findFirst({ where: { nombre: data.cargo } });
          if (!res) res = await this.prisma.cargo.create({ data: { nombre: data.cargo, estado: true } });
          cargo_id = res.id;
        } else if (data.cargo_id) {
          cargo_id = Number(data.cargo_id);
        }

        const nombreCompleto = data.nombre || `${data.nombres || ''} ${data.apellido_paterno || ''} ${data.apellido_materno || ''}`.trim();
        const hash = data.contraseña ? await bcrypt.hash(data.contraseña, 10) : await bcrypt.hash(data.dni || '123456', 10);

        const resolvedData = {
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
          rol_id: data.rol_id || 3,
          empresa_id,
          gerencia_id,
          sede_id,
          area_id,
          cargo_id,
          activo: data.activo !== undefined ? data.activo : true,
        };

        let existing: any = null;
        if (resolvedData.dni) {
          existing = await this.prisma.usuario.findUnique({ where: { dni: resolvedData.dni } });
        }
        if (!existing && resolvedData.correo) {
          existing = await this.prisma.usuario.findUnique({ where: { correo: resolvedData.correo } });
        }

        if (existing) {
          await this.prisma.usuario.update({
            where: { id: existing.id },
            data: resolvedData,
          });
          updatedCount++;
        } else {
          await this.prisma.usuario.create({ data: resolvedData });
          createdCount++;
        }
      }

      return { success: true, count: createdCount + updatedCount, created: createdCount, updated: updatedCount };
    } catch (error) {
      console.error("Error en importación masiva de usuarios:", error);
      throw new BadRequestException(
        'Error al importar usuarios masivamente. Verifique el formato y datos duplicados.',
      );
    }
  }

  async update(id: number, data: any) {
    if (data.nombre !== undefined && data.nombre.trim() === '') {
      throw new BadRequestException('El nombre no puede estar vacío.');
    }
    
    if (data.dni && !/^\d{8}$/.test(String(data.dni))) {
      throw new BadRequestException('El DNI debe tener exactamente 8 números.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.correo && !emailRegex.test(data.correo)) {
      throw new BadRequestException('El correo corporativo no tiene un formato válido.');
    }
    if (data.correo_personal && !emailRegex.test(data.correo_personal)) {
      throw new BadRequestException('El correo personal no tiene un formato válido.');
    }

    const phoneRegex = /^\d{9}$/;
    if (data.telefono_personal && !phoneRegex.test(data.telefono_personal)) {
      throw new BadRequestException('El teléfono personal debe tener 9 dígitos numéricos.');
    }
    if (data.celular_personal && !phoneRegex.test(data.celular_personal)) {
      throw new BadRequestException('El celular personal debe tener 9 dígitos numéricos.');
    }
    if (data.celular_empresa && !phoneRegex.test(data.celular_empresa)) {
      throw new BadRequestException('El celular empresa debe tener 9 dígitos numéricos.');
    }

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

    // Auto-create catalogs if string names are provided
    if (updateData.empresa && typeof updateData.empresa === 'string') {
      let res = await this.prisma.empresa.findFirst({ where: { nombre: updateData.empresa } });
      if (!res) res = await this.prisma.empresa.create({ data: { nombre: updateData.empresa, estado: true } });
      updateData.empresa_id = res.id;
      delete updateData.empresa;
    }
    if (updateData.gerencia && typeof updateData.gerencia === 'string') {
      let res = await this.prisma.gerencia.findFirst({ where: { nombre: updateData.gerencia } });
      if (!res) res = await this.prisma.gerencia.create({ data: { nombre: updateData.gerencia, estado: true } });
      updateData.gerencia_id = res.id;
      delete updateData.gerencia;
    }
    if (updateData.sede && typeof updateData.sede === 'string') {
      let res = await this.prisma.sede.findFirst({ where: { nombre: updateData.sede } });
      if (!res) res = await this.prisma.sede.create({ data: { nombre: updateData.sede, estado: true } });
      updateData.sede_id = res.id;
      delete updateData.sede;
    }
    if (updateData.area && typeof updateData.area === 'string') {
      let res = await this.prisma.area.findFirst({ where: { nombre: updateData.area } });
      if (!res) res = await this.prisma.area.create({ data: { nombre: updateData.area, estado: true } });
      updateData.area_id = res.id;
      delete updateData.area;
    }
    if (updateData.cargo && typeof updateData.cargo === 'string') {
      let res = await this.prisma.cargo.findFirst({ where: { nombre: updateData.cargo } });
      if (!res) res = await this.prisma.cargo.create({ data: { nombre: updateData.cargo, estado: true } });
      updateData.cargo_id = res.id;
      delete updateData.cargo;
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
