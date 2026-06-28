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
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Roles(1)
  @Post()
  create(@Body() createUsuarioDto: any) {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Roles(1)
  @Post('lote')
  createBatch(@Body() createUsuarioDtos: any[]) {
    return this.usuariosService.createBatch(createUsuarioDtos);
  }

  @Roles(1, 2, 3)
  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @Roles(1, 2, 3)
  @Get('dni/:dni')
  findByDni(@Param('dni') dni: string) {
    return this.usuariosService.findByDni(dni);
  }

  @Roles(1, 2, 3)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(+id);
  }

  @Roles(1)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUsuarioDto: any) {
    return this.usuariosService.update(+id, updateUsuarioDto);
  }

  @Roles(1)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usuariosService.remove(+id);
  }
}
