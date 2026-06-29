import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class PrestamosCronService {
  private readonly logger = new Logger(PrestamosCronService.name);

  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}

  // Se ejecuta todos los días a las 8:00 AM
  @Cron('0 8 * * *')
  async handleCron() {
    this.logger.debug(
      'Ejecutando tarea programada: Verificación de devoluciones próximas',
    );

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Obtener inicio y fin del día de mañana para buscar coincidencias
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

    try {
      const prestamosPorVencer = await this.prisma.prestamo.findMany({
        where: {
          estado: 'Activo',
          fecha_devolucion: {
            gte: startOfTomorrow,
            lte: endOfTomorrow,
          },
        },
        include: {
          usuario: true,
          activo: true,
        },
      });

      if (prestamosPorVencer.length > 0) {
        this.logger.log(
          `Se encontraron ${prestamosPorVencer.length} préstamos a punto de vencer. Enviando correos...`,
        );

        for (const prestamo of prestamosPorVencer) {
          await this.mailerService.sendMail({
            to: prestamo.usuario.correo,
            subject: 'Recordatorio: Devolución de Equipo Informático VGI',
            text: `Hola ${prestamo.usuario.nombre},\n\nEste es un recordatorio automático de que tu préstamo del equipo ${prestamo.activo.tipo} (${prestamo.activo.marca}) vence el día de MAÑANA (${new Date(prestamo.fecha_devolucion!).toLocaleDateString('es-PE', { timeZone: 'UTC' })}).\n\nPor favor acércate a devolver el equipo para evitar penalizaciones.\n\nAtentamente,\nEquipo VGI.`,
          });
          this.logger.log(
            `Correo de recordatorio enviado a ${prestamo.usuario.correo}`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error al ejecutar cron de préstamos', error);
    }
  }
}
