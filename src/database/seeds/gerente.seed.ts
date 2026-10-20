import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function seedGerente() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL no esta definida en las variables de entorno.',
    );
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('🌱 Iniciando seed de usuario con rol Gerente...');

  try {
    const email = process.env.GERENTE_SEED_EMAIL || 'gerente@fitzone.com';
    const rawPassword = process.env.GERENTE_SEED_PASSWORD;

    if (!rawPassword) {
      throw new Error(
        '❌ [SEGURIDAD] La variable de entorno GERENTE_SEED_PASSWORD no está definida en el archivo .env. ' +
          'Por favor, define una contraseña segura en tu .env antes de ejecutar este seed.',
      );
    }

    const dni = process.env.GERENTE_SEED_DNI || '10000003';
    const nombre = 'Gerente';
    const apellido = 'FitZone';
    const telefono = '+549110000000';

    // 1. Obtener o verificar el rol 'gerente'
    let rolGerente = await prisma.rol.findFirst({
      where: {
        nombre: {
          equals: 'gerente',
          mode: 'insensitive',
        },
      },
    });

    if (!rolGerente) {
      console.log(
        '⚠️ Rol "gerente" no encontrado. Creando rol en tabla rol...',
      );
      rolGerente = await prisma.rol.create({
        data: {
          nombre: 'gerente',
        },
      });
    }

    // 2. Verificar existencia de sede por defecto (id_sede: 1)
    let sedeDefecto = await prisma.sede.findUnique({
      where: { id_sede: 1 },
    });

    if (!sedeDefecto) {
      sedeDefecto = await prisma.sede.findFirst({
        where: { activo: true },
      });

      if (!sedeDefecto) {
        throw new Error(
          'No se encontró ninguna sede activa en la base de datos para asociar al Gerente.',
        );
      }
    }

    // 3. Hashear la contraseña con bcryptjs
    const passwordHasheada = await bcrypt.hash(rawPassword, 10);

    // 4. Búsqueda idempotente de usuario por email o dni
    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        OR: [{ email }, { dni }],
      },
      include: {
        usuario_rol: true,
      },
    });

    let idUsuario: number;

    if (!usuarioExistente) {
      const nuevoUsuario = await prisma.usuario.create({
        data: {
          dni,
          email,
          password: passwordHasheada,
          nombre,
          apellido,
          telefono,
          id_sede: sedeDefecto.id_sede,
          id_usuario_estado: 1, // 1 = Activo
        },
      });

      idUsuario = nuevoUsuario.id_usuario;
      console.log(
        `✅ Usuario Gerente creado exitosamente con ID: ${idUsuario} (${email})`,
      );
    } else {
      idUsuario = usuarioExistente.id_usuario;
      await prisma.usuario.update({
        where: { id_usuario: idUsuario },
        data: {
          password: passwordHasheada,
          id_sede: sedeDefecto.id_sede,
          id_usuario_estado: 1,
        },
      });
      console.log(
        `ℹ️ Usuario Gerente ya existente (ID: ${idUsuario}, ${email}). Datos y contraseña actualizados.`,
      );
    }

    // 5. Asignar rol de gerente de manera idempotente
    const tieneRol = await prisma.usuarioRol.findUnique({
      where: {
        id_usuario_id_rol: {
          id_usuario: idUsuario,
          id_rol: rolGerente.id_rol,
        },
      },
    });

    if (!tieneRol) {
      await prisma.usuarioRol.create({
        data: {
          id_usuario: idUsuario,
          id_rol: rolGerente.id_rol,
        },
      });
      console.log(
        `✅ Rol "gerente" (id_rol: ${rolGerente.id_rol}) asignado al usuario ${idUsuario}.`,
      );
    } else {
      console.log(`ℹ️ El usuario ya poseía el rol "gerente" asignado.`);
    }

    console.log('🎉 Seed de Gerente completado exitosamente.');
    console.log(
      `   Usuario aprovisionado: ${email} (contraseña configurada desde .env)`,
    );
  } catch (error) {
    console.error('❌ Error durante la ejecución del seed de gerente:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

if (require.main === module) {
  seedGerente()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
