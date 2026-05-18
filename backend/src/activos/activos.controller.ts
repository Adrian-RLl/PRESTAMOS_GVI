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

@Controller('activos')
export class ActivosController {
  constructor(private readonly activosService: ActivosService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1) // Asumiendo 1 es Admin
  @Post()
  create(@Body() createActivoDto: CreateActivoDto) {
    return this.activosService.create(createActivoDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @Post('lote')
  createBatch(@Body() createActivoDtos: CreateActivoDto[]) {
    return this.activosService.createBatch(createActivoDtos);
  }

  @Get()
  findAll() {
    return this.activosService.findAll();
  }

  @Get('buscar/:serie')
  findBySerie(@Param('serie') serie: string) {
    return this.activosService.findBySerie(serie);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateActivoDto: UpdateActivoDto) {
    return this.activosService.update(+id, updateActivoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activosService.remove(+id);
  }
}
