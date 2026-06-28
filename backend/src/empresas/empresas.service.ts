import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmpresasService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.empresa.create({ data });
  }

  findAll() {
    return this.prisma.empresa.findMany({ where: { estado: true } });
  }

  findOne(id: number) {
    return this.prisma.empresa.findUnique({ where: { id } });
  }

  update(id: number, data: any) {
    return this.prisma.empresa.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.empresa.update({
      where: { id },
      data: { estado: false },
    });
  }
}
