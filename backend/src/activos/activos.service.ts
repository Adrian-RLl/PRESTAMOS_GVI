import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateActivoDto } from './dto/create-activo.dto';
import { UpdateActivoDto } from './dto/update-activo.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createActivoDto: CreateActivoDto) {
    return this.prisma.activo.create({
      data: createActivoDto,
    });
  }

  async createBatch(activos: any[]) {
    const resolvedActivos = await Promise.all(
      activos.map(async (activo) => {
        let empresa_id: number | null = null;
        if (activo.empresa) {
          const emp = await this.prisma.empresa.findFirst({
            where: { nombre: activo.empresa },
          });
          if (emp) {
            empresa_id = emp.id;
          }
        } else if (activo.empresa_id) {
          empresa_id = Number(activo.empresa_id);
        }

        return {
          tipo: activo.tipo,
          marca: activo.marca,
          modelo: activo.modelo,
          serie: activo.serie,
          estado: activo.estado || 'Disponible',
          condicion: activo.condicion || 'Nuevo',
          ubicacion: activo.ubicacion || 'Almacén Principal',
          observaciones: activo.observaciones || '',
          vigencia: activo.vigencia || '',
          orden_compra: activo.orden_compra || '',
          empresa_id: empresa_id,
        };
      }),
    );

    return this.prisma.activo.createMany({
      data: resolvedActivos,
      skipDuplicates: true,
    });
  }

  async findAll() {
    return this.prisma.activo.findMany({
      include: {
        prestamos: {
          where: { estado: 'Activo' },
          include: { usuario: true },
        },
      },
    });
  }

  async findBySerie(serie: string) {
    return this.prisma.activo.findFirst({
      where: { serie: serie },
    });
  }

  async findSugerencias(query: string) {
    return this.prisma.activo.findMany({
      where: {
        OR: [
          { serie: { contains: query } },
          { marca: { contains: query } },
          { modelo: { contains: query } },
        ],
        estado: 'Disponible', // Sugerimos solo los disponibles
      },
      take: 10,
    });
  }

  async findOne(id: number) {
    const activo = await this.prisma.activo.findUnique({
      where: { id },
    });
    if (!activo) {
      throw new NotFoundException(`Activo con ID ${id} no encontrado`);
    }
    return activo;
  }

  async update(id: number, updateActivoDto: UpdateActivoDto) {
    await this.findOne(id); // Verifica si existe
    return this.prisma.activo.update({
      where: { id },
      data: updateActivoDto,
    });
  }

  async remove(id: number) {
    const activo = await this.findOne(id); // Verifica si existe

    // Si el activo está asignado (prestado), no se debe dar de baja
    if (activo.estado === 'Asignado') {
      throw new BadRequestException(
        'No se puede dar de baja un activo que se encuentra asignado (en préstamo).',
      );
    }

    return this.prisma.activo.update({
      where: { id },
      data: { estado: 'Baja' },
    });
  }
}
