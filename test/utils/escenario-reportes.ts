import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Escenario de datos conocidos para las pruebas de integración de reportes.
 *
 * Período consultado: 2026-10-01 a 2026-10-14 inclusive
 * (`fechaHastaExclusiva` = 2026-10-15T00:00:00Z).
 *
 * Sedes: 1 "Centro", 2 "Norte", 3 "Sur" (sin actividad en el período).
 *
 * Ingresos esperados (pagos aprobados dentro del período):
 *   - Sede 1 (Centro): 1000 + 500 de membresía            = 1500
 *   - Sede 2 (Norte):  2000 de cancha                      = 2000
 *   - Excluidos: pago rechazado (999), pago pendiente (250),
 *     pago aprobado fuera de rango (300 el 15/10 y 700 el 30/09).
 *
 * Ocupación esperada:
 *   - Sede 1: 2 asistencias, 0 reservas de canchas confirmadas, 1 reserva de clase
 *   - Sede 2: 1 asistencia, 2 reservas de canchas confirmadas, 1 reserva de clase
 *   - Sede 3: sin actividad (no aparece)
 */
export const PERIODO_REPORTES = {
  fecha_desde: '2026-10-01',
  fecha_hasta: '2026-10-14',
  desde: new Date('2026-10-01T00:00:00.000Z'),
  hastaExclusiva: new Date('2026-10-15T00:00:00.000Z'),
};

export const INGRESOS_ESPERADOS = {
  total: 3500,
  porSede: [
    { id_sede: 1, nombre_sede: 'Centro', total_ingresos: 1500 },
    { id_sede: 2, nombre_sede: 'Norte', total_ingresos: 2000 },
  ],
  soloMembresias: [{ id_sede: 1, nombre_sede: 'Centro', total_ingresos: 1500 }],
  soloCanchas: [{ id_sede: 2, nombre_sede: 'Norte', total_ingresos: 2000 }],
};

export const OCUPACION_ESPERADA = [
  {
    id_sede: 1,
    nombre_sede: 'Centro',
    total_asistencias: 2,
    total_reservas_canchas: 0,
    total_reservas_clases: 1,
  },
  {
    id_sede: 2,
    nombre_sede: 'Norte',
    total_asistencias: 1,
    total_reservas_canchas: 2,
    total_reservas_clases: 1,
  },
];

const decimal = (valor: string | number) => new Prisma.Decimal(valor);
const fecha = (iso: string) => new Date(iso);

