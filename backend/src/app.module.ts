import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { TiposActivosModule } from './tipos-activos/tipos-activos.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsuariosModule,
    PrismaModule,
    ActivosModule,
    PrestamosModule,
    ScheduleModule.forRoot(),
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true para puerto 465, false para otros
        auth: {
          user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
          pass: process.env.SMTP_PASS || 'etherealpassword',
        },
      },
      defaults: {
        from: process.env.SMTP_FROM || '"VGI Préstamos" <noreply@vanguardfresh.pe>',
      },
    }),
    EmpresasModule,
    GerenciasModule,
    AreasModule,
    CargosModule,
    SedesModule,
    TiposActivosModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
