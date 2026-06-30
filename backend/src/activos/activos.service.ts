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
    if (!createActivoDto.tipo?.trim() || !createActivoDto.marca?.trim() || !createActivoDto.modelo?.trim() || !createActivoDto.serie?.trim()) {
      throw new BadRequestException('Los campos tipo, marca, modelo y serie no pueden estar vacíos ni contener solo espacios.');
    }

    const existing = await this.findBySerie(createActivoDto.serie);
    if (existing) {
      throw new BadRequestException(`El número de serie/IMEI "${createActivoDto.serie}" ya se encuentra registrado.`);
    }

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

    let createdCount = 0;
    let updatedCount = 0;

    // Ejecutar en secuencia para manejar upsert con validación
    for (const activo of resolvedActivos) {
      const existing = await this.prisma.activo.findUnique({
        where: { serie: activo.serie }
      });

      if (existing) {
        if (existing.estado !== 'Asignado') {
          await this.prisma.activo.update({
            where: { serie: activo.serie },
            data: activo
          });
          updatedCount++;
        }
      } else {
        await this.prisma.activo.create({
          data: activo
        });
        createdCount++;
      }
    }

    return { count: createdCount + updatedCount, created: createdCount, updated: updatedCount };
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
    if (updateActivoDto.tipo !== undefined && !updateActivoDto.tipo.trim()) {
      throw new BadRequestException('El tipo no puede estar vacío.');
    }
    if (updateActivoDto.marca !== undefined && !updateActivoDto.marca.trim()) {
      throw new BadRequestException('La marca no puede estar vacía.');
    }
    if (updateActivoDto.modelo !== undefined && !updateActivoDto.modelo.trim()) {
      throw new BadRequestException('El modelo no puede estar vacío.');
    }
    if (updateActivoDto.serie !== undefined) {
      if (!updateActivoDto.serie.trim()) {
        throw new BadRequestException('La serie no puede estar vacía.');
      }
      const existing = await this.findBySerie(updateActivoDto.serie);
      if (existing && existing.id !== id) {
        throw new BadRequestException(`El número de serie/IMEI "${updateActivoDto.serie}" ya se encuentra registrado por otro activo.`);
      }
    }

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
