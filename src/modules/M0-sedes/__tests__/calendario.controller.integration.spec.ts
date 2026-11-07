import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { SedesModule } from '../sedes.module';
import {
  AppDePruebas,
  crearAppDePruebas,
} from '../../../../test/utils/app-de-pruebas';

type FechaRespuesta = {
  id_calendario: number;
  fecha: string;
  descripcion: string | null;
  es_feriado: boolean;
  es_dia_habil: boolean;
};

type ExcepcionRespuesta = {
  id_calendario_sede: number;
  id_sede: number;
  id_calendario: number;
  fecha: string;
  cerrado: boolean;
  hora_apertura: string | null;
  hora_cierre: string | null;
  motivo: string | null;
  calendario: FechaRespuesta;
};

type HorarioRespuesta = {
  id_sede_horario: number;
  id_sede: number;
  dia_semana: number;
  hora_apertura: string;
  hora_cierre: string;
  abierto: boolean;
};

type Ids = {
  centro: number;
  norte: number;
  navidad: number;
  cierreNorte: number;
};

const fechaUtc = (fecha: string) => new Date(`${fecha}T00:00:00.000Z`);

/**
 * Integración HTTP del CRUD de calendario general, excepciones por sede y
 * horario semanal: todo exclusivo del gerente, y los cambios se ven en el
 * horario operativo que consultan canchas y clases.
 */
