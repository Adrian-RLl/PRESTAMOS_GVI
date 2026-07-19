import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UsuariosService {
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}

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

  async findByUsername(username: string) {
    return this.prisma.usuario.findUnique({
      where: { username },
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

    if (data.rol_id === 1 || data.rol_id === 2) {
      if (!data.username || data.username.trim() === '') {
        throw new BadRequestException('El nombre de usuario es obligatorio para cuentas de sistema.');
      }
      const existingUser = await this.findByUsername(data.username);
      if (existingUser) {
        throw new BadRequestException('El nombre de usuario ya está en uso.');
      }
    }

    const tempPassword = crypto.randomBytes(16).toString('hex');
    const hash = await bcrypt.hash(tempPassword, 10);

    let token: string | null = null;
    let expira: Date | null = null;
    if ((data.rol_id === 1 || data.rol_id === 2) && data.correo) {
      token = crypto.randomBytes(32).toString('hex');
      expira = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas para configurarla
    }

    const newUser = await this.prisma.usuario.create({
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
        username: data.username || null,
        rol_id: data.rol_id,
        empresa_id: data.empresa_id ? Number(data.empresa_id) : null,
        area_id: data.area_id ? Number(data.area_id) : null,
        cargo_id: data.cargo_id ? Number(data.cargo_id) : null,
        gerencia_id: data.gerencia_id ? Number(data.gerencia_id) : null,
        sede_id: data.sede_id ? Number(data.sede_id) : null,
        recuperar_token: token,
        recuperar_expira: expira,
        activo: data.activo ?? true,
      },
    });

    if (token && data.correo) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const url = `${frontendUrl}/restablecer-contrasena?token=${token}`;
      try {
        await this.mailerService.sendMail({
          to: data.correo,
          subject: 'Bienvenido - Configura tu contraseña',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 25px; background-color: #0f172a; color: #f8fafc; min-height: 400px; display: flex; align-items: center; justify-content: center;">
              <div style="max-width: 550px; width: 100%; background-color: #1e293b; padding: 40px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);">
                <div style="text-align: center; margin-bottom: 25px;">
                  <div style="display: inline-flex; justify-content: center; items-center; width: 60px; height: 60px; rounded-full bg-blue-600; border-radius: 50%; background: #2563eb; color: white; line-height: 60px; font-size: 24px; font-weight: bold; margin: 0 auto;">V</div>
                </div>
                <h2 style="color: #ffffff; text-align: center; margin-top: 0; font-size: 24px; font-weight: bold;">Configura tu Contraseña</h2>
                <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin-top: 20px;">Hola, <strong>${data.nombre}</strong>.</p>
                <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">Se ha creado tu cuenta (Usuario: <strong>${data.username}</strong>) en el sistema de Préstamos VGI.</p>
                <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">Haz clic en el siguiente botón para crear tu contraseña inicial. Este enlace es válido por 24 horas:</p>
                <div style="margin: 35px 0; text-align: center;">
                  <a href="${url}" style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; padding: 14px 30px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.25);">Configurar Contraseña</a>
                </div>
              </div>
            </div>
          `,
        });
      } catch (err) {
        console.error('No se pudo enviar el correo de configuración de contraseña:', err);
      }
    }

    return newUser;
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
