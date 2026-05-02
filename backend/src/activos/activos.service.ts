import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findAll() {
    return this.prisma.activo.findMany();
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
    await this.findOne(id); // Verifica si existe
    return this.prisma.activo.delete({
      where: { id },
    });
  }
}
