import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TiposActivosService } from './tipos-activos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tipos-activos')
export class TiposActivosController {
  constructor(private readonly tiposActivosService: TiposActivosService) {}

  @Roles(1)
  @Post()
  create(@Body() data: any) {
    return this.tiposActivosService.create(data);
  }

  @Roles(1, 2)
  @Get()
  findAll() {
    return this.tiposActivosService.findAll();
  }

  @Roles(1, 2)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tiposActivosService.findOne(+id);
  }

  @Roles(1)
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.tiposActivosService.update(+id, data);
  }

  @Roles(1)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tiposActivosService.remove(+id);
  }
}
