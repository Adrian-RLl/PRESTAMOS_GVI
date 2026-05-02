import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CargosService } from './cargos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cargos')
export class CargosController {
  constructor(private readonly cargosService: CargosService) {}

  @Roles(1, 2)
  @Post()
  create(@Body() createDto: any) {
    return this.cargosService.create(createDto);
  }

  @Roles(1, 2, 3)
  @Get()
  findAll() {
    return this.cargosService.findAll();
  }

  @Roles(1, 2, 3)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cargosService.findOne(+id);
  }

  @Roles(1, 2)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.cargosService.update(+id, updateDto);
  }

  @Roles(1, 2)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cargosService.remove(+id);
  }
}
