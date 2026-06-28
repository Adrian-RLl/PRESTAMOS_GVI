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
import { EmpresasService } from './empresas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Roles(1)
  @Post()
  create(@Body() createDto: any) {
    return this.empresasService.create(createDto);
  }

  @Roles(1, 2, 3)
  @Get()
  findAll() {
    return this.empresasService.findAll();
  }

  @Roles(1, 2, 3)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.empresasService.findOne(+id);
  }

  @Roles(1)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.empresasService.update(+id, updateDto);
  }

  @Roles(1)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.empresasService.remove(+id);
  }
}
