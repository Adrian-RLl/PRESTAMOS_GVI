const fs = require('fs');
const path = require('path');

const models = ['empresa', 'gerencia', 'area', 'cargo', 'sede'];

models.forEach(model => {
  const modelName = model.charAt(0).toUpperCase() + model.slice(1);
  const folderName = model === 'empresa' ? 'empresas' : 
                     model === 'gerencia' ? 'gerencias' : 
                     model === 'area' ? 'areas' : 
                     model === 'cargo' ? 'cargos' : 'sedes';
                     
  // Service
  const servicePath = path.join('c:/PrestamosVGI/backend/src', folderName, `${folderName}.service.ts`);
  const serviceContent = `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ${modelName}sService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.${model}.create({ data });
  }

  findAll() {
    return this.prisma.${model}.findMany({ where: { estado: true } });
  }

  findOne(id: number) {
    return this.prisma.${model}.findUnique({ where: { id } });
  }

  update(id: number, data: any) {
    return this.prisma.${model}.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.${model}.update({ where: { id }, data: { estado: false } });
  }
}
`;
  fs.writeFileSync(servicePath, serviceContent);

  // Controller
  const controllerPath = path.join('c:/PrestamosVGI/backend/src', folderName, `${folderName}.controller.ts`);
  const controllerContent = `import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ${modelName}sService } from './${folderName}.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('${folderName}')
export class ${modelName}sController {
  constructor(private readonly ${folderName}Service: ${modelName}sService) {}

  @Roles(1, 2)
  @Post()
  create(@Body() createDto: any) {
    return this.${folderName}Service.create(createDto);
  }

  @Roles(1, 2, 3)
  @Get()
  findAll() {
    return this.${folderName}Service.findAll();
  }

  @Roles(1, 2, 3)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.${folderName}Service.findOne(+id);
  }

  @Roles(1, 2)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.${folderName}Service.update(+id, updateDto);
  }

  @Roles(1, 2)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.${folderName}Service.remove(+id);
  }
}
`;
  fs.writeFileSync(controllerPath, controllerContent);

  // Module
  const modulePath = path.join('c:/PrestamosVGI/backend/src', folderName, `${folderName}.module.ts`);
  const moduleContent = `import { Module } from '@nestjs/common';
import { ${modelName}sService } from './${folderName}.service';
import { ${modelName}sController } from './${folderName}.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [${modelName}sController],
  providers: [${modelName}sService],
})
export class ${modelName}sModule {}
`;
  fs.writeFileSync(modulePath, moduleContent);
});
console.log('done');
