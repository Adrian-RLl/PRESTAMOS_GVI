import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Crear Roles
  const roles = ['Administrador', 'Analista TI', 'Usuario'];
  for (const nombre of roles) {
    const exists = await prisma.rol.findFirst({ where: { nombre } });
    if (!exists) {
      await prisma.rol.create({ data: { nombre } });
    }
  }

  // Crear Empresa por defecto
  let empresa = await prisma.empresa.findFirst();
  if (!empresa) {
    empresa = await prisma.empresa.create({ data: { nombre: 'VGI' } });
  }

  // Crear Area por defecto
  let area = await prisma.area.findFirst();
  if (!area) {
    area = await prisma.area.create({ data: { nombre: 'Sistemas' } });
  }

  // Crear Cargo por defecto
  let cargo = await prisma.cargo.findFirst();
  if (!cargo) {
    cargo = await prisma.cargo.create({ data: { nombre: 'Jefe de Sistemas' } });
  }

  // Comprobar si el usuario admin ya existe
  const adminRol = await prisma.rol.findFirst({ where: { nombre: 'Administrador' } });
  const existingUser = await prisma.usuario.findUnique({
    where: { correo: 'admin@vanguardfresh.pe' }
  });

  if (!existingUser && adminRol) {
    const hashPassword = await bcrypt.hash('admin123', 10);
    
    await prisma.usuario.create({
      data: {
        nombre: 'Administrador VGI',
        correo: 'admin@vanguardfresh.pe',
        username: 'adminvgi',
        contraseña: hashPassword,
        rol_id: adminRol.id,
        empresa_id: empresa.id,
        area_id: area.id,
        cargo_id: cargo.id,
      }
    });
    console.log('✅ Usuario Administrador creado exitosamente.');
    console.log('Username: adminvgi');
    console.log('Correo: admin@vanguardfresh.pe');
    console.log('Contraseña: admin123');
  } else {
    console.log('El usuario admin ya existe en la base de datos.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
