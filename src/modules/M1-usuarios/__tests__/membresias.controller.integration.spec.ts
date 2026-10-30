import request from 'supertest';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  AppDePruebas,
  crearAppDePruebas,
} from '../../../../test/utils/app-de-pruebas';

type MembresiaRespuesta = {
  id_membresia: number;
  fecha_inicio: string;
  fecha_fin: string;
  renovacion_automatica: boolean;
  id_usuario: number;
  id_membresia_plan: number;
  id_membresia_estado: number;
  membresia_plan: {
    id_membresia_plan: number;
    nombre: string;
    duracion_dias: number;
    precio: number;
  };
  membresia_estado: { id_membresia_estado: number; descripcion: string };
  usuario: {
    id_usuario: number;
    nombre: string;
    apellido: string;
    dni: string;
    email: string;
  };
};

type CuerpoDeError = { statusCode: number; message: string | string[] };

type Ids = {
  mensual: number;
  trimestral: number;
  conPagos: number;
  sinPagos: number;
};

const fecha = (valor: string) => new Date(`${valor}T00:00:00.000Z`);

/**
 * Integración HTTP del CRUD de membresías de los socios: el gerente lista,
 * da de alta, modifica, cambia el estado (tabla membresia_estado) y elimina
 * membresías. El catálogo de estados es público.
 * MembresiasController pertenece a UsuariosModule, que el helper ya importa.
 */
