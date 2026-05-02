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
    const activo = await this.prisma.activo.findUnique({
      where: { id: createPrestamoDto.activo_id },
    });
    if (!activo || activo.estado !== 'Stock') {
      throw new BadRequestException(
        'El activo no está disponible para préstamo.',
      );
    }

    const prestamo = await this.prisma.$transaction(async (prisma) => {
      const p = await prisma.prestamo.create({
        data: {
          usuario_id: createPrestamoDto.usuario_id,
          activo_id: createPrestamoDto.activo_id,
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
        where: { id: createPrestamoDto.activo_id },
        data: { estado: 'Asignado' },
      });

      return p;
    });

    // Generar PDF y enviar correo en segundo plano
    try {
      const pdfBuffer = await this.pdfService.generateLoanPdf(prestamo);
      await this.mailerService.sendMail({
        to: prestamo.usuario.correo,
        subject: `Acta de Préstamo - ${prestamo.activo.tipo} ${prestamo.activo.marca}`,
        text: `Hola ${prestamo.usuario.nombre},\n\nAdjuntamos el acta de entrega del equipo ${prestamo.activo.tipo} (${prestamo.activo.codigo_patrimonial}) para tu firma de conocimiento.\n\nRecuerda que la fecha estimada de devolución es el ${new Date(prestamo.fecha_devolucion).toLocaleDateString()}.\n\nSaludos,\nEquipo VGI.`,
        attachments: [
          {
            filename: `Acta_${prestamo.activo.codigo_patrimonial}.pdf`,
            content: pdfBuffer,
          }
        ]
      });
      console.log('Correo enviado a', prestamo.usuario.correo);
    } catch (err) {
      console.error('Error al generar PDF o enviar correo', err);
    }

    return prestamo;
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
        data: { estado: 'Stock' },
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
