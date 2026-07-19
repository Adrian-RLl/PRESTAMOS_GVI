import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ActivosService } from './activos.service';
import { CreateActivoDto } from './dto/create-activo.dto';
import { UpdateActivoDto } from './dto/update-activo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activos')
export class ActivosController {
  constructor(private readonly activosService: ActivosService) {}

  @Roles(1, 2)
  @Post()
  create(@Body() createActivoDto: CreateActivoDto) {
    return this.activosService.create(createActivoDto);
  }

  @Roles(1, 2)
  @Post('lote')
  createBatch(@Body() createActivoDtos: CreateActivoDto[]) {
    return this.activosService.createBatch(createActivoDtos);
  }

  @Roles(1, 2, 3)
  @Get()
  findAll() {
    return this.activosService.findAll();
  }

  @Roles(1, 2, 3)
  @Get('buscar/:serie')
  findBySerie(@Param('serie') serie: string) {
    return this.activosService.findBySerie(serie);
  }

  @Roles(1, 2, 3)
  @Get('sugerencias/:query')
  findSugerencias(@Param('query') query: string) {
    return this.activosService.findSugerencias(query);
  }

  @Roles(1, 2, 3)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activosService.findOne(+id);
  }

  @Roles(1, 2)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateActivoDto: UpdateActivoDto) {
    return this.activosService.update(+id, updateActivoDto);
  }

  @Roles(1)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activosService.remove(+id);
  }

  @Roles(1, 2, 3)
  @Get(':id/historial')
  getHistorial(@Param('id') id: string) {
    return this.activosService.findHistorial(+id);
  }
}
