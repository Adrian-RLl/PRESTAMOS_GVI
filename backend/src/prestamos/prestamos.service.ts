import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreatePrestamoDto } from './dto/create-prestamo.dto';
import { UpdatePrestamoDto } from './dto/update-prestamo.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from './pdf.service';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class PrestamosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
    private readonly mailerService: MailerService,
  ) {}

  async create(createPrestamoDto: CreatePrestamoDto, adminId: number) {
    const activos = await this.prisma.activo.findMany({
      where: { id: { in: createPrestamoDto.activos_ids } },
    });

    if (activos.length !== createPrestamoDto.activos_ids.length) {
      throw new BadRequestException('Algunos activos no existen.');
    }

    for (const activo of activos) {
      if (activo.estado !== 'Disponible') {
        throw new BadRequestException(
          `El activo con Serie ${activo.serie} no está disponible para préstamo.`,
        );
      }
    }

    const resultados = await this.prisma.$transaction(async (prisma) => {
      const creados: any[] = [];
      for (const activo_id of createPrestamoDto.activos_ids) {
        const p = await prisma.prestamo.create({
          data: {
            usuario_id: createPrestamoDto.usuario_id,
            activo_id: activo_id,
            fecha_prestamo: new Date(createPrestamoDto.fecha_prestamo),
            fecha_devolucion: createPrestamoDto.fecha_devolucion ? new Date(createPrestamoDto.fecha_devolucion) : null,
            estado: 'Activo',
            firma_digital: createPrestamoDto.firma_digital,
            usuario_emisor_id: adminId,
          },
          include: {
            usuario: {
              include: {
                empresa: true,
                area: true,
                cargo: true,
                sede: true,
              },
            },
            activo: true,
          },
        });

        const obs = createPrestamoDto.activos_observaciones?.[activo_id.toString()];
        const updateData: any = { estado: 'Asignado' };
        if (obs !== undefined) {
          updateData.observaciones = obs;
        }

        await prisma.activo.update({
          where: { id: activo_id },
          data: updateData,
        });

        creados.push(p);
      }
      return creados;
    });

    // Generar un solo PDF consolidado y enviar un solo correo en segundo plano
    Promise.resolve().then(async () => {
      try {
        const pdfBuffer =
          await this.pdfService.generateLoanPdfMultiple(resultados);
        const equiposList = resultados
          .map(
            (p) => `${p.activo.tipo} ${p.activo.marca} (S/N: ${p.activo.serie})`,
          )
          .join('\n- ');
        await this.mailerService.sendMail({
          to: resultados[0].usuario.correo,
          subject: `Acta de Entrega de Activos - ${resultados.length} equipo(s)`,
          text: `Hola ${resultados[0].usuario.nombre},\n\nAdjuntamos el acta de entrega de los siguientes equipos:\n- ${equiposList}\n\n${resultados[0].fecha_devolucion ? `Recuerda que la fecha estimada de devolución es el ${new Date(resultados[0].fecha_devolucion).toLocaleDateString('es-PE', { timeZone: 'UTC' })}.` : 'Recuerda que esta es una asignación permanente.'}\n\nSaludos,\nEquipo VGI.`,
          attachments: [
            {
              filename: `Acta_Entrega_${resultados[0].usuario.dni || resultados[0].usuario_id}_${Date.now()}.pdf`,
              content: pdfBuffer,
            },
          ],
        });
        console.log('Correo consolidado enviado a', resultados[0].usuario.correo);
      } catch (err) {
        console.error('Error al generar PDF consolidado o enviar correo', err);
      }
    });

    return resultados;
  }

  async findAll() {
    return this.prisma.prestamo.findMany({
      include: {
        usuario: {
          include: { area: true, sede: true }
        },
        usuario_receptor: true,
        usuario_emisor: true,
        activo: true,
      },
    });
  }

  async findOne(id: number) {
    const prestamo = await this.prisma.prestamo.findUnique({
      where: { id },
      include: {
        usuario: true,
        usuario_receptor: true,
        usuario_emisor: true,
        activo: true,
      },
    });
    if (!prestamo) {
      throw new NotFoundException(`Préstamo con ID ${id} no encontrado`);
    }
    return prestamo;
  }

  async devolver(id: number, firma_devolucion: string, adminId: number) {
    const prestamo = await this.findOne(id);
    if (prestamo.estado === 'Devuelto') {
      throw new BadRequestException('El préstamo ya fue devuelto.');
    }

    if (!firma_devolucion) {
      throw new BadRequestException('Se requiere la firma de devolución.');
    }

    const transactionResult = await this.prisma.$transaction(async (prisma) => {
      const updatedPrestamo = await prisma.prestamo.update({
        where: { id },
        data: {
          estado: 'Devuelto',
          firma_devolucion,
          fecha_devolucion: new Date(),
          usuario_receptor_id: adminId,
        },
        include: {
          usuario: {
            include: { empresa: true, area: true, cargo: true, sede: true },
          },
          activo: true,
        },
      });

      await prisma.activo.update({
        where: { id: prestamo.activo_id },
        data: { estado: 'Disponible' },
      });

      return updatedPrestamo;
    });

    // Generar PDF y enviar correo en segundo plano
    Promise.resolve().then(async () => {
      try {
        const pdfBuffer = await this.pdfService.generateReturnPdfMultiple([transactionResult]);
        if (transactionResult.usuario.correo) {
          await this.mailerService.sendMail({
            to: transactionResult.usuario.correo,
            subject: `Acta de Devolución de Activo`,
            text: `Hola ${transactionResult.usuario.nombre},\n\nAdjuntamos el acta de devolución del equipo ${transactionResult.activo.tipo} (${transactionResult.activo.marca}).\n\nSaludos,\nEquipo VGI.`,
            attachments: [
              {
                filename: `Acta_Devolucion_${transactionResult.usuario.dni || transactionResult.usuario_id}_${Date.now()}.pdf`,
                content: pdfBuffer,
              },
            ],
          });
          console.log('Correo de devolución enviado a', transactionResult.usuario.correo);
        }
      } catch (err) {
        console.error('Error al generar PDF o enviar correo de devolución', err);
      }
    });

    return transactionResult;
  }

  async findActiveByUserDni(dni: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { dni },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario con DNI ${dni} no encontrado`);
    }
    return this.prisma.prestamo.findMany({
      where: {
        usuario_id: usuario.id,
        estado: 'Activo',
      },
      include: {
        activo: true,
        usuario: {
          include: {
            empresa: true,
            area: true,
            cargo: true,
            sede: true,
          },
        },
      },
    });
  }

  async devolverLote(prestamosIds: number[], firma_devolucion: string, observacionesActivos: Record<string, string>, devuelto_por_tercero: string, adminId: number) {
    if (!prestamosIds || prestamosIds.length === 0) {
      throw new BadRequestException('Debe seleccionar al menos un préstamo.');
    }
    if (!firma_devolucion) {
      throw new BadRequestException('Se requiere la firma de devolución.');
    }

    const prestamos = await this.prisma.prestamo.findMany({
      where: { id: { in: prestamosIds } },
    });

    if (prestamos.length !== prestamosIds.length) {
      throw new BadRequestException('Algunos préstamos no existen.');
    }

    for (const p of prestamos) {
      if (p.estado === 'Devuelto') {
        throw new BadRequestException(
          `El préstamo con ID ${p.id} ya fue devuelto.`,
        );
      }
    }

    const transactionResult = await this.prisma.$transaction(async (prisma) => {
      const resultados: any[] = [];
      for (const p of prestamos) {
        const updated = await prisma.prestamo.update({
          where: { id: p.id },
          data: {
            estado: 'Devuelto',
            firma_devolucion,
            fecha_devolucion: new Date(),
            usuario_receptor_id: adminId,
            devuelto_por_tercero: devuelto_por_tercero || null,
          },
          include: {
            usuario: {
              include: { empresa: true, area: true, cargo: true, sede: true },
            },
            activo: true,
          },
        });

        const obs = observacionesActivos?.[p.id.toString()];
        const updateActivoData: any = { estado: 'Disponible' };
        if (obs !== undefined) {
          updateActivoData.observaciones = obs;
        }

        await prisma.activo.update({
          where: { id: p.activo_id },
          data: updateActivoData,
        });
        resultados.push(updated);
      }
      return resultados;
    });

    // Generar PDF y enviar correo en segundo plano
    Promise.resolve().then(async () => {
      try {
        const pdfBuffer = await this.pdfService.generateReturnPdfMultiple(transactionResult);
        const equiposList = transactionResult
          .map((p) => `${p.activo.tipo} ${p.activo.marca} (S/N: ${p.activo.serie})`)
          .join('\n- ');
        
        if (transactionResult[0].usuario.correo) {
          await this.mailerService.sendMail({
            to: transactionResult[0].usuario.correo,
            subject: `Acta de Devolución de Activos - ${transactionResult.length} equipo(s)`,
            text: `Hola ${transactionResult[0].usuario.nombre},\n\nAdjuntamos el acta de devolución de los siguientes equipos:\n- ${equiposList}\n\nSaludos,\nEquipo VGI.`,
            attachments: [
              {
                filename: `Acta_Devolucion_${transactionResult[0].usuario.dni || transactionResult[0].usuario_id}_${Date.now()}.pdf`,
                content: pdfBuffer,
              },
            ],
          });
          console.log('Correo de devolución enviado a', transactionResult[0].usuario.correo);
        }
      } catch (err) {
        console.error('Error al generar PDF o enviar correo de devolución', err);
      }
    });

    return transactionResult;
  }

  async update(id: number, updatePrestamoDto: UpdatePrestamoDto) {
    await this.findOne(id);
    return this.prisma.prestamo.update({
      where: { id },
      data: updatePrestamoDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.prestamo.delete({
      where: { id },
    });
  }

  async getLoanPdf(id: number) {
    const prestamo = await this.findOne(id);
    // Buscar todos los préstamos del mismo usuario con la misma fecha de entrega
    const related = await this.prisma.prestamo.findMany({
      where: {
        usuario_id: prestamo.usuario_id,
        fecha_prestamo: prestamo.fecha_prestamo,
        firma_digital: prestamo.firma_digital ? { not: null } : undefined,
      },
      include: {
        usuario: {
          include: { empresa: true, area: true, cargo: true, sede: true },
        },
        activo: true,
      },
    });
    return this.pdfService.generateLoanPdfMultiple(
      related.length > 0 ? related : [prestamo],
    );
  }

  async getReturnPdf(id: number) {
    const prestamo = await this.findOne(id);
    // Buscar todos los préstamos devueltos del mismo usuario con la misma firma de devolución
    const related = await this.prisma.prestamo.findMany({
      where: {
        usuario_id: prestamo.usuario_id,
        estado: 'Devuelto',
        firma_devolucion: prestamo.firma_devolucion
          ? prestamo.firma_devolucion
          : undefined,
      },
      include: {
        usuario: {
          include: { empresa: true, area: true, cargo: true, sede: true },
        },
        activo: true,
      },
    });
    return this.pdfService.generateReturnPdfMultiple(
      related.length > 0 ? related : [prestamo],
    );
  }
}