describe('Membresías de socios (integración): CRUD del gerente', () => {
  let contexto: AppDePruebas;
  const ids: Ids = { mensual: 0, trimestral: 0, conPagos: 0, sinPagos: 0 };

  const sembrar = async (prisma: PrismaClient) => {
    await prisma.ciudad.create({ data: { id_ciudad: 1, nombre: 'Concordia' } });
    await prisma.sede.create({
      data: {
        id_sede: 1,
        nombre: 'Centro',
        direccion: 'Calle 1',
        aforo_maximo: 100,
        id_ciudad: 1,
      },
    });
    await prisma.usuarioEstado.create({
      data: { id_usuario_estado: 1, descripcion: 'Activo' },
    });
    await prisma.usuario.createMany({
      data: [
        {
          id_usuario: 1,
          dni: '30111222',
          email: 'sofia@test.local',
          password: 'x',
          nombre: 'Sofía',
          apellido: 'Gómez',
          id_sede: 1,
          id_usuario_estado: 1,
        },
        {
          id_usuario: 2,
          dni: '30222333',
          email: 'victor@test.local',
          password: 'x',
          nombre: 'Victor',
          apellido: 'Paz',
          id_sede: 1,
          id_usuario_estado: 1,
        },
        {
          id_usuario: 3,
          dni: '30333444',
          email: 'lucia@test.local',
          password: 'x',
          nombre: 'Lucía',
          apellido: 'Ruiz',
          id_sede: 1,
          id_usuario_estado: 1,
        },
      ],
    });

    const mensual = await prisma.membresiaPlan.create({
      data: {
        nombre: 'Plan Mensual',
        duracion_dias: 30,
        precio: new Prisma.Decimal('25000.00'),
      },
    });
    const trimestral = await prisma.membresiaPlan.create({
      data: {
        nombre: 'Plan Trimestral',
        duracion_dias: 90,
        precio: new Prisma.Decimal('65000.00'),
      },
    });
    ids.mensual = mensual.id_membresia_plan;
    ids.trimestral = trimestral.id_membresia_plan;

    // Mismos IDs que el seed del proyecto: 1 Activa, 2 Vencida, 3 Suspendida.
    await prisma.membresiaEstado.createMany({
      data: [
        { id_membresia_estado: 1, descripcion: 'Activa' },
        { id_membresia_estado: 2, descripcion: 'Vencida' },
        { id_membresia_estado: 3, descripcion: 'Suspendida' },
      ],
    });

    const conPagos = await prisma.membresia.create({
      data: {
        id_usuario: 1,
        id_membresia_plan: ids.mensual,
        id_membresia_estado: 1,
        fecha_inicio: fecha('2026-10-01'),
        fecha_fin: fecha('2026-11-01'),
      },
    });
    const sinPagos = await prisma.membresia.create({
      data: {
        id_usuario: 2,
        id_membresia_plan: ids.trimestral,
        id_membresia_estado: 2,
        fecha_inicio: fecha('2026-06-01'),
        fecha_fin: fecha('2026-09-01'),
      },
    });
    ids.conPagos = conPagos.id_membresia;
    ids.sinPagos = sinPagos.id_membresia;

    await prisma.pagoEstado.create({
      data: { id_pago_estado: 1, descripcion: 'Aprobado' },
    });
    await prisma.pago.create({
      data: {
        id_pago_estado: 1,
        id_membresia: ids.conPagos,
        monto: new Prisma.Decimal('25000.00'),
      },
    });
  };

  const servidor = () => contexto.app.getHttpServer();
  const bearer = (rol: string) => `Bearer ${contexto.tokenConRol(rol)}`;

  beforeAll(async () => {
    contexto = await crearAppDePruebas([], sembrar);
  }, 60_000);

  afterAll(async () => {
    await contexto?.cerrar();
  });

  describe('permisos', () => {
    it('GET /membresias responde 401 sin token', async () => {
      await request(servidor()).get('/membresias').expect(401);
    });

    it('GET /membresias responde 403 con token de socio', async () => {
      const respuesta = await request(servidor())
        .get('/membresias')
        .set('Authorization', bearer('socio'))
        .expect(403);
      const cuerpo = respuesta.body as CuerpoDeError;
      expect(String(cuerpo.message)).toContain('gerente');
    });

    it('POST /membresias responde 403 con token de recepcionista', async () => {
      await request(servidor())
        .post('/membresias')
        .set('Authorization', bearer('recepcionista'))
        .send({
          id_usuario: 3,
          id_membresia_plan: ids.mensual,
          fecha_inicio: '2026-10-27',
        })
        .expect(403);
    });

    it('DELETE /membresias/:id responde 401 sin token', async () => {
      await request(servidor())
        .delete(`/membresias/${ids.sinPagos}`)
        .expect(401);
    });
  });

  it('GET /membresias/estados es público y devuelve la tabla membresia_estado', async () => {
    const respuesta = await request(servidor())
      .get('/membresias/estados')
      .expect(200);

    expect(respuesta.body).toEqual([
      { id_membresia_estado: 1, descripcion: 'Activa' },
      { id_membresia_estado: 2, descripcion: 'Vencida' },
      { id_membresia_estado: 3, descripcion: 'Suspendida' },
    ]);
  });

  describe('GET /membresias (gerente)', () => {
    it('lista las membresías con el socio, el plan y el estado', async () => {
      const respuesta = await request(servidor())
        .get('/membresias')
        .set('Authorization', bearer('gerente'))
        .expect(200);
      const membresias = respuesta.body as MembresiaRespuesta[];

      expect(membresias).toHaveLength(2);
      const deSofia = membresias.find(
        (membresia) => membresia.id_membresia === ids.conPagos,
      );
      expect(deSofia).toMatchObject({
        fecha_inicio: '2026-10-01T00:00:00.000Z',
        fecha_fin: '2026-11-01T00:00:00.000Z',
        renovacion_automatica: false,
        membresia_plan: {
          id_membresia_plan: ids.mensual,
          nombre: 'Plan Mensual',
          duracion_dias: 30,
          precio: 25000,
        },
        membresia_estado: { id_membresia_estado: 1, descripcion: 'Activa' },
        usuario: {
          id_usuario: 1,
          nombre: 'Sofía',
          apellido: 'Gómez',
          dni: '30111222',
          email: 'sofia@test.local',
        },
      });
    });

    it('filtra por estado', async () => {
      const respuesta = await request(servidor())
        .get('/membresias')
        .query({ id_membresia_estado: 2 })
        .set('Authorization', bearer('gerente'))
        .expect(200);
      const membresias = respuesta.body as MembresiaRespuesta[];

      expect(membresias.map((membresia) => membresia.id_membresia)).toEqual([
        ids.sinPagos,
      ]);
    });

    it('GET /membresias/:id devuelve el detalle y 404 si no existe', async () => {
      const respuesta = await request(servidor())
        .get(`/membresias/${ids.sinPagos}`)
        .set('Authorization', bearer('gerente'))
        .expect(200);
      expect((respuesta.body as MembresiaRespuesta).usuario.nombre).toBe(
        'Victor',
      );

      await request(servidor())
        .get('/membresias/9999')
        .set('Authorization', bearer('gerente'))
        .expect(404);
    });
  });

  describe('POST /membresias (gerente)', () => {
    it('da de alta una membresía activa y calcula el vencimiento según el plan', async () => {
      const respuesta = await request(servidor())
        .post('/membresias')
        .set('Authorization', bearer('gerente'))
        .send({
          id_usuario: 3,
          id_membresia_plan: ids.mensual,
          fecha_inicio: '2026-10-27',
        })
        .expect(201);
      const creada = respuesta.body as MembresiaRespuesta;

      expect(creada).toMatchObject({
        id_usuario: 3,
        fecha_inicio: '2026-10-27T00:00:00.000Z',
        fecha_fin: '2026-11-27T00:00:00.000Z',
        renovacion_automatica: false,
        membresia_estado: { descripcion: 'Activa' },
        usuario: { nombre: 'Lucía' },
      });
    });

    it('responde 404 si el plan no existe', async () => {
      await request(servidor())
        .post('/membresias')
        .set('Authorization', bearer('gerente'))
        .send({
          id_usuario: 3,
          id_membresia_plan: 999,
          fecha_inicio: '2026-10-27',
        })
        .expect(404);
    });

    it('responde 400 si falta el socio', async () => {
      await request(servidor())
        .post('/membresias')
        .set('Authorization', bearer('gerente'))
        .send({ id_membresia_plan: ids.mensual, fecha_inicio: '2026-10-27' })
        .expect(400);
    });
  });

  describe('PATCH /membresias/:id/estado (gerente)', () => {
    it('cambia el estado usando la tabla membresia_estado', async () => {
      const respuesta = await request(servidor())
        .patch(`/membresias/${ids.sinPagos}/estado`)
        .set('Authorization', bearer('gerente'))
        .send({ id_membresia_estado: 3 })
        .expect(200);

      expect((respuesta.body as MembresiaRespuesta).membresia_estado).toEqual({
        id_membresia_estado: 3,
        descripcion: 'Suspendida',
      });
    });

    it('responde 404 si el estado no existe', async () => {
      await request(servidor())
        .patch(`/membresias/${ids.sinPagos}/estado`)
        .set('Authorization', bearer('gerente'))
        .send({ id_membresia_estado: 99 })
        .expect(404);
    });
  });

  describe('PATCH /membresias/:id (gerente)', () => {
    it('modifica el vencimiento y la renovación automática', async () => {
      const respuesta = await request(servidor())
        .patch(`/membresias/${ids.sinPagos}`)
        .set('Authorization', bearer('gerente'))
        .send({ fecha_fin: '2026-12-31', renovacion_automatica: true })
        .expect(200);

      expect(respuesta.body).toMatchObject({
        fecha_inicio: '2026-06-01T00:00:00.000Z',
        fecha_fin: '2026-12-31T00:00:00.000Z',
        renovacion_automatica: true,
      });
    });

    it('rechaza un vencimiento anterior al inicio', async () => {
      const respuesta = await request(servidor())
        .patch(`/membresias/${ids.sinPagos}`)
        .set('Authorization', bearer('gerente'))
        .send({ fecha_fin: '2026-05-01' })
        .expect(400);
      expect(String((respuesta.body as CuerpoDeError).message)).toContain(
        'anterior a la fecha de inicio',
      );
    });

    it.each([
      ['sin cambios', {}],
      ['con fecha mal formada', { fecha_fin: '31/12/2026' }],
      ['con campos no permitidos', { id_usuario: 1 }],
    ])('responde 400 %s', async (_caso, cuerpo) => {
      await request(servidor())
        .patch(`/membresias/${ids.sinPagos}`)
        .set('Authorization', bearer('gerente'))
        .send(cuerpo)
        .expect(400);
    });
  });

  describe('DELETE /membresias/:id (gerente)', () => {
    it('no elimina una membresía con pagos: responde 409', async () => {
      const respuesta = await request(servidor())
        .delete(`/membresias/${ids.conPagos}`)
        .set('Authorization', bearer('gerente'))
        .expect(409);
      expect(String((respuesta.body as CuerpoDeError).message)).toContain(
        'pagos registrados',
      );

      const conservada = await contexto.base.prisma.membresia.findUnique({
        where: { id_membresia: ids.conPagos },
      });
      expect(conservada).not.toBeNull();
    });

    it('elimina una membresía sin pagos', async () => {
      await request(servidor())
        .delete(`/membresias/${ids.sinPagos}`)
        .set('Authorization', bearer('gerente'))
        .expect(200);

      await request(servidor())
        .get(`/membresias/${ids.sinPagos}`)
        .set('Authorization', bearer('gerente'))
        .expect(404);
    });
  });
});
