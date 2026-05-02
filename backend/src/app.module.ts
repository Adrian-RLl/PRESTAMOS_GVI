import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { PrismaModule } from './prisma/prisma.module';
import { ActivosModule } from './activos/activos.module';
import { PrestamosModule } from './prestamos/prestamos.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { ScheduleModule } from '@nestjs/schedule';
import { EmpresasModule } from './empresas/empresas.module';
import { GerenciasModule } from './gerencias/gerencias.module';
import { AreasModule } from './areas/areas.module';
import { CargosModule } from './cargos/cargos.module';
import { SedesModule } from './sedes/sedes.module';

@Module({
  imports: [
    AuthModule,
    UsuariosModule,
    PrismaModule,
    ActivosModule,
    PrestamosModule,
    ScheduleModule.forRoot(),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'etherealpassword',
        },
      },
      defaults: {
        from: '"VGI Préstamos" <noreply@vanguardfresh.pe>',
      },
    }),
    EmpresasModule,
    GerenciasModule,
    AreasModule,
    CargosModule,
    SedesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