export async function sembrarEscenarioReportes(
  prisma: PrismaClient,
): Promise<void> {
  await prisma.ciudad.create({ data: { id_ciudad: 1, nombre: 'Concordia' } });

  await prisma.sede.createMany({
    data: [
      {
        id_sede: 1,
        nombre: 'Centro',
        direccion: 'Calle 1',
        aforo_maximo: 100,
        id_ciudad: 1,
      },
      {
        id_sede: 2,
        nombre: 'Norte',
        direccion: 'Calle 2',
        aforo_maximo: 100,
        id_ciudad: 1,
      },
      {
        id_sede: 3,
        nombre: 'Sur',
        direccion: 'Calle 3',
        aforo_maximo: 100,
        id_ciudad: 1,
      },
    ],
  });

  await prisma.usuarioEstado.create({
    data: { id_usuario_estado: 1, descripcion: 'Activo' },
  });

  await prisma.usuario.createMany({
    data: [
      {
        id_usuario: 1,
        dni: '10000001',
        email: 'socio.centro@test.local',
        password: 'x',
        nombre: 'Ana',
        apellido: 'Centro',
        id_sede: 1,
        id_usuario_estado: 1,
      },
      {
        id_usuario: 2,
        dni: '10000002',
        email: 'socio.norte@test.local',
        password: 'x',
        nombre: 'Bruno',
        apellido: 'Norte',
        id_sede: 2,
        id_usuario_estado: 1,
      },
    ],
  });

  await prisma.membresiaPlan.create({
    data: {
      id_membresia_plan: 1,
      nombre: 'Mensual',
      duracion_dias: 30,
      precio: decimal(1000),
    },
  });
  await prisma.membresiaEstado.create({
    data: { id_membresia_estado: 1, descripcion: 'Activa' },
  });
  await prisma.membresia.createMany({
    data: [
      {
        id_membresia: 1,
        id_usuario: 1,
        id_membresia_plan: 1,
        id_membresia_estado: 1,
        fecha_inicio: fecha('2026-10-01'),
        fecha_fin: fecha('2026-10-31'),
      },
      {
        id_membresia: 2,
        id_usuario: 2,
        id_membresia_plan: 1,
        id_membresia_estado: 1,
        fecha_inicio: fecha('2026-09-01'),
        fecha_fin: fecha('2026-09-30'),
      },
    ],
  });

  await prisma.canchaTipo.create({
    data: { id_cancha_tipo: 1, descripcion: 'Pádel' },
  });
  await prisma.cancha.createMany({
    data: [
      {
        id_cancha: 1,
        nombre: 'Pádel Norte 1',
        costo_base: decimal(2000),
        id_cancha_tipo: 1,
        id_sede: 2,
      },
      {
        id_cancha: 2,
        nombre: 'Pádel Centro 1',
        costo_base: decimal(2000),
        id_cancha_tipo: 1,
        id_sede: 1,
      },
    ],
  });
  await prisma.canchaReservaEstado.createMany({
    data: [
      { id_cancha_reserva_estado: 1, descripcion: 'Confirmada' },
      { id_cancha_reserva_estado: 2, descripcion: 'Cancelada' },
    ],
  });

  const reservaCanchaBase = {
    descuento_porcentaje: decimal(0),
    es_horario_pico: false,
    precio_congelado: decimal(2000),
  };
  await prisma.canchaReserva.createMany({
    data: [
      // Sede 2, confirmada, dentro del período
      {
        id_cancha_reserva: 1,
        id_cancha: 1,
        id_usuario: 1,
        id_cancha_reserva_estado: 1,
        fecha_inicio: fecha('2026-10-05T10:00:00.000Z'),
        fecha_fin: fecha('2026-10-05T11:00:00.000Z'),
        ...reservaCanchaBase,
      },
      // Sede 1, cancelada: no cuenta
      {
        id_cancha_reserva: 2,
        id_cancha: 2,
        id_usuario: 2,
        id_cancha_reserva_estado: 2,
        fecha_inicio: fecha('2026-10-06T10:00:00.000Z'),
        fecha_fin: fecha('2026-10-06T11:00:00.000Z'),
        ...reservaCanchaBase,
      },
      // Sede 2, confirmada, último instante del período
      {
        id_cancha_reserva: 3,
        id_cancha: 1,
        id_usuario: 2,
        id_cancha_reserva_estado: 1,
        fecha_inicio: fecha('2026-10-14T23:30:00.000Z'),
        fecha_fin: fecha('2026-10-15T00:30:00.000Z'),
        ...reservaCanchaBase,
      },
      // Sede 2, confirmada pero fuera del período (límite exclusivo)
      {
        id_cancha_reserva: 4,
        id_cancha: 1,
        id_usuario: 1,
        id_cancha_reserva_estado: 1,
        fecha_inicio: fecha('2026-10-15T00:00:00.000Z'),
        fecha_fin: fecha('2026-10-15T01:00:00.000Z'),
        ...reservaCanchaBase,
      },
      // Sede 1, confirmada pero anterior al período
      {
        id_cancha_reserva: 5,
        id_cancha: 2,
        id_usuario: 1,
        id_cancha_reserva_estado: 1,
        fecha_inicio: fecha('2026-09-30T23:59:59.000Z'),
        fecha_fin: fecha('2026-10-01T00:59:59.000Z'),
        ...reservaCanchaBase,
      },
    ],
  });

  await prisma.pagoEstado.createMany({
    data: [
      { id_pago_estado: 1, descripcion: 'Aprobado' },
      { id_pago_estado: 2, descripcion: 'Rechazado' },
      { id_pago_estado: 3, descripcion: 'Pendiente' },
    ],
  });
  await prisma.pago.createMany({
    data: [
      // Membresía sede 1, aprobado: cuenta (1000)
      {
        id_pago: 1,
        id_pago_estado: 1,
        id_membresia: 1,
        monto: decimal(1000),
        fecha_pago: fecha('2026-10-02T12:00:00.000Z'),
      },
      // Membresía sede 1, aprobado el último segundo del período: cuenta (500)
      {
        id_pago: 2,
        id_pago_estado: 1,
        id_membresia: 1,
        monto: decimal(500),
        fecha_pago: fecha('2026-10-14T23:59:59.000Z'),
      },
      // Membresía sede 1, rechazado: no cuenta
      {
        id_pago: 3,
        id_pago_estado: 2,
        id_membresia: 1,
        monto: decimal(999),
        fecha_pago: fecha('2026-10-03T12:00:00.000Z'),
      },
      // Cancha sede 2, aprobado: cuenta (2000)
      {
        id_pago: 4,
        id_pago_estado: 1,
        id_cancha_reserva: 1,
        monto: decimal(2000),
        fecha_pago: fecha('2026-10-05T09:00:00.000Z'),
      },
      // Cancha sede 2, aprobado fuera del período (límite exclusivo): no cuenta
      {
        id_pago: 5,
        id_pago_estado: 1,
        id_cancha_reserva: 3,
        monto: decimal(300),
        fecha_pago: fecha('2026-10-15T00:00:00.000Z'),
      },
      // Membresía sede 2, aprobado antes del período: no cuenta
      {
        id_pago: 6,
        id_pago_estado: 1,
        id_membresia: 2,
        monto: decimal(700),
        fecha_pago: fecha('2026-09-30T23:59:00.000Z'),
      },
      // Membresía sede 2, pendiente: no cuenta
      {
        id_pago: 7,
        id_pago_estado: 3,
        id_membresia: 2,
        monto: decimal(250),
        fecha_pago: fecha('2026-10-10T12:00:00.000Z'),
      },
    ],
  });

  await prisma.registroAcceso.createMany({
    data: [
      {
        id_registro_acceso: 1,
        id_usuario: 1,
        id_sede: 1,
        fecha_ingreso: fecha('2026-10-01T00:00:00.000Z'),
      },
      {
        id_registro_acceso: 2,
        id_usuario: 1,
        id_sede: 1,
        fecha_ingreso: fecha('2026-10-14T23:59:59.000Z'),
      },
      // Fuera del período (límite exclusivo)
      {
        id_registro_acceso: 3,
        id_usuario: 2,
        id_sede: 1,
        fecha_ingreso: fecha('2026-10-15T00:00:00.000Z'),
      },
      {
        id_registro_acceso: 4,
        id_usuario: 2,
        id_sede: 2,
        fecha_ingreso: fecha('2026-10-10T18:00:00.000Z'),
      },
    ],
  });

  await prisma.clase.createMany({
    data: [
      { id_clase: 1, id_sede: 1, capacidad_maxima: 20, nombre: 'Yoga' },
      { id_clase: 2, id_sede: 2, capacidad_maxima: 20, nombre: 'Spinning' },
    ],
  });
  await prisma.claseReservaEstado.createMany({
    data: [
      { id_clase_reserva_estado: 1, descripcion: 'Confirmada' },
      { id_clase_reserva_estado: 2, descripcion: 'Cancelada' },
      { id_clase_reserva_estado: 3, descripcion: 'CONFIRMADA' },
    ],
  });
  await prisma.claseReserva.createMany({
    data: [
      // Sede 1, confirmada: cuenta
      {
        id_clase_reserva: 1,
        id_clase: 1,
        id_usuario: 1,
        id_clase_reserva_estado: 1,
        fecha_inicio: fecha('2026-10-10T10:00:00.000Z'),
        fecha_fin: fecha('2026-10-10T11:00:00.000Z'),
      },
      // Sede 1, cancelada: no cuenta
      {
        id_clase_reserva: 2,
        id_clase: 1,
        id_usuario: 2,
        id_clase_reserva_estado: 2,
        fecha_inicio: fecha('2026-10-10T10:00:00.000Z'),
        fecha_fin: fecha('2026-10-10T11:00:00.000Z'),
      },
      // Sede 2, estado en mayúsculas: cuenta (comparación insensible)
      {
        id_clase_reserva: 3,
        id_clase: 2,
        id_usuario: 2,
        id_clase_reserva_estado: 3,
        fecha_inicio: fecha('2026-10-12T10:00:00.000Z'),
        fecha_fin: fecha('2026-10-12T11:00:00.000Z'),
      },
      // Sede 1, confirmada pero fuera del período: no cuenta
      {
        id_clase_reserva: 4,
        id_clase: 1,
        id_usuario: 1,
        id_clase_reserva_estado: 1,
        fecha_inicio: fecha('2026-10-15T00:00:00.000Z'),
        fecha_fin: fecha('2026-10-15T01:00:00.000Z'),
      },
    ],
  });
}
