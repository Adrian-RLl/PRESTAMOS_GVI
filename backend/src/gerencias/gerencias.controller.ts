import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { GerenciasService } from './gerencias.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gerencias')
export class GerenciasController {
  constructor(private readonly gerenciasService: GerenciasService) {}

  @Roles(1, 2)
  @Post()
  create(@Body() createDto: any) {
    return this.gerenciasService.create(createDto);
  }

  @Roles(1, 2, 3)
  @Get()
  findAll() {
    return this.gerenciasService.findAll();
  }

  @Roles(1, 2, 3)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gerenciasService.findOne(+id);
  }

  @Roles(1, 2)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.gerenciasService.update(+id, updateDto);
  }

  @Roles(1, 2)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gerenciasService.remove(+id);
  }
}
