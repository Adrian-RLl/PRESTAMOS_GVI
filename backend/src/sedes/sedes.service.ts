import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SedesService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.sede.create({ data });
  }

  findAll() {
    return this.prisma.sede.findMany();
  }

  findOne(id: number) {
    return this.prisma.sede.findUnique({ where: { id } });
  }

  update(id: number, data: any) {
    return this.prisma.sede.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.sede.update({ where: { id }, data: { estado: false } });
  }
}