describe('Calendario, excepciones por sede y horario semanal (integración)', () => {
  let contexto: AppDePruebas;
  const ids: Ids = { centro: 0, norte: 0, navidad: 0, cierreNorte: 0 };

  const sembrar = async (prisma: PrismaClient) => {
    const concordia = await prisma.ciudad.create({
      data: { nombre: 'Concordia' },
    });
    const centro = await prisma.sede.create({
      data: {
        nombre: 'Centro',
        direccion: 'Calle 1',
        aforo_maximo: 100,
        id_ciudad: concordia.id_ciudad,
      },
    });
    const norte = await prisma.sede.create({
      data: {
        nombre: 'Norte',
        direccion: 'Calle 2',
        aforo_maximo: 80,
        id_ciudad: concordia.id_ciudad,
      },
    });
    const navidad = await prisma.calendario.create({
      data: {
        fecha: fechaUtc('2026-12-25'),
        descripcion: 'Navidad',
        es_feriado: true,
        es_dia_habil: false,
      },
    });
    await prisma.calendario.create({
      data: {
        fecha: fechaUtc('2026-07-09'),
        descripcion: 'Día de la Independencia',
        es_feriado: true,
        es_dia_habil: false,
      },
    });
    const cierreNorte = await prisma.calendario_sede.create({
      data: {
        id_sede: norte.id_sede,
        id_calendario: navidad.id_calendario,
        cerrado: true,
        motivo: 'Cerrado por Navidad',
      },
    });
    ids.centro = centro.id_sede;
    ids.norte = norte.id_sede;
    ids.navidad = navidad.id_calendario;
    ids.cierreNorte = cierreNorte.id_calendario_sede;
  };

  const servidor = () => contexto.app.getHttpServer();
  const bearer = (rol: string) => `Bearer ${contexto.tokenConRol(rol)}`;
  const comoGerente = () => bearer('gerente');

  beforeAll(async () => {
    contexto = await crearAppDePruebas([SedesModule], sembrar);
  }, 60_000);

  afterAll(async () => {
    await contexto?.cerrar();
  });

  describe('permisos', () => {
    it('sin token responde 401 en los tres recursos', async () => {
      await request(servidor()).get('/calendario').expect(401);
      await request(servidor())
        .get(`/sedes/${ids.centro}/calendario`)
        .expect(401);
      await request(servidor())
        .get(`/sedes/${ids.centro}/horarios`)
        .expect(401);
    });

    it('con un rol distinto de gerente responde 403 y no guarda nada', async () => {
      await request(servidor())
        .get('/calendario')
        .set('Authorization', bearer('socio'))
        .expect(403);
      await request(servidor())
        .post('/calendario')
        .set('Authorization', bearer('recepcionista'))
        .send({ fecha: '2026-03-24', es_feriado: true })
        .expect(403);
      await request(servidor())
        .post(`/sedes/${ids.centro}/horarios`)
        .set('Authorization', bearer('socio'))
        .send({ dia_semana: 3, hora_apertura: '08:00', hora_cierre: '20:00' })
        .expect(403);

      expect(
        await contexto.base.prisma.calendario.count({
          where: { fecha: fechaUtc('2026-03-24') },
        }),
      ).toBe(0);
      expect(
        await contexto.base.prisma.sede_horario.count({
          where: { id_sede: ids.centro, dia_semana: 3 },
        }),
      ).toBe(0);
    });
  });

  describe('calendario general', () => {
    it('crea un feriado y por defecto lo deja como día no hábil', async () => {
      const respuesta = await request(servidor())
        .post('/calendario')
        .set('Authorization', comoGerente())
        .send({
          fecha: '2026-05-25',
          descripcion: 'Revolución de Mayo',
          es_feriado: true,
        })
        .expect(201);

      expect(respuesta.body).toMatchObject({
        fecha: '2026-05-25',
        descripcion: 'Revolución de Mayo',
        es_feriado: true,
        es_dia_habil: false,
      });
    });

    it('responde 409 si la fecha ya está cargada', async () => {
      const respuesta = await request(servidor())
        .post('/calendario')
        .set('Authorization', comoGerente())
        .send({ fecha: '2026-12-25', descripcion: 'Otra Navidad' })
        .expect(409);

      expect((respuesta.body as { message: string }).message).toContain(
        '2026-12-25',
      );
    });

    it('valida el formato y que la fecha exista', async () => {
      for (const fecha of ['25/05/2026', '2026-02-30', '2026-13-01']) {
        await request(servidor())
          .post('/calendario')
          .set('Authorization', comoGerente())
          .send({ fecha })
          .expect(400);
      }
    });

    it('lista las fechas en orden y filtra por rango', async () => {
      const todas = await request(servidor())
        .get('/calendario')
        .set('Authorization', comoGerente())
        .expect(200);
      const fechas = (todas.body as FechaRespuesta[]).map((dia) => dia.fecha);
      expect(fechas).toEqual([...fechas].sort());
      expect(fechas).toEqual(
        expect.arrayContaining(['2026-07-09', '2026-12-25']),
      );

      const segundoSemestre = await request(servidor())
        .get('/calendario')
        .query({ desde: '2026-07-01', hasta: '2026-12-24' })
        .set('Authorization', comoGerente())
        .expect(200);
      expect(
        (segundoSemestre.body as FechaRespuesta[]).map((dia) => dia.fecha),
      ).toEqual(['2026-07-09']);

      await request(servidor())
        .get('/calendario')
        .query({ desde: '2026-12-31', hasta: '2026-01-01' })
        .set('Authorization', comoGerente())
        .expect(400);
    });

    it('obtiene, modifica y elimina una fecha sin excepciones', async () => {
      const creada = await request(servidor())
        .post('/calendario')
        .set('Authorization', comoGerente())
        .send({ fecha: '2026-06-20', descripcion: 'Día de la Bandera' })
        .expect(201);
      const id = (creada.body as FechaRespuesta).id_calendario;

      await request(servidor())
        .get(`/calendario/${id}`)
        .set('Authorization', comoGerente())
        .expect(200);

      const modificada = await request(servidor())
        .patch(`/calendario/${id}`)
        .set('Authorization', comoGerente())
        .send({ es_feriado: true })
        .expect(200);
      expect(modificada.body).toMatchObject({
        fecha: '2026-06-20',
        es_feriado: true,
        es_dia_habil: false,
      });

      await request(servidor())
        .patch(`/calendario/${id}`)
        .set('Authorization', comoGerente())
        .send({})
        .expect(400);
      await request(servidor())
        .patch(`/calendario/${id}`)
        .set('Authorization', comoGerente())
        .send({ fecha: '2026-07-09' })
        .expect(409);

      await request(servidor())
        .delete(`/calendario/${id}`)
        .set('Authorization', comoGerente())
        .expect(200);
      await request(servidor())
        .get(`/calendario/${id}`)
        .set('Authorization', comoGerente())
        .expect(404);
      await request(servidor())
        .delete(`/calendario/${id}`)
        .set('Authorization', comoGerente())
        .expect(404);
      await request(servidor())
        .patch(`/calendario/${id}`)
        .set('Authorization', comoGerente())
        .send({ descripcion: 'Ya no existe' })
        .expect(404);
    });

    it('no elimina una fecha que tiene excepciones en alguna sede', async () => {
      const respuesta = await request(servidor())
        .delete(`/calendario/${ids.navidad}`)
        .set('Authorization', comoGerente())
        .expect(409);

      expect((respuesta.body as { message: string }).message).toContain(
        'excepciones',
      );
      expect(
        await contexto.base.prisma.calendario.count({
          where: { id_calendario: ids.navidad },
        }),
      ).toBe(1);
    });
  });

  describe('excepciones por sede', () => {
    it('carga un cierre en una fecha que no estaba en el calendario', async () => {
      const respuesta = await request(servidor())
        .post(`/sedes/${ids.centro}/calendario`)
        .set('Authorization', comoGerente())
        .send({ fecha: '2026-11-20', motivo: 'Fumigación' })
        .expect(201);

      expect(respuesta.body).toMatchObject({
        id_sede: ids.centro,
        fecha: '2026-11-20',
        cerrado: true,
        hora_apertura: null,
        hora_cierre: null,
        motivo: 'Fumigación',
        calendario: {
          fecha: '2026-11-20',
          es_feriado: false,
          es_dia_habil: true,
        },
      });
      expect(
        await contexto.base.prisma.calendario.count({
          where: { fecha: fechaUtc('2026-11-20') },
        }),
      ).toBe(1);
    });

    it('carga un horario especial en un feriado que ya existía', async () => {
      const antes = await contexto.base.prisma.calendario.count();
      const respuesta = await request(servidor())
        .post(`/sedes/${ids.centro}/calendario`)
        .set('Authorization', comoGerente())
        .send({
          fecha: '2026-12-25',
          hora_apertura: '10:00',
          hora_cierre: '14:00',
        })
        .expect(201);
      const excepcion = respuesta.body as ExcepcionRespuesta;

      expect(excepcion).toMatchObject({
        id_calendario: ids.navidad,
        cerrado: false,
        hora_apertura: '10:00',
        hora_cierre: '14:00',
      });
      expect(excepcion.calendario).toMatchObject({
        descripcion: 'Navidad',
        es_feriado: true,
      });
      expect(await contexto.base.prisma.calendario.count()).toBe(antes);
    });

    it('valida el horario especial', async () => {
      const cargar = (cuerpo: object) =>
        request(servidor())
          .post(`/sedes/${ids.norte}/calendario`)
          .set('Authorization', comoGerente())
          .send({ fecha: '2026-11-21', ...cuerpo });

      await cargar({ cerrado: false }).expect(400);
      await cargar({ hora_apertura: '10:00' }).expect(400);
      await cargar({ hora_apertura: '14:00', hora_cierre: '10:00' }).expect(
        400,
      );
      await cargar({ hora_apertura: '10:00', hora_cierre: '10:00' }).expect(
        400,
      );
      await cargar({ hora_apertura: '25:00', hora_cierre: '26:00' }).expect(
        400,
      );
    });

    it('no permite dos excepciones de la misma sede el mismo día', async () => {
      await request(servidor())
        .post(`/sedes/${ids.norte}/calendario`)
        .set('Authorization', comoGerente())
        .send({ fecha: '2026-12-25' })
        .expect(409);
    });

    it('responde 404 si la sede no existe', async () => {
      await request(servidor())
        .post('/sedes/9999/calendario')
        .set('Authorization', comoGerente())
        .send({ fecha: '2026-11-22' })
        .expect(404);
    });

    it('lista solo las excepciones de la sede, en orden y con su fecha', async () => {
      const respuesta = await request(servidor())
        .get(`/sedes/${ids.centro}/calendario`)
        .set('Authorization', comoGerente())
        .expect(200);
      const excepciones = respuesta.body as ExcepcionRespuesta[];

      expect(excepciones.map((excepcion) => excepcion.fecha)).toEqual([
        '2026-11-20',
        '2026-12-25',
      ]);
      expect(
        excepciones.every((excepcion) => excepcion.id_sede === ids.centro),
      ).toBe(true);

      const diciembre = await request(servidor())
        .get(`/sedes/${ids.centro}/calendario`)
        .query({ desde: '2026-12-01', hasta: '2026-12-31' })
        .set('Authorization', comoGerente())
        .expect(200);
      expect(
        (diciembre.body as ExcepcionRespuesta[]).map(
          (excepcion) => excepcion.fecha,
        ),
      ).toEqual(['2026-12-25']);
    });

    it('modifica y elimina solo dentro de su sede', async () => {
      const creada = await request(servidor())
        .post(`/sedes/${ids.centro}/calendario`)
        .set('Authorization', comoGerente())
        .send({ fecha: '2026-11-23', motivo: 'Mantenimiento eléctrico' })
        .expect(201);
      const id = (creada.body as ExcepcionRespuesta).id_calendario_sede;

      // La excepción de Norte no se puede tocar desde la ruta de Centro.
      await request(servidor())
        .patch(`/sedes/${ids.centro}/calendario/${ids.cierreNorte}`)
        .set('Authorization', comoGerente())
        .send({ motivo: 'Intento cruzado' })
        .expect(404);

      const conHorario = await request(servidor())
        .patch(`/sedes/${ids.centro}/calendario/${id}`)
        .set('Authorization', comoGerente())
        .send({ hora_apertura: '12:00', hora_cierre: '20:00' })
        .expect(200);
      expect(conHorario.body).toMatchObject({
        cerrado: false,
        hora_apertura: '12:00',
        hora_cierre: '20:00',
        motivo: 'Mantenimiento eléctrico',
      });

      const otraFecha = await request(servidor())
        .patch(`/sedes/${ids.centro}/calendario/${id}`)
        .set('Authorization', comoGerente())
        .send({ fecha: '2026-11-24', cerrado: true })
        .expect(200);
      expect(otraFecha.body).toMatchObject({
        fecha: '2026-11-24',
        cerrado: true,
        hora_apertura: null,
        hora_cierre: null,
      });

      await request(servidor())
        .patch(`/sedes/${ids.centro}/calendario/${id}`)
        .set('Authorization', comoGerente())
        .send({ fecha: '2026-12-25' })
        .expect(409);
      await request(servidor())
        .patch(`/sedes/${ids.centro}/calendario/${id}`)
        .set('Authorization', comoGerente())
        .send({})
        .expect(400);

      await request(servidor())
        .delete(`/sedes/${ids.norte}/calendario/${id}`)
        .set('Authorization', comoGerente())
        .expect(404);
      await request(servidor())
        .delete(`/sedes/${ids.centro}/calendario/${id}`)
        .set('Authorization', comoGerente())
        .expect(200);
      await request(servidor())
        .get(`/sedes/${ids.centro}/calendario/${id}`)
        .set('Authorization', comoGerente())
        .expect(404);
    });

    it('el horario operativo de la sede refleja las excepciones cargadas', async () => {
      const cerrado = await request(servidor())
        .get(`/sedes/${ids.centro}/horario-operativo`)
        .query({ fecha: '2026-11-20' })
        .expect(200);
      expect(cerrado.body).toMatchObject({
        abierto: false,
        motivo_cierre: 'Fumigación',
      });

      const especial = await request(servidor())
        .get(`/sedes/${ids.centro}/horario-operativo`)
        .query({ fecha: '2026-12-25' })
        .expect(200);
      expect(especial.body).toMatchObject({
        abierto: true,
        hora_apertura: '10:00',
        hora_cierre: '14:00',
      });
    });
  });

  describe('horario semanal', () => {
    const cargarDia = (idSede: number, cuerpo: object) =>
      request(servidor())
        .post(`/sedes/${idSede}/horarios`)
        .set('Authorization', comoGerente())
        .send(cuerpo);

    it('carga los días y los lista de domingo a sábado', async () => {
      const lunes = await cargarDia(ids.centro, {
        dia_semana: 1,
        hora_apertura: '07:00',
        hora_cierre: '23:00',
      }).expect(201);
      expect(lunes.body).toMatchObject({ dia_semana: 1, abierto: true });

      const domingo = await cargarDia(ids.centro, {
        dia_semana: 0,
        abierto: false,
      }).expect(201);
      expect(domingo.body).toMatchObject({
        dia_semana: 0,
        abierto: false,
        hora_apertura: '00:00',
        hora_cierre: '00:00',
      });

      const semana = await request(servidor())
        .get(`/sedes/${ids.centro}/horarios`)
        .set('Authorization', comoGerente())
        .expect(200);
      expect(
        (semana.body as HorarioRespuesta[]).map((dia) => dia.dia_semana),
      ).toEqual([0, 1]);
    });

    it('no permite repetir un día y valida los datos', async () => {
      const repetido = await cargarDia(ids.centro, {
        dia_semana: 1,
        hora_apertura: '08:00',
        hora_cierre: '22:00',
      }).expect(409);
      expect((repetido.body as { message: string }).message).toContain('lunes');

      await cargarDia(ids.centro, {
        dia_semana: 7,
        hora_apertura: '08:00',
        hora_cierre: '22:00',
      }).expect(400);
      await cargarDia(ids.centro, { dia_semana: 2 }).expect(400);
      await cargarDia(ids.centro, {
        dia_semana: 2,
        hora_apertura: '22:00',
        hora_cierre: '08:00',
      }).expect(400);
      await cargarDia(9999, {
        dia_semana: 2,
        hora_apertura: '08:00',
        hora_cierre: '22:00',
      }).expect(404);
    });

    it('modifica y elimina solo dentro de su sede', async () => {
      const creado = await cargarDia(ids.norte, {
        dia_semana: 6,
        hora_apertura: '09:00',
        hora_cierre: '13:00',
      }).expect(201);
      const id = (creado.body as HorarioRespuesta).id_sede_horario;
      const ruta = `/sedes/${ids.norte}/horarios/${id}`;

      const ampliado = await request(servidor())
        .patch(ruta)
        .set('Authorization', comoGerente())
        .send({ hora_apertura: '08:00', hora_cierre: '18:00' })
        .expect(200);
      expect(ampliado.body).toMatchObject({
        hora_apertura: '08:00',
        hora_cierre: '18:00',
        abierto: true,
      });

      const cerrado = await request(servidor())
        .patch(ruta)
        .set('Authorization', comoGerente())
        .send({ abierto: false })
        .expect(200);
      expect(cerrado.body).toMatchObject({
        abierto: false,
        hora_apertura: '00:00',
        hora_cierre: '00:00',
      });

      await request(servidor())
        .patch(ruta)
        .set('Authorization', comoGerente())
        .send({ abierto: true })
        .expect(400);
      await request(servidor())
        .patch(`/sedes/${ids.centro}/horarios/${id}`)
        .set('Authorization', comoGerente())
        .send({ hora_apertura: '08:00', hora_cierre: '18:00' })
        .expect(404);

      await cargarDia(ids.norte, {
        dia_semana: 5,
        hora_apertura: '08:00',
        hora_cierre: '22:00',
      }).expect(201);
      await request(servidor())
        .patch(ruta)
        .set('Authorization', comoGerente())
        .send({ dia_semana: 5 })
        .expect(409);

      await request(servidor())
        .delete(ruta)
        .set('Authorization', comoGerente())
        .expect(200);
      await request(servidor())
        .get(ruta)
        .set('Authorization', comoGerente())
        .expect(404);
    });

    it('el horario operativo usa el horario semanal cargado', async () => {
      // 16/11/2026 es lunes y 15/11/2026, domingo; ninguno tiene excepciones.
      const lunes = await request(servidor())
        .get(`/sedes/${ids.centro}/horario-operativo`)
        .query({ fecha: '2026-11-16' })
        .expect(200);
      expect(lunes.body).toMatchObject({
        abierto: true,
        hora_apertura: '07:00',
        hora_cierre: '23:00',
      });

      const domingo = await request(servidor())
        .get(`/sedes/${ids.centro}/horario-operativo`)
        .query({ fecha: '2026-11-15' })
        .expect(200);
      expect(domingo.body).toMatchObject({ abierto: false });
    });
  });
});
