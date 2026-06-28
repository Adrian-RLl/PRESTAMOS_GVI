import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  async register(data: any) {
    const hash = await bcrypt.hash(data.contraseña, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: data.nombre,
        correo: data.correo,
        contraseña: hash,
        rol_id: data.rol_id,
      },
    });

    return {
      mensaje: 'Usuario creado',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
      },
    };
  }

  async login(correo: string, pass: string) {
    const usuario = await this.usuariosService.findByEmail(correo);

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('Su cuenta ha sido desactivada');
    }

    // Verificar si está bloqueado temporalmente
    if (usuario.bloqueado_hasta) {
      const ahora = new Date();
      const bloqueadoHasta = new Date(usuario.bloqueado_hasta);
      if (ahora < bloqueadoHasta) {
        const msRestantes = bloqueadoHasta.getTime() - ahora.getTime();
        const minutosRestantes = Math.ceil(msRestantes / (1000 * 60));
        throw new UnauthorizedException(
          `Su cuenta está bloqueada por seguridad. Inténtalo de nuevo en ${minutosRestantes} minutos`,
        );
      } else {
        // Si el tiempo de bloqueo ya expiró, reiniciamos el contador de intentos fallidos
        await this.prisma.usuario.update({
          where: { id: usuario.id },
          data: { intentos_fallidos: 0, bloqueado_hasta: null },
        });
        usuario.intentos_fallidos = 0;
        usuario.bloqueado_hasta = null;
      }
    }

    const isMatch = await bcrypt.compare(pass, usuario.contraseña);
    if (!isMatch) {
      const nuevosIntentos = usuario.intentos_fallidos + 1;
      const dataActualizar: any = { intentos_fallidos: nuevosIntentos };

      if (nuevosIntentos >= 4) {
        const quinceMinutos = new Date(Date.now() + 15 * 60 * 1000);
        dataActualizar.bloqueado_hasta = quinceMinutos;

        await this.prisma.usuario.update({
          where: { id: usuario.id },
          data: dataActualizar,
        });

        throw new UnauthorizedException(
          'Su cuenta ha sido bloqueada temporalmente por 15 minutos debido a 4 intentos fallidos.',
        );
      } else {
        await this.prisma.usuario.update({
          where: { id: usuario.id },
          data: dataActualizar,
        });

        const intentosRestantes = 4 - nuevosIntentos;
        throw new UnauthorizedException(
          `Credenciales inválidas. Le quedan ${intentosRestantes} intentos antes del bloqueo.`,
        );
      }
    }

    // Si el login es correcto, reiniciamos los campos de bloqueo si tenían valores
    if (usuario.intentos_fallidos > 0 || usuario.bloqueado_hasta) {
      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          intentos_fallidos: 0,
          bloqueado_hasta: null,
        },
      });
    }

    const payload = {
      sub: usuario.id,
      email: usuario.correo,
      rol: usuario.rol_id,
    };
    const token = await this.jwtService.signAsync(payload);

    return {
      mensaje: 'Login correcto',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol_id: usuario.rol_id,
        activo: usuario.activo,
      },
    };
  }

  async forgotPassword(correo: string) {
    const usuario = await this.usuariosService.findByEmail(correo);
    if (!usuario) {
      // Por seguridad para evitar enumeración de usuarios, respondemos con el mismo mensaje de éxito
      return {
        mensaje:
          'Si el correo está registrado, se enviará un enlace de recuperación.',
      };
    }

    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        recuperar_token: token,
        recuperar_expira: expira,
      },
    });

    const url = `http://localhost:3000/restablecer-contrasena?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: correo,
        subject: 'Recuperación de Contraseña - VGI Préstamos',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 25px; background-color: #0f172a; color: #f8fafc; min-height: 400px; display: flex; align-items: center; justify-content: center;">
            <div style="max-width: 550px; width: 100%; background-color: #1e293b; padding: 40px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);">
              <div style="text-align: center; margin-bottom: 25px;">
                <div style="display: inline-flex; justify-content: center; items-center; width: 60px; height: 60px; rounded-full bg-blue-600; border-radius: 50%; background: #2563eb; color: white; line-height: 60px; font-size: 24px; font-weight: bold; margin: 0 auto;">V</div>
              </div>
              <h2 style="color: #ffffff; text-align: center; margin-top: 0; font-size: 24px; font-weight: bold;">Restablecer tu Contraseña</h2>
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin-top: 20px;">Hola, <strong>${usuario.nombre}</strong>.</p>
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">Recibimos una solicitud para restablecer la contraseña de tu cuenta corporativa en el sistema de Préstamos VGI.</p>
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">Haz clic en el siguiente botón para crear una nueva contraseña. Este enlace es válido por 30 minutos:</p>
              <div style="margin: 35px 0; text-align: center;">
                <a href="${url}" style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; padding: 14px 30px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.25);">Restablecer Contraseña</a>
              </div>
              <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
            </div>
          </div>
        `,
      });
    } catch (mailError) {
      console.error('Error al enviar correo de recuperación:', mailError);
    }

    // En desarrollo, siempre imprimimos el enlace en la consola para facilitar las pruebas locales
    console.log('\n=============================================');
    console.log('🔑 ENLACE DE RECUPERACIÓN (DESARROLLO):');
    console.log(url);
    console.log('=============================================\n');

    return {
      mensaje:
        'Si el correo está registrado, se enviará un enlace de recuperación.',
    };
  }

  async resetPassword(token: string, contrasena: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { recuperar_token: token },
    });

    if (!usuario || !usuario.recuperar_expira) {
      throw new BadRequestException(
        'El enlace de recuperación es inválido o ya fue utilizado.',
      );
    }

    const ahora = new Date();
    const expira = new Date(usuario.recuperar_expira);
    if (ahora > expira) {
      throw new BadRequestException('El enlace de recuperación ha expirado.');
    }

    const hash = await bcrypt.hash(contrasena, 10);

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        contraseña: hash,
        recuperar_token: null,
        recuperar_expira: null,
        intentos_fallidos: 0, // Reseteamos bloqueos por seguridad
        bloqueado_hasta: null,
      },
    });

    return { mensaje: 'Contraseña actualizada con éxito.' };
  }
}
