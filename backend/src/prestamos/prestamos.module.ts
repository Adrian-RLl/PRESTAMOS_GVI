import { Module } from '@nestjs/common';
import { PrestamosService } from './prestamos.service';
import { PrestamosController } from './prestamos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfService } from './pdf.service';
import { PrestamosCronService } from './cron.service';

@Module({
  imports: [PrismaModule],
  controllers: [PrestamosController],
  providers: [PrestamosService, PdfService, PrestamosCronService],
})
export class PrestamosModule {}
