import request from 'supertest';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  AppDePruebas,
  crearAppDePruebas,
} from '../../../../test/utils/app-de-pruebas';

type PlanRespuesta = {
  id: number;
  id_plan: number;
  nombre: string;
  duracion_dias: number;
  precio: number;
};

/**
 * Integración HTTP de los planes de membresía (E11-T1): el catálogo es
 * público y su administración queda reservada a gerente y admin.
 * PlanesController pertenece a UsuariosModule, que el helper ya importa.
 */
describe('Planes de membresía (integración): permisos de escritura', () => {
  let contexto: AppDePruebas;
  let idMensual = 0;

  const sembrar = async (prisma: PrismaClient) => {
    const mensual = await prisma.membresiaPlan.create({
      data: {
        nombre: 'Mensual',
        duracion_dias: 30,
        precio: new Prisma.Decimal('25000.00'),
      },
    });
    await prisma.membresiaPlan.create({
      data: {
        nombre: 'Anual',
        duracion_dias: 365,
        precio: new Prisma.Decimal('250000.00'),
      },
    });
    idMensual = mensual.id_membresia_plan;
  };

  const servidor = () => contexto.app.getHttpServer();
  const bearer = (rol: string) => `Bearer ${contexto.tokenConRol(rol)}`;

  beforeAll(async () => {
    contexto = await crearAppDePruebas([], sembrar);
  }, 60_000);

  afterAll(async () => {
    await contexto?.cerrar();
  });

  it('GET /planes es público y expone solo los campos del DTO, con precio numérico', async () => {
    const respuesta = await request(servidor()).get('/planes').expect(200);
    const planes = respuesta.body as PlanRespuesta[];

    expect(planes).toEqual(
      expect.arrayContaining([
        {
          id: idMensual,
          id_plan: idMensual,
          nombre: 'Mensual',
          duracion_dias: 30,
          precio: 25000,
        },
      ]),
    );
    expect(Object.keys(planes[0]).sort()).toEqual(
      ['duracion_dias', 'id', 'id_plan', 'nombre', 'precio'].sort(),
    );
  });

  describe('POST /planes', () => {
    const nuevoPlan = {
      nombre: 'plan semestral',
      duracion_dias: 180,
      precio: 99000.5,
    };

    it('responde 401 sin token y 403 con token de socio', async () => {
      await request(servidor()).post('/planes').send(nuevoPlan).expect(401);
      await request(servidor())
        .post('/planes')
        .set('Authorization', bearer('socio'))
        .send(nuevoPlan)
        .expect(403);

      expect(
        await contexto.base.prisma.membresiaPlan.count({
          where: { duracion_dias: 180 },
        }),
      ).toBe(0);
    });

    it('con token de gerente crea el plan y normaliza el nombre', async () => {
      const respuesta = await request(servidor())
        .post('/planes')
        .set('Authorization', bearer('gerente'))
        .send(nuevoPlan)
        .expect(201);

      expect(respuesta.body as PlanRespuesta).toMatchObject({
        nombre: 'Plan Semestral',
        duracion_dias: 180,
        precio: 99000.5,
      });
    });

    it('responde 400 si la duración es menor a un día', async () => {
      await request(servidor())
        .post('/planes')
        .set('Authorization', bearer('gerente'))
        .send({ ...nuevoPlan, duracion_dias: 0 })
        .expect(400);
    });
  });

  describe('PATCH /planes/:id', () => {
    it('responde 403 con token de recepcionista', async () => {
      await request(servidor())
        .patch(`/planes/${idMensual}`)
        .set('Authorization', bearer('recepcionista'))
        .send({ precio: 1 })
        .expect(403);
    });

    it('con token de gerente actualiza el precio', async () => {
      const respuesta = await request(servidor())
        .patch(`/planes/${idMensual}`)
        .set('Authorization', bearer('gerente'))
        .send({ precio: 27500 })
        .expect(200);

      expect(respuesta.body as PlanRespuesta).toMatchObject({
        id: idMensual,
        nombre: 'Mensual',
        precio: 27500,
      });
    });
  });

  describe('DELETE /planes/:id', () => {
    it('responde 401 sin token', async () => {
      await request(servidor()).delete(`/planes/${idMensual}`).expect(401);
    });

    it('con token de gerente elimina un plan sin membresías asociadas', async () => {
      const temporal = await contexto.base.prisma.membresiaPlan.create({
        data: {
          nombre: 'Promo',
          duracion_dias: 7,
          precio: new Prisma.Decimal('5000.00'),
        },
      });

      await request(servidor())
        .delete(`/planes/${temporal.id_membresia_plan}`)
        .set('Authorization', bearer('gerente'))
        .expect(200);

      const listado = await request(servidor()).get('/planes').expect(200);
      expect(
        (listado.body as PlanRespuesta[]).map((plan) => plan.id),
      ).not.toContain(temporal.id_membresia_plan);
    });

    it.todo(
      'debería responder 409 al eliminar un plan con membresías asociadas (hoy la FK lo rechaza con 500; pendiente en PlanesService)',
    );
  });
});
