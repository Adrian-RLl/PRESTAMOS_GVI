import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { PrestamosService } from './prestamos.service';
import { CreatePrestamoDto } from './dto/create-prestamo.dto';
import { UpdatePrestamoDto } from './dto/update-prestamo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('prestamos')
export class PrestamosController {
  constructor(private readonly prestamosService: PrestamosService) {}

  @Roles(1, 2)
  @Post()
  create(@Body() createPrestamoDto: CreatePrestamoDto, @Req() req: any) {
    const adminId = req.user.sub;
    return this.prestamosService.create(createPrestamoDto, adminId);
  }

  @Roles(1, 2, 3)
  @Get()
  findAll() {
    return this.prestamosService.findAll();
  }

  @Roles(1, 2, 3)
  @Get('activos-usuario/:dni')
  findActiveByUserDni(@Param('dni') dni: string) {
    return this.prestamosService.findActiveByUserDni(dni);
  }

  @Roles(1, 2, 3)
  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Res() res) {
    const buffer = await this.prestamosService.getLoanPdf(+id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=acta_entrega_${id}.pdf`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Roles(1, 2, 3)
  @Get(':id/pdf-devolucion')
  async getPdfDevolucion(@Param('id') id: string, @Res() res) {
    const buffer = await this.prestamosService.getReturnPdf(+id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=acta_devolucion_${id}.pdf`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Roles(1, 2, 3)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prestamosService.findOne(+id);
  }

  @Roles(1)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePrestamoDto: UpdatePrestamoDto,
  ) {
    return this.prestamosService.update(+id, updatePrestamoDto);
  }

  @Roles(1, 2)
  @Post('devolver-lote')
  devolverLote(
    @Body('prestamos_ids') prestamosIds: number[],
    @Body('firma_devolucion') firma_devolucion: string,
    @Body('observaciones_activos') observacionesActivos: Record<string, string>,
    @Body('devuelto_por_tercero') devueltoPorTercero: string,
    @Req() req: any,
  ) {
    const adminId = req.user.sub;
    return this.prestamosService.devolverLote(prestamosIds, firma_devolucion, observacionesActivos, devueltoPorTercero, adminId);
  }

  @Roles(1, 2)
  @Post(':id/devolver')
  devolver(
    @Param('id') id: string,
    @Body('firma_devolucion') firma_devolucion: string,
    @Body('observaciones') observaciones: string,
    @Req() req: any,
  ) {
    const adminId = req.user.sub;
    return this.prestamosService.devolver(+id, firma_devolucion, adminId, observaciones);
  }

  @Roles(1)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prestamosService.remove(+id);
  }
}
