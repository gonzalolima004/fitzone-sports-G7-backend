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

type Ids = { concordia: number; sedeCentro: number; sedeVieja: number };

/**
 * Integración HTTP de M0-sedes: la consulta de sedes y ciudades es pública
 * (el registro no tiene token) y el alta, la modificación y la baja quedan
 * reservadas al gerente.
 */
describe('Sedes y ciudades (integración): permisos de escritura', () => {
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
