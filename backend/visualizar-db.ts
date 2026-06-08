import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('================================================');
  console.log('📊 RESUMEN DE LA BASE DE DATOS DE PRESTAMOS VGI');
  console.log('================================================\n');

  try {
    const roles = await prisma.rol.count();
    const empresas = await prisma.empresa.count();
    const gerencias = await prisma.gerencia.count();
    const areas = await prisma.area.count();
    const cargos = await prisma.cargo.count();
    const sedes = await prisma.sede.count();
    const usuarios = await prisma.usuario.count();
    const activos = await prisma.activo.count();
    const prestamos = await prisma.prestamo.count();

    console.log(`🔑 Roles:        ${roles}`);
    console.log(`🏢 Empresas:     ${empresas}`);
    console.log(`📈 Gerencias:    ${gerencias}`);
    console.log(`📁 Áreas:        ${areas}`);
    console.log(`👔 Cargos:       ${cargos}`);
    console.log(`📍 Sedes:        ${sedes}`);
    console.log(`👤 Usuarios:     ${usuarios}`);
    console.log(`💻 Activos:      ${activos}`);
    console.log(`🤝 Préstamos:    ${prestamos}\n`);

    console.log('------------------------------------------------');
    console.log('👥 LISTA DE USUARIOS REGISTRADOS:');
    console.log('------------------------------------------------');
    const listaUsuarios = await prisma.usuario.findMany({
      include: {
        rol: true,
        empresa: true
      }
    });

    if (listaUsuarios.length === 0) {
      console.log('No hay usuarios registrados.');
    } else {
      listaUsuarios.forEach(u => {
        console.log(`- [${u.id}] ${u.nombre} (${u.correo}) - Rol: ${u.rol.nombre} - Empresa: ${u.empresa?.nombre || 'Ninguna'}`);
      });
    }

    console.log('\n------------------------------------------------');
    console.log('📦 LISTA DE ACTIVOS (EQUIPOS/HARDWARE):');
    console.log('------------------------------------------------');
    const listaActivos = await prisma.activo.findMany({
      include: {
        empresa: true
      }
    });
    if (listaActivos.length === 0) {
      console.log('No hay activos registrados.');
    } else {
      listaActivos.forEach(a => {
        console.log(`- [ID: ${a.id}] ${a.tipo} - ${a.marca} ${a.modelo} (Serie: ${a.serie}) - Estado: ${a.estado} (${a.condicion || 'N/A'})`);
      });
    }

  } catch (error) {
    console.error('❌ Error al consultar la base de datos:', error);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
