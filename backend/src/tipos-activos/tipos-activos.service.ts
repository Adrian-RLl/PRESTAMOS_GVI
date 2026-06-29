import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TiposActivosService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.tipoActivo.create({ data });
  }

  async findAll() {
    return this.prisma.tipoActivo.findMany({
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.tipoActivo.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Tipo de activo no encontrado');
    return item;
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.tipoActivo.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tipoActivo.update({
      where: { id },
      data: { estado: false },
    });
  }
}
