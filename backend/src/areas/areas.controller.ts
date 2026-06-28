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
import { AreasService } from './areas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Roles(1)
  @Post()
  create(@Body() createDto: any) {
    return this.areasService.create(createDto);
  }

  @Roles(1, 2, 3)
  @Get()
  findAll() {
    return this.areasService.findAll();
  }

  @Roles(1, 2, 3)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.areasService.findOne(+id);
  }

  @Roles(1)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.areasService.update(+id, updateDto);
  }

  @Roles(1)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.areasService.remove(+id);
  }
}
