import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CargosService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.cargo.create({ data });
  }

  findAll() {
    return this.prisma.cargo.findMany();
  }

  findOne(id: number) {
    return this.prisma.cargo.findUnique({ where: { id } });
  }

  update(id: number, data: any) {
    return this.prisma.cargo.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.cargo.update({ where: { id }, data: { estado: false } });
  }
}
