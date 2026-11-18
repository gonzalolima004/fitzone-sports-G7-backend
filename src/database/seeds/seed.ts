import 'dotenv/config';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { createClient, User } from '@supabase/supabase-js';

const PASSWORD_USUARIOS = 'Asd12345.';

const roles = [
  { id_rol: 1, nombre: 'socio' },
  { id_rol: 2, nombre: 'recepcionista' },
  { id_rol: 3, nombre: 'gerente' },
  { id_rol: 4, nombre: 'externo' },
];

const usuarioEstados = [
  { id_usuario_estado: 1, descripcion: 'Activo' },
  { id_usuario_estado: 3, descripcion: 'Desactivado' },
];

const membresiaPlanes = [
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

const membresiaEstados = [
  { id_membresia_estado: 1, descripcion: 'Activa' },
  { id_membresia_estado: 2, descripcion: 'Vencida' },
  { id_membresia_estado: 3, descripcion: 'Suspendida' },
];

const pagoEstados = [
  { id_pago_estado: 1, descripcion: 'Pendiente' },
  { id_pago_estado: 2, descripcion: 'Aprobado' },
  { id_pago_estado: 3, descripcion: 'Rechazado' },
];

const canchaTipos = [
  { id_cancha_tipo: 1, descripcion: 'Pádel', activo: true },
  { id_cancha_tipo: 2, descripcion: 'Fútbol 5', activo: true },
  { id_cancha_tipo: 3, descripcion: 'Tenis', activo: false },
];

const canchaReservaEstados = [
  { id_cancha_reserva_estado: 1, descripcion: 'Pendiente de Pago' },
  { id_cancha_reserva_estado: 2, descripcion: 'Confirmada' },
];

const claseReservaEstados = [
  { id_clase_reserva_estado: 1, descripcion: 'Confirmada' },
  { id_clase_reserva_estado: 2, descripcion: 'En espera' },
  { id_clase_reserva_estado: 3, descripcion: 'Completada' },
  { id_clase_reserva_estado: 4, descripcion: 'Cancelada' },
];

const claseListaEsperaEstados = [
  { id_clase_lista_espera_estado: 1, descripcion: 'En espera' },
  { id_clase_lista_espera_estado: 2, descripcion: 'Promovida' },
  { id_clase_lista_espera_estado: 3, descripcion: 'Cancelada' },
];

const ciudades = [
  { id_ciudad: 1, nombre: 'Concordia', activo: true },
  { id_ciudad: 2, nombre: 'Paraná', activo: true },
  { id_ciudad: 3, nombre: 'Gualeguaychú', activo: true },
  { id_ciudad: 4, nombre: 'Concepción del Uruguay', activo: true },
  { id_ciudad: 5, nombre: 'Gualeguay', activo: true },
  { id_ciudad: 6, nombre: 'Villaguay', activo: true },
  { id_ciudad: 7, nombre: 'Chajarí', activo: true },
  { id_ciudad: 8, nombre: 'Colón', activo: true },
  { id_ciudad: 9, nombre: 'Victoria', activo: true },
  { id_ciudad: 10, nombre: 'La Paz', activo: true },
  { id_ciudad: 11, nombre: 'Nogoyá', activo: true },
  { id_ciudad: 12, nombre: 'Diamante', activo: true },
  { id_ciudad: 13, nombre: 'Crespo', activo: true },
  { id_ciudad: 14, nombre: 'Federación', activo: true },
  { id_ciudad: 15, nombre: 'Federal', activo: true },
  { id_ciudad: 16, nombre: 'San José', activo: true },
];

// [id_sede, nombre, direccion, aforo_maximo, id_ciudad]
const sedes: [number, string, string, number, number][] = [
  [1, 'Sede Central Concordia', 'Av. Eva Perón 1420', 350, 1],
  [2, 'Sede Sur Concordia', 'Av. Monseñor Tavella 2100', 220, 1],
  [3, 'Sede Norte Concordia', 'San Lorenzo Oeste 1221', 200, 1],
  [4, 'Sede Paraná Centro', 'San Martín 650', 280, 2],
  [5, 'Sede Parque Urquiza Paraná', 'Costanera Baja 420', 200, 2],
  [6, 'Sede Paraná Este', 'Av. Almafuerte 1420', 220, 2],
  [7, 'Sede Gualeguaychú Centro', '25 de Mayo 430', 250, 3],
  [8, 'Sede Costanera Gualeguaychú', 'Av. Morrogh Bernard 210', 190, 3],
  [9, 'Sede CdU Centro', '9 de Julio 820', 240, 4],
  [10, 'Sede CdU Puerto', 'Av. Paysandú 150', 180, 4],
  [11, 'Sede Gualeguay Centro', 'San Antonio Norte 110', 180, 5],
  [12, 'Sede Gualeguay Norte', 'Paso de Navas 340', 160, 5],
  [13, 'Sede Villaguay Centro', 'Balcarce 320', 170, 6],
  [14, 'Sede Chajarí Termas', 'Av. Padre Gallay 890', 200, 7],
  [15, 'Sede Chajarí Centro', 'Urquiza 1040', 170, 7],
  [16, 'Sede Colón Costanera', 'Av. Quirós 280', 200, 8],
  [17, 'Sede Colón Centro', '12 de Abril 410', 170, 8],
  [18, 'Sede Victoria Colina', 'San Martín 540', 180, 9],
  [19, 'Sede La Paz Ribera', 'Italia 720', 160, 10],
  [20, 'Sede Nogoyá Centro', 'Caseros 850', 170, 11],
  [21, 'Sede Diamante Costa', 'Sarmiento 390', 160, 12],
  [22, 'Sede Crespo Centro', 'Av. Independencia 620', 180, 13],
  [23, 'Sede Federación Termal', 'Av. Las Hortensias 430', 190, 14],
  [24, 'Sede Federal Centro', 'Belgrano 510', 150, 15],
  [25, 'Sede San José Histórica', 'Centenario 680', 160, 16],
  [26, 'Sede Nebel', 'Av. Castro 15500\r\n', 350, 1],
];

// [id_sede_horario, id_sede, dia_semana, hora_apertura, hora_cierre, abierto]
const sedeHorarios: [number, number, number, string, string, boolean][] = [
  [1, 2, 1, '07:00', '23:00', true],
  [2, 2, 2, '07:00', '23:00', true],
  [3, 2, 3, '07:00', '23:00', true],
  [4, 2, 4, '07:00', '23:00', true],
  [5, 2, 5, '07:00', '23:00', true],
  [6, 2, 6, '08:00', '22:00', true],
  [7, 2, 0, '09:00', '21:00', true],
  [8, 3, 1, '08:00', '21:00', true],
  [9, 3, 2, '08:00', '21:00', true],
  [10, 3, 3, '08:00', '21:00', true],
  [11, 3, 4, '08:00', '21:00', true],
  [12, 3, 5, '08:00', '21:00', true],
  [13, 3, 6, '08:00', '21:00', true],
  [14, 3, 0, '00:00', '00:00', false],
];

// [id_usuario, dni, email, nombre, apellido, id_sede, id_rol]
const usuarios: [number, string, string, string, string, number, number][] = [
  [25, '30000001', 'socio@fitzone.com', 'Sofía', 'Activa', 1, 1],
  [28, '30000003', 'externo@fitzone.com', 'Nico', 'Externo', 1, 4],
  [29, '30000004', 'recepcionista@fitzone.com', 'Rita', 'Recepcionista', 1, 2],
  [30, '30000005', 'gerente@fitzone.com', 'Gabriel', 'Gerente', 1, 3],
];

/** Catálogos simples: (id, ...columnas) con upsert por PK. */
async function upsertRows(
  pool: Pool,
  tabla: string,
  columnas: string[],
  filas: unknown[][],
) {
  const pk = columnas[0];
  const setters = columnas
    .slice(1)
    .map((c) => `"${c}" = EXCLUDED."${c}"`)
    .join(', ');
  const cols = columnas.map((c) => `"${c}"`).join(', ');
  const params = columnas.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `INSERT INTO "${tabla}" (${cols}) VALUES (${params})
               ON CONFLICT ("${pk}") DO UPDATE SET ${setters}`;
  for (const fila of filas) {
    await pool.query(sql, fila);
  }
  console.log(`  ✅ ${tabla}: ${filas.length} registros`);
}

/** Reajusta la secuencia SERIAL para que los próximos INSERT no choquen con los IDs fijos. */
async function resetSecuencia(pool: Pool, tabla: string, columna: string) {
  await pool.query(
    `SELECT setval(pg_get_serial_sequence('"${tabla}"', '${columna}'),
            COALESCE((SELECT MAX("${columna}") FROM "${tabla}"), 1), true)`,
  );
}

export async function seed() {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL no esta definida en las variables de entorno.',
    );
  }

  const pool = new Pool({ connectionString });
  console.log('🌱 Iniciando seed...');

  try {
    await pool.query('BEGIN');

    await upsertRows(
      pool,
      'rol',
      ['id_rol', 'nombre'],
      roles.map((r) => [r.id_rol, r.nombre]),
    );
    await upsertRows(
      pool,
      'usuario_estado',
      ['id_usuario_estado', 'descripcion'],
      usuarioEstados.map((r) => [r.id_usuario_estado, r.descripcion]),
    );
    await upsertRows(
      pool,
      'membresia_plan',
      ['id_membresia_plan', 'nombre', 'duracion_dias', 'precio'],
      membresiaPlanes.map((r) => [
        r.id_membresia_plan,
        r.nombre,
        r.duracion_dias,
        r.precio,
      ]),
    );
    await upsertRows(
      pool,
      'membresia_estado',
      ['id_membresia_estado', 'descripcion'],
      membresiaEstados.map((r) => [r.id_membresia_estado, r.descripcion]),
    );
    await upsertRows(
      pool,
      'pago_estado',
      ['id_pago_estado', 'descripcion'],
      pagoEstados.map((r) => [r.id_pago_estado, r.descripcion]),
    );
    await upsertRows(
      pool,
      'cancha_tipo',
      ['id_cancha_tipo', 'descripcion', 'activo'],
      canchaTipos.map((r) => [r.id_cancha_tipo, r.descripcion, r.activo]),
    );
    await upsertRows(
      pool,
      'cancha_reserva_estado',
      ['id_cancha_reserva_estado', 'descripcion'],
      canchaReservaEstados.map((r) => [
        r.id_cancha_reserva_estado,
        r.descripcion,
      ]),
    );
    await upsertRows(
      pool,
      'clase_reserva_estado',
      ['id_clase_reserva_estado', 'descripcion'],
      claseReservaEstados.map((r) => [
        r.id_clase_reserva_estado,
        r.descripcion,
      ]),
    );
    await upsertRows(
      pool,
      'clase_lista_espera_estado',
      ['id_clase_lista_espera_estado', 'descripcion'],
      claseListaEsperaEstados.map((r) => [
        r.id_clase_lista_espera_estado,
        r.descripcion,
      ]),
    );
    await upsertRows(
      pool,
      'ciudad',
      ['id_ciudad', 'nombre', 'activo'],
      ciudades.map((r) => [r.id_ciudad, r.nombre, r.activo]),
    );
    await upsertRows(
      pool,
      'sede',
      ['id_sede', 'nombre', 'direccion', 'aforo_maximo', 'activo', 'id_ciudad'],
      sedes.map(([id, nombre, direccion, aforo, ciudad]) => [
        id,
        nombre,
        direccion,
        aforo,
        true,
        ciudad,
      ]),
    );
    await upsertRows(
      pool,
      'sede_horario',
      [
        'id_sede_horario',
        'id_sede',
        'dia_semana',
        'hora_apertura',
        'hora_cierre',
        'abierto',
      ],
      sedeHorarios,
    );

    // Usuarios de prueba (misma contraseña para todos)
    const hash = await bcrypt.hash(PASSWORD_USUARIOS, 10);
    for (const [id, dni, email, nombre, apellido, idSede, idRol] of usuarios) {
      await pool.query(
        `INSERT INTO "usuario"
           ("id_usuario","dni","email","password","nombre","apellido","id_sede","id_usuario_estado","modificado")
         VALUES ($1,$2,$3,$4,$5,$6,$7,1,NOW())
         ON CONFLICT ("id_usuario") DO UPDATE SET
           "dni"=EXCLUDED."dni","email"=EXCLUDED."email","password"=EXCLUDED."password",
           "nombre"=EXCLUDED."nombre","apellido"=EXCLUDED."apellido",
           "id_sede"=EXCLUDED."id_sede","id_usuario_estado"=1,"modificado"=NOW()`,
        [id, dni, email, hash, nombre, apellido, idSede],
      );
      await pool.query(
        `INSERT INTO "usuario_rol" ("id_usuario","id_rol") VALUES ($1,$2)
         ON CONFLICT ("id_usuario","id_rol") DO NOTHING`,
        [id, idRol],
      );
    }
    console.log(`  ✅ usuario / usuario_rol: ${usuarios.length} registros`);

    // Cerrar ingresos abiertos para evitar bloqueos 409/400 al probar accesos
    await pool.query(
      `UPDATE "registro_accesos" SET "fecha_egreso" = NOW() WHERE "fecha_egreso" IS NULL`,
    );
    console.log('  ✅ registro_accesos: ingresos abiertos cerrados');

    // Secuencias
    const secuencias: [string, string][] = [
      ['rol', 'id_rol'],
      ['usuario_estado', 'id_usuario_estado'],
      ['membresia_plan', 'id_membresia_plan'],
      ['membresia_estado', 'id_membresia_estado'],
      ['pago_estado', 'id_pago_estado'],
      ['cancha_tipo', 'id_cancha_tipo'],
      ['cancha_reserva_estado', 'id_cancha_reserva_estado'],
      ['clase_reserva_estado', 'id_clase_reserva_estado'],
      ['clase_lista_espera_estado', 'id_clase_lista_espera_estado'],
      ['ciudad', 'id_ciudad'],
      ['sede', 'id_sede'],
      ['sede_horario', 'id_sede_horario'],
      ['usuario', 'id_usuario'],
    ];
    for (const [tabla, columna] of secuencias) {
      await resetSecuencia(pool, tabla, columna);
    }
    console.log('  ✅ secuencias reajustadas');

    await pool.query('COMMIT');

    // Sincronizar usuarios de prueba en Supabase Auth (para login desde el frontend)
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceRoleKey) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: listData, error: listError } =
        await supabaseAdmin.auth.admin.listUsers({
          perPage: 1000,
        });
      const existingUsers: User[] = listError ? [] : listData.users;
      const existingByEmail = new Map<string, string>(
        existingUsers.map((u): [string, string] => [
          (u.email ?? '').toLowerCase(),
          u.id,
        ]),
      );

      for (const [, , email, nombre, apellido] of usuarios) {
        const existingId = existingByEmail.get(email.toLowerCase());
        if (existingId) {
          await supabaseAdmin.auth.admin.updateUserById(existingId, {
            password: PASSWORD_USUARIOS,
            email_confirm: true,
            user_metadata: { full_name: `${nombre} ${apellido}` },
          });
        } else {
          await supabaseAdmin.auth.admin.createUser({
            email,
            password: PASSWORD_USUARIOS,
            email_confirm: true,
            user_metadata: { full_name: `${nombre} ${apellido}` },
          });
        }
      }
      console.log(
        `  ✅ auth.users (Supabase Auth): ${usuarios.length} usuarios sincronizados`,
      );
    } else {
      console.warn(
        '  ⚠️ No se sincronizó Supabase Auth (faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY)',
      );
    }

    console.log('🎉 Seed completado.');
    console.log(
      `   Usuarios: gerente@, recepcionista@, socio@, externo@fitzone.com | contraseña: ${PASSWORD_USUARIOS}`,
    );
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
