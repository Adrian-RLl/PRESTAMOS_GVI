import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GerenciasService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.gerencia.create({ data });
  }

  findAll() {
    return this.prisma.gerencia.findMany({ where: { estado: true } });
  }

  findOne(id: number) {
    return this.prisma.gerencia.findUnique({ where: { id } });
  }

  update(id: number, data: any) {
    return this.prisma.gerencia.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.gerencia.update({
      where: { id },
      data: { estado: false },
    });
  }
}
