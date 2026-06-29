import { Module } from '@nestjs/common';
import { TiposActivosService } from './tipos-activos.service';
import { TiposActivosController } from './tipos-activos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TiposActivosController],
  providers: [TiposActivosService],
  exports: [TiposActivosService],
})
export class TiposActivosModule {}
