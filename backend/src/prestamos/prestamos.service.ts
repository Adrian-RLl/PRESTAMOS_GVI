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

  async create(createPrestamoDto: CreatePrestamoDto) {
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
            fecha_devolucion: new Date(createPrestamoDto.fecha_devolucion),
            estado: 'Activo',
            firma_digital: createPrestamoDto.firma_digital,
          },
          include: {
            usuario: true,
            activo: true,
          }
        });

        await prisma.activo.update({
          where: { id: activo_id },
          data: { estado: 'Asignado' },
        });

        creados.push(p);
      }
      return creados;
    });

    // Generar PDF y enviar correo en segundo plano
    for (const prestamo of resultados) {
      try {
        const pdfBuffer = await this.pdfService.generateLoanPdf(prestamo);
        await this.mailerService.sendMail({
          to: prestamo.usuario.correo,
          subject: `Acta de Préstamo - ${prestamo.activo.tipo} ${prestamo.activo.marca}`,
          text: `Hola ${prestamo.usuario.nombre},\n\nAdjuntamos el acta de entrega del equipo ${prestamo.activo.tipo} (S/N: ${prestamo.activo.serie}) para tu firma de conocimiento.\n\nRecuerda que la fecha estimada de devolución es el ${new Date(prestamo.fecha_devolucion).toLocaleDateString()}.\n\nSaludos,\nEquipo VGI.`,
          attachments: [
            {
              filename: `Acta_${prestamo.activo.serie}.pdf`,
              content: pdfBuffer,
            }
          ]
        });
        console.log('Correo enviado a', prestamo.usuario.correo);
      } catch (err) {
        console.error('Error al generar PDF o enviar correo', err);
      }
    }

    return resultados;
  }

  async findAll() {
    return this.prisma.prestamo.findMany({
      include: {
        usuario: true,
        activo: true,
      },
    });
  }

  async findOne(id: number) {
    const prestamo = await this.prisma.prestamo.findUnique({
      where: { id },
      include: {
        usuario: true,
        activo: true,
      },
    });
    if (!prestamo) {
      throw new NotFoundException(`Préstamo con ID ${id} no encontrado`);
    }
    return prestamo;
  }

  async devolver(id: number, firma_devolucion: string) {
    const prestamo = await this.findOne(id);
    if (prestamo.estado === 'Devuelto') {
      throw new BadRequestException('El préstamo ya fue devuelto.');
    }

    if (!firma_devolucion) {
      throw new BadRequestException('Se requiere la firma de devolución.');
    }

    return this.prisma.$transaction(async (prisma) => {
      const updatedPrestamo = await prisma.prestamo.update({
        where: { id },
        data: { 
          estado: 'Devuelto',
          firma_devolucion 
        },
      });

      await prisma.activo.update({
        where: { id: prestamo.activo_id },
        data: { estado: 'Disponible' },
      });

      return updatedPrestamo;
    });
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
}
