import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AreasService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.area.create({ data });
  }

  findAll() {
    return this.prisma.area.findMany({ where: { estado: true } });
  }

  findOne(id: number) {
    return this.prisma.area.findUnique({ where: { id } });
  }

  update(id: number, data: any) {
    return this.prisma.area.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.area.update({ where: { id }, data: { estado: false } });
  }
}
