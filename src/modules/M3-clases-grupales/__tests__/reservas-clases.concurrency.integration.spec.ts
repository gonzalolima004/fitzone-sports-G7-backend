import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import {
  AppDePruebas,
  crearAppDePruebas,
} from '../../../../test/utils/app-de-pruebas';
import { ClasesGrupalesModule } from '../clases-grupales.module';
import { SupabaseService } from '../../../common/supabase/supabase.service';

type ReservaRespuesta = {
  id_clase_reserva: number;
  id_clase: number;
  id_usuario: number;
  id_clase_reserva_estado: number;
  fecha_inicio: string;
  fecha_fin: string;
};

type ErrorRespuesta = {
  statusCode: number;
  message: string | string[];
};

type ListaEsperaRespuesta = {
  message: string;
  orden_en_cola: number;
  inscripcion: {
    id_clase_lista_espera: number;
    id_clase: number;
    id_usuario: number;
    id_clase_lista_espera_estado: number;
  };
};

type CancelarReservaRespuesta = {
  penalidadAplicada: boolean;
  mensaje: string;
  cupo_reasignado: boolean;
};

describe('Reservas de clases grupales (concurrencia y lista de espera)', () => {
  let contexto: AppDePruebas;
  let tokenSocio1: string;
  let tokenSocio2: string;
  let tokenSocio3: string;

  const sembrar = async (prisma: PrismaClient) => {
    // 1. Catálogos base
    await prisma.ciudad.create({
      data: { id_ciudad: 1, nombre: 'Concordia' },
    });

    await prisma.sede.create({
      data: {
        id_sede: 1,
        nombre: 'Sede Central',
        direccion: 'Av. Siempre Viva 123',
        aforo_maximo: 50,
        id_ciudad: 1,
      },
    });

    await prisma.usuarioEstado.create({
      data: { id_usuario_estado: 1, descripcion: 'Activo' },
    });

    await prisma.rol.create({
      data: { id_rol: 1, nombre: 'socio' },
    });

    await prisma.membresiaEstado.createMany({
      data: [
        { id_membresia_estado: 1, descripcion: 'Activa' },
        { id_membresia_estado: 2, descripcion: 'Vencida' },
        { id_membresia_estado: 3, descripcion: 'Suspendida' },
      ],
    });

    await prisma.membresiaPlan.create({
      data: {
        id_membresia_plan: 1,
        nombre: 'Plan Full',
        duracion_dias: 30,
        precio: 10000,
      },
    });

    await prisma.claseReservaEstado.createMany({
      data: [
        { id_clase_reserva_estado: 1, descripcion: 'Confirmada' },
        { id_clase_reserva_estado: 2, descripcion: 'En Espera' },
        { id_clase_reserva_estado: 3, descripcion: 'Completada' },
        { id_clase_reserva_estado: 4, descripcion: 'Cancelada' },
      ],
    });

    await prisma.claseListaEsperaEstado.createMany({
      data: [
        { id_clase_lista_espera_estado: 1, descripcion: 'En espera' },
        { id_clase_lista_espera_estado: 2, descripcion: 'Promovida' },
        { id_clase_lista_espera_estado: 3, descripcion: 'Cancelada' },
      ],
    });

    // 2. Tres socios competidores
    await prisma.usuario.createMany({
      data: [
        {
          id_usuario: 1,
          id_sede: 1,
          id_usuario_estado: 1,
          nombre: 'Socio',
          apellido: 'Uno',
          dni: '11111111',
          email: 'socio1@test.local',
          password: 'hash1',
        },
        {
          id_usuario: 2,
          id_sede: 1,
          id_usuario_estado: 1,
          nombre: 'Socio',
          apellido: 'Dos',
          dni: '22222222',
          email: 'socio2@test.local',
          password: 'hash2',
        },
        {
          id_usuario: 3,
          id_sede: 1,
          id_usuario_estado: 1,
          nombre: 'Socio',
          apellido: 'Tres',
          dni: '33333333',
          email: 'socio3@test.local',
          password: 'hash3',
        },
      ],
    });

    await prisma.usuarioRol.createMany({
      data: [
        { id_usuario: 1, id_rol: 1 },
        { id_usuario: 2, id_rol: 1 },
        { id_usuario: 3, id_rol: 1 },
      ],
    });

    // 3. Membresías vigentes (cumplen RN-03)
    const hoy = new Date();
    const finMembresia = new Date(hoy.getTime() + 30 * 24 * 3600000);
    await prisma.membresia.createMany({
      data: [
        {
          id_membresia: 1,
          id_usuario: 1,
          id_membresia_plan: 1,
          id_membresia_estado: 1,
          fecha_inicio: hoy,
          fecha_fin: finMembresia,
        },
        {
          id_membresia: 2,
          id_usuario: 2,
          id_membresia_plan: 1,
          id_membresia_estado: 1,
          fecha_inicio: hoy,
          fecha_fin: finMembresia,
        },
        {
          id_membresia: 3,
          id_usuario: 3,
          id_membresia_plan: 1,
          id_membresia_estado: 1,
          fecha_inicio: hoy,
          fecha_fin: finMembresia,
        },
      ],
    });

    // 4. Clase con capacidad máxima de 1 solo cupo
    await prisma.clase.create({
      data: {
        id_clase: 1,
        id_sede: 1,
        capacidad_maxima: 1, // Solo 1 cupo disponible
        nombre: 'Spinning Exclusivo',
        descripcion: 'Clase con cupo único para test de concurrencia',
        activo: true,
        horario_inicio: '10:00',
        horario_fin: '11:00',
        dias_semana: [0, 1, 2, 3, 4, 5, 6],
      },
    });
  };

  beforeAll(async () => {
    contexto = await crearAppDePruebas([ClasesGrupalesModule], sembrar);
    const supabaseService = contexto.app.get(SupabaseService);
    jest
      .spyOn(supabaseService, 'emitRealtimeEvent')
      .mockResolvedValue(undefined);

    tokenSocio1 = contexto.tokenConRol('socio', 1);
    tokenSocio2 = contexto.tokenConRol('socio', 2);
    tokenSocio3 = contexto.tokenConRol('socio', 3);
  });

  afterAll(async () => {
    await contexto?.cerrar();
  });

  it('ante dos solicitudes concurrentes para una clase con 1 solo cupo, solo uno confirma la reserva y el otro recibe 409 y pasa a lista de espera', async () => {
    // Horario válido: mañana a las 10:00 (dentro de las 48h)
    const manana = new Date(Date.now() + 24 * 3600000);
    manana.setHours(10, 0, 0, 0);
    const mananaFin = new Date(manana.getTime() + 3600000);

    const dtoReserva = {
      id_clase: 1,
      fecha_inicio: manana.toISOString(),
      fecha_fin: mananaFin.toISOString(),
    };

    // 1. Disparamos ambas peticiones concurrentemente con Promise.all
    const [res1, res2] = await Promise.all([
      request(contexto.app.getHttpServer())
        .post('/reservas-clases')
        .set('Authorization', `Bearer ${tokenSocio1}`)
        .send(dtoReserva),
      request(contexto.app.getHttpServer())
        .post('/reservas-clases')
        .set('Authorization', `Bearer ${tokenSocio2}`)
        .send(dtoReserva),
    ]);

    // 2. Exactamente uno debió pasar con 201 y el otro ser rechazado con 409 (Conflicto por cupo lleno)
    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([201, 409]);

    const resGanadora = res1.status === 201 ? res1 : res2;
    const resPerdedora = res1.status === 409 ? res1 : res2;
    const cuerpoGanador = resGanadora.body as ReservaRespuesta;
    const cuerpoPerdedor = resPerdedora.body as ErrorRespuesta;

    expect(cuerpoGanador).toHaveProperty('id_clase_reserva');
    expect(cuerpoGanador.id_clase_reserva_estado).toBe(1);
    expect(cuerpoPerdedor.message).toContain(
      'El cupo máximo para esta clase ya está lleno.',
    );

    // 3. Verificamos que la BD contenga exactamente 1 reserva confirmada
    const reservasEnDb = await contexto.base.prisma.claseReserva.findMany({
      where: { id_clase: 1 },
    });
    expect(reservasEnDb).toHaveLength(1);
    expect(reservasEnDb[0].id_clase_reserva_estado).toBe(1);

    // 4. El socio que fue rechazado se inscribe en la lista de espera
    const socioRechazadoToken = res1.status === 409 ? tokenSocio1 : tokenSocio2;
    const idSocioRechazado = res1.status === 409 ? 1 : 2;

    const resListaEspera = await request(contexto.app.getHttpServer())
      .post('/lista-espera/inscribir')
      .set('Authorization', `Bearer ${socioRechazadoToken}`)
      .send(dtoReserva);

    const cuerpoListaEspera = resListaEspera.body as ListaEsperaRespuesta;
    expect(resListaEspera.status).toBe(201);
    expect(cuerpoListaEspera.orden_en_cola).toBe(1);
    expect(cuerpoListaEspera.message).toContain(
      'Inscripto correctamente a la lista de espera',
    );

    // 5. Verificamos que en la tabla clase_lista_espera exista el socio con estado 1 (En espera)
    const listaEsperaDb = await contexto.base.prisma.claseListaEspera.findMany({
      where: { id_clase: 1 },
    });
    expect(listaEsperaDb).toHaveLength(1);
    expect(listaEsperaDb[0].id_usuario).toBe(idSocioRechazado);
    expect(listaEsperaDb[0].id_clase_lista_espera_estado).toBe(1);

    // 6. Un tercer socio intenta reservar y también es rechazado con 409, inscribiéndose en puesto 2
    const resIntento3 = await request(contexto.app.getHttpServer())
      .post('/reservas-clases')
      .set('Authorization', `Bearer ${tokenSocio3}`)
      .send(dtoReserva);
    expect(resIntento3.status).toBe(409);

    const resEspera3 = await request(contexto.app.getHttpServer())
      .post('/lista-espera/inscribir')
      .set('Authorization', `Bearer ${tokenSocio3}`)
      .send(dtoReserva);
    const cuerpoEspera3 = resEspera3.body as ListaEsperaRespuesta;
    expect(resEspera3.status).toBe(201);
    expect(cuerpoEspera3.orden_en_cola).toBe(2);

    // 7. El socio ganador cancela su reserva: se debe promover automáticamente al socio en puesto 1
    const idReservaGanadora = cuerpoGanador.id_clase_reserva;
    const tokenSocioGanador = res1.status === 201 ? tokenSocio1 : tokenSocio2;

    const resCancelacion = await request(contexto.app.getHttpServer())
      .delete(`/reservas-clases/${idReservaGanadora}`)
      .set('Authorization', `Bearer ${tokenSocioGanador}`);

    const cuerpoCancelacion = resCancelacion.body as CancelarReservaRespuesta;
    expect(resCancelacion.status).toBe(200);
    expect(cuerpoCancelacion.cupo_reasignado).toBe(true);

    // El socio rechazado original ahora debe tener una reserva confirmada activa
    const reservasActualizadas =
      await contexto.base.prisma.claseReserva.findMany({
        where: { id_clase: 1, id_clase_reserva_estado: 1 },
      });
    expect(reservasActualizadas).toHaveLength(1);
    expect(reservasActualizadas[0].id_usuario).toBe(idSocioRechazado);

    // La inscripción del socio promovido pasa a estado 2 (Promovida)
    const inscripcionPromovida =
      await contexto.base.prisma.claseListaEspera.findFirst({
        where: { id_usuario: idSocioRechazado },
      });
    expect(inscripcionPromovida?.id_clase_lista_espera_estado).toBe(2);
  });
});
