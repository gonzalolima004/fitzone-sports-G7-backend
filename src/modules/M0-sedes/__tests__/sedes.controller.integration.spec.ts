import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { SedesModule } from '../sedes.module';
import {
  AppDePruebas,
  crearAppDePruebas,
} from '../../../../test/utils/app-de-pruebas';

type SedeRespuesta = {
  id_sede: number;
  nombre: string;
  direccion: string;
  aforo_maximo: number;
  activo: boolean;
  id_ciudad: number;
};

type CiudadRespuesta = { id_ciudad: number; nombre: string; activo: boolean };

type HorarioRespuesta = {
  abierto: boolean;
  hora_apertura: string;
  hora_cierre: string;
  motivo_cierre?: string;
  es_horario_especial?: boolean;
};

type Ids = { concordia: number; sedeCentro: number; sedeVieja: number };

/**
 * Integración HTTP de M0-sedes: todos los endpoints tienen guards. Los
 * listados de sedes y ciudades son públicos (la landing y el registro no
 * tienen token) con límite de consultas; el detalle y el horario operativo
 * piden una cuenta de FitZone, y el alta, la modificación y la baja, el rol
 * gerente.
 */
describe('Sedes y ciudades (integración): permisos y horario operativo', () => {
  let contexto: AppDePruebas;
  const ids: Ids = { concordia: 0, sedeCentro: 0, sedeVieja: 0 };

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
    const vieja = await prisma.sede.create({
      data: {
        nombre: 'Sede Cerrada',
        direccion: 'Calle 2',
        aforo_maximo: 50,
        activo: false,
        id_ciudad: concordia.id_ciudad,
      },
    });
    ids.concordia = concordia.id_ciudad;
    ids.sedeCentro = centro.id_sede;
    ids.sedeVieja = vieja.id_sede;

    // Horario semanal de Centro: lunes de 07:00 a 23:00 y domingo cerrado.
    // El martes no tiene horario cargado.
    await prisma.sede_horario.createMany({
      data: [
        {
          id_sede: centro.id_sede,
          dia_semana: 1,
          hora_apertura: '07:00',
          hora_cierre: '23:00',
        },
        {
          id_sede: centro.id_sede,
          dia_semana: 0,
          hora_apertura: '00:00',
          hora_cierre: '00:00',
          abierto: false,
        },
      ],
    });

    // Excepciones de Centro: el lunes 23/11 abre de 10:00 a 14:00 y el lunes
    // 30/11 cierra por fumigación.
    const feriado = await prisma.calendario.create({
      data: {
        fecha: new Date('2026-11-23T00:00:00.000Z'),
        descripcion: 'Día de la Soberanía Nacional',
        es_feriado: true,
        es_dia_habil: false,
      },
    });
    const diaComun = await prisma.calendario.create({
      data: { fecha: new Date('2026-11-30T00:00:00.000Z') },
    });
    await prisma.calendario_sede.createMany({
      data: [
        {
          id_sede: centro.id_sede,
          id_calendario: feriado.id_calendario,
          cerrado: false,
          hora_apertura: '10:00',
          hora_cierre: '14:00',
        },
        {
          id_sede: centro.id_sede,
          id_calendario: diaComun.id_calendario,
          cerrado: true,
          motivo: 'Fumigación',
        },
      ],
    });
  };

  const servidor = () => contexto.app.getHttpServer();
  const bearer = (rol: string) => `Bearer ${contexto.tokenConRol(rol)}`;

  const nuevaSede = () => ({
    nombre: 'Norte',
    direccion: 'Av. Siempre Viva 742',
    aforo_maximo: 80,
    id_ciudad: ids.concordia,
  });

  beforeAll(async () => {
    contexto = await crearAppDePruebas([SedesModule], sembrar);
  }, 60_000);

  afterAll(async () => {
    await contexto?.cerrar();
  });

  describe('consultas públicas', () => {
    it('GET /sedes no requiere token y devuelve solo sedes activas', async () => {
      const respuesta = await request(servidor()).get('/sedes').expect(200);
      const sedes = respuesta.body as SedeRespuesta[];

      expect(sedes.map((sede) => sede.nombre)).toContain('Centro');
      expect(sedes.map((sede) => sede.nombre)).not.toContain('Sede Cerrada');
    });

    it('GET /ciudades no requiere token', async () => {
      const respuesta = await request(servidor()).get('/ciudades').expect(200);
      const ciudades = respuesta.body as CiudadRespuesta[];

      expect(ciudades.map((ciudad) => ciudad.nombre)).toEqual(['Concordia']);
    });
  });

  describe('consultas con sesión', () => {
    it('GET /sedes/:id responde 401 sin token y la sede con cualquier rol', async () => {
      await request(servidor()).get(`/sedes/${ids.sedeCentro}`).expect(401);

      for (const rol of ['socio', 'externo', 'recepcionista', 'gerente']) {
        const respuesta = await request(servidor())
          .get(`/sedes/${ids.sedeCentro}`)
          .set('Authorization', bearer(rol))
          .expect(200);
        expect((respuesta.body as SedeRespuesta).nombre).toBe('Centro');
      }
    });

    it('GET /ciudades/:id responde 401 sin token y la ciudad con sesión', async () => {
      await request(servidor()).get(`/ciudades/${ids.concordia}`).expect(401);

      const respuesta = await request(servidor())
        .get(`/ciudades/${ids.concordia}`)
        .set('Authorization', bearer('externo'))
        .expect(200);
      expect((respuesta.body as CiudadRespuesta).nombre).toBe('Concordia');
    });
  });

  describe('GET /sedes/:id/horario-operativo', () => {
    const horario = async (fecha: string, idSede = ids.sedeCentro) => {
      const respuesta = await request(servidor())
        .get(`/sedes/${idSede}/horario-operativo`)
        .query({ fecha })
        .set('Authorization', bearer('socio'))
        .expect(200);
      return respuesta.body as HorarioRespuesta;
    };

    it('responde 401 sin token', async () => {
      await request(servidor())
        .get(`/sedes/${ids.sedeCentro}/horario-operativo`)
        .query({ fecha: '2026-11-16' })
        .expect(401);
    });

    it('usa el horario semanal cargado para ese día', async () => {
      expect(await horario('2026-11-16')).toEqual({
        abierto: true,
        hora_apertura: '07:00',
        hora_cierre: '23:00',
        es_horario_especial: false,
      });
      expect(await horario('2026-11-15')).toEqual({
        abierto: false,
        hora_apertura: '00:00',
        hora_cierre: '00:00',
        motivo_cierre: 'La sede no abre este día',
      });
    });

    it('sin horario cargado ese día la sede figura cerrada, sin horario por defecto', async () => {
      expect(await horario('2026-11-17')).toEqual({
        abierto: false,
        hora_apertura: '00:00',
        hora_cierre: '00:00',
        motivo_cierre: 'La sede no tiene horario cargado para este día',
      });
    });

    it('la excepción del calendario manda sobre el horario semanal', async () => {
      expect(await horario('2026-11-23')).toEqual({
        abierto: true,
        hora_apertura: '10:00',
        hora_cierre: '14:00',
        es_horario_especial: true,
      });
      expect(await horario('2026-11-30')).toMatchObject({
        abierto: false,
        motivo_cierre: 'Fumigación',
      });
    });

    it('responde 404 si la sede no existe y 400 si la fecha no es válida', async () => {
      await request(servidor())
        .get('/sedes/9999/horario-operativo')
        .query({ fecha: '2026-11-17' })
        .set('Authorization', bearer('socio'))
        .expect(404);

      await request(servidor())
        .get(`/sedes/${ids.sedeCentro}/horario-operativo`)
        .query({ fecha: '2026-02-30' })
        .set('Authorization', bearer('socio'))
        .expect(400);
    });
  });

  describe('POST /sedes', () => {
    it('responde 401 sin token', async () => {
      await request(servidor()).post('/sedes').send(nuevaSede()).expect(401);
    });

    it('responde 403 con token de socio y no crea la sede', async () => {
      await request(servidor())
        .post('/sedes')
        .set('Authorization', bearer('socio'))
        .send({ ...nuevaSede(), nombre: 'Intento Socio' })
        .expect(403);

      const sedes = await contexto.base.prisma.sede.findMany({
        where: { nombre: 'Intento Socio' },
      });
      expect(sedes).toHaveLength(0);
    });

    it('con token de gerente crea la sede y queda visible en el listado público', async () => {
      const respuesta = await request(servidor())
        .post('/sedes')
        .set('Authorization', bearer('gerente'))
        .send(nuevaSede())
        .expect(201);
      const creada = respuesta.body as SedeRespuesta;

      expect(creada).toMatchObject({ ...nuevaSede(), activo: true });

      const listado = await request(servidor()).get('/sedes').expect(200);
      expect(
        (listado.body as SedeRespuesta[]).map((sede) => sede.id_sede),
      ).toContain(creada.id_sede);
    });

    it('responde 404 si la ciudad no existe', async () => {
      await request(servidor())
        .post('/sedes')
        .set('Authorization', bearer('gerente'))
        .send({ ...nuevaSede(), id_ciudad: 9999 })
        .expect(404);
    });

    it('responde 400 con datos inválidos o campos no permitidos', async () => {
      await request(servidor())
        .post('/sedes')
        .set('Authorization', bearer('gerente'))
        .send({ ...nuevaSede(), aforo_maximo: -5 })
        .expect(400);

      await request(servidor())
        .post('/sedes')
        .set('Authorization', bearer('gerente'))
        .send({ ...nuevaSede(), activo: false })
        .expect(400);
    });
  });

  describe('PATCH /sedes/:id', () => {
    it('responde 403 con token de recepcionista', async () => {
      await request(servidor())
        .patch(`/sedes/${ids.sedeCentro}`)
        .set('Authorization', bearer('recepcionista'))
        .send({ aforo_maximo: 120 })
        .expect(403);
    });

    it('con token de gerente actualiza solo los campos enviados', async () => {
      const respuesta = await request(servidor())
        .patch(`/sedes/${ids.sedeCentro}`)
        .set('Authorization', bearer('gerente'))
        .send({ aforo_maximo: 150 })
        .expect(200);

      expect(respuesta.body as SedeRespuesta).toMatchObject({
        id_sede: ids.sedeCentro,
        nombre: 'Centro',
        aforo_maximo: 150,
      });
    });
  });

  describe('DELETE /sedes/:id', () => {
    it('responde 401 sin token', async () => {
      await request(servidor()).delete(`/sedes/${ids.sedeCentro}`).expect(401);
    });

    it('con token de gerente realiza la baja lógica: deja de listarse pero se conserva', async () => {
      const temporal = await contexto.base.prisma.sede.create({
        data: {
          nombre: 'Temporal',
          direccion: 'Calle 3',
          aforo_maximo: 10,
          id_ciudad: ids.concordia,
        },
      });

      const respuesta = await request(servidor())
        .delete(`/sedes/${temporal.id_sede}`)
        .set('Authorization', bearer('gerente'))
        .expect(200);
      expect((respuesta.body as SedeRespuesta).activo).toBe(false);

      const listado = await request(servidor()).get('/sedes').expect(200);
      expect(
        (listado.body as SedeRespuesta[]).map((sede) => sede.id_sede),
      ).not.toContain(temporal.id_sede);

      const conservada = await contexto.base.prisma.sede.findUnique({
        where: { id_sede: temporal.id_sede },
      });
      expect(conservada?.activo).toBe(false);
    });
  });

  describe('POST /ciudades', () => {
    it('responde 401 sin token y 403 con token de socio', async () => {
      await request(servidor())
        .post('/ciudades')
        .send({ nombre: 'Paraná' })
        .expect(401);

      await request(servidor())
        .post('/ciudades')
        .set('Authorization', bearer('socio'))
        .send({ nombre: 'Paraná' })
        .expect(403);
    });

    it('con token de gerente crea la ciudad', async () => {
      const respuesta = await request(servidor())
        .post('/ciudades')
        .set('Authorization', bearer('gerente'))
        .send({ nombre: 'Paraná' })
        .expect(201);

      expect(respuesta.body as CiudadRespuesta).toMatchObject({
        nombre: 'Paraná',
        activo: true,
      });
    });
  });
});

describe('Sedes y ciudades (integración): límite de consultas públicas', () => {
  const limiteOriginal = process.env.LIMITE_CONSULTAS_PUBLICAS;
  let contexto: AppDePruebas;

  beforeAll(async () => {
    process.env.LIMITE_CONSULTAS_PUBLICAS = '2';
    contexto = await crearAppDePruebas([SedesModule]);
  }, 60_000);

  afterAll(async () => {
    if (limiteOriginal === undefined) {
      delete process.env.LIMITE_CONSULTAS_PUBLICAS;
    } else {
      process.env.LIMITE_CONSULTAS_PUBLICAS = limiteOriginal;
    }
    await contexto?.cerrar();
  });

  it('pasado el límite por minuto, el listado público responde 429', async () => {
    const servidor = contexto.app.getHttpServer();

    await request(servidor).get('/sedes').expect(200);
    await request(servidor).get('/sedes').expect(200);
    const rechazo = await request(servidor).get('/sedes').expect(429);
    expect((rechazo.body as { message: string }).message).toContain(
      'Demasiadas consultas',
    );

    // Cada ruta tiene su propio conteo.
    await request(servidor).get('/ciudades').expect(200);
  });
});
