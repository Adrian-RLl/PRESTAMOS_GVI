import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    // 1. Total de Activos
    const totalActivos = await this.prisma.activo.count();

    // 2. Activos Prestados (Asignados)
    const activosPrestados = await this.prisma.activo.count({
      where: { estado: 'Asignado' },
    });

    // 3. Activos Disponibles
    const activosDisponibles = await this.prisma.activo.count({
      where: { estado: 'Disponible' },
    });

    // 4. Préstamos Activos (que aún no han sido devueltos)
    const prestamosActivos = await this.prisma.prestamo.count({
      where: { estado: 'Activo' },
    });

    // 5. Total de Usuarios (para el KPI adicional)
    const totalUsuarios = await this.prisma.usuario.count();

    // 6. Actividad Reciente (últimos 5 préstamos)
    const actividadReciente = await this.prisma.prestamo.findMany({
      take: 5,
      orderBy: { fecha_prestamo: 'desc' },
      include: {
        usuario: { select: { nombre: true } },
        activo: { select: { serie: true, tipo: true, marca: true } },
      },
    });

    // 7. Distribución de estado de activos para el gráfico (Donut chart)
    const activosMantenimiento = await this.prisma.activo.count({
      where: { estado: 'Mantenimiento' },
    });

    const distribucionActivos = [
      { name: 'Disponibles', value: activosDisponibles },
      { name: 'Prestados', value: activosPrestados },
      { name: 'Mantenimiento', value: activosMantenimiento },
    ];

    return {
      kpis: {
        totalActivos,
        activosPrestados,
        activosDisponibles,
        prestamosActivos,
        totalUsuarios,
      },
      actividadReciente,
      distribucionActivos,
    };
  }
}
