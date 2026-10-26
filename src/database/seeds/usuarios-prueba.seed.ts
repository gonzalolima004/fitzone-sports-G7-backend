import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL no está definida en las variables de entorno');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PASSWORD = 'Asd12345.';

async function catalogos() {
  await prisma.ciudad.upsert({
    where: { id_ciudad: 1 },
    update: {},
    create: { id_ciudad: 1, nombre: 'Buenos Aires' },
  });

  await prisma.sede.upsert({
    where: { id_sede: 1 },
    update: {},
    create: {
      id_sede: 1,
      nombre: 'Sede Central',
      direccion: 'Av. Siempre Viva 123',
      aforo_maximo: 500,
      id_ciudad: 1,
    },
  });

  await prisma.usuarioEstado.upsert({
    where: { id_usuario_estado: 1 },
    update: {},
    create: { id_usuario_estado: 1, descripcion: 'Activo' },
  });

  // 4 roles del sistema (mismo id 3 que usará gerente.seed.ts de Joaquín)
  const roles = ['socio', 'recepcionista', 'gerente', 'externo'];
  for (const [i, nombre] of roles.entries()) {
    await prisma.rol.upsert({
      where: { id_rol: i + 1 },
      update: { nombre },
      create: { id_rol: i + 1, nombre },
    });
  }

  const estados = ['Activa', 'Vencida', 'Suspendida'];
  for (const [i, descripcion] of estados.entries()) {
    await prisma.membresiaEstado.upsert({
      where: { id_membresia_estado: i + 1 },
      update: { descripcion },
      create: { id_membresia_estado: i + 1, descripcion },
    });
  }

  const planes = [
    {
      id_membresia_plan: 1,
      nombre: 'Plan Mensual',
      duracion_dias: 30,
      precio: 40000,
    },
    {
      id_membresia_plan: 2,
      nombre: 'Plan Trimestral',
      duracion_dias: 90,
      precio: 105000,
    },
    {
      id_membresia_plan: 3,
      nombre: 'Plan Anual',
      duracion_dias: 365,
      precio: 360000,
    },
  ];
  for (const plan of planes) {
    await prisma.membresiaPlan.upsert({
      where: { id_membresia_plan: plan.id_membresia_plan },
      update: {},
      create: plan,
    });
  }
}

const USUARIOS = [
  {
    dni: '30000001',
    email: 'socio@fitzone.com',
    nombre: 'Sofía',
    apellido: 'Activa',
    rol: 1,
    membresia: 'activa',
  },
  {
    dni: '30000002',
    email: 'socio.vencido@fitzone.com',
    nombre: 'Victor',
    apellido: 'Vencido',
    rol: 1,
    membresia: 'vencida',
  },
  {
    dni: '30000003',
    email: 'externo@fitzone.com',
    nombre: 'Nico',
    apellido: 'Externo',
    rol: 4,
    membresia: null,
  },
  {
    dni: '30000004',
    email: 'recepcionista@fitzone.com',
    nombre: 'Rita',
    apellido: 'Recepcionista',
    rol: 2,
    membresia: null,
  },
  {
    dni: '30000005',
    email: 'gerente@fitzone.com',
    nombre: 'Gabriel',
    apellido: 'Gerente',
    rol: 3,
    membresia: null,
  },
];

async function usuarios() {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const hoy = new Date();
  const dias = (n: number) => new Date(hoy.getTime() + n * 86_400_000);

  for (const u of USUARIOS) {
    const usuario = await prisma.usuario.upsert({
      where: { email: u.email },
      update: { password: hash },
      create: {
        dni: u.dni,
        email: u.email,
        password: hash,
        nombre: u.nombre,
        apellido: u.apellido,
        id_sede: 1,
        id_usuario_estado: 1,
      },
    });

    await prisma.usuarioRol.upsert({
      where: {
        id_usuario_id_rol: {
          id_usuario: usuario.id_usuario,
          id_rol: u.rol,
        },
      },
      update: {},
      create: { id_usuario: usuario.id_usuario, id_rol: u.rol },
    });

    if (u.membresia) {
      const membresiaExistente = await prisma.membresia.findFirst({
        where: { id_usuario: usuario.id_usuario },
      });

      const activa = u.membresia === 'activa';
      const datosMembresia = {
        id_usuario: usuario.id_usuario,
        id_membresia_plan: 1,
        id_membresia_estado: activa ? 1 : 2,
        fecha_inicio: activa ? dias(-5) : dias(-45),
        fecha_fin: activa ? dias(25) : dias(-15),
      };

      if (membresiaExistente) {
        await prisma.membresia.update({
          where: { id_membresia: membresiaExistente.id_membresia },
          data: datosMembresia,
        });
      } else {
        await prisma.membresia.create({
          data: datosMembresia,
        });
      }
    }
  }
}

async function main() {
  await catalogos();
  await usuarios();
  console.log('Seed OK. Password de todos:', PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
