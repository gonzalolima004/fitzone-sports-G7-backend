import request from 'supertest';
import { ReportesModule } from '../reportes.module';
import {
  AppDePruebas,
  crearAppDePruebas,
} from '../../../../test/utils/app-de-pruebas';
import {
  INGRESOS_ESPERADOS,
  OCUPACION_ESPERADA,
  PERIODO_REPORTES,
  sembrarEscenarioReportes,
} from '../../../../test/utils/escenario-reportes';

type CuerpoDeError = { statusCode: number; message: string | string[] };

/**
 * Prueba de integración HTTP (Supertest, ADR-006) de la protección por rol de
 * los endpoints de reportes. Se ejecutan los guards reales
 * (SupabaseAuthGuard + RolesGuard) sobre una base PostgreSQL temporal (PGlite)
 * con datos conocidos; los tokens son JWT locales firmados por el mismo
 * JwtService de la aplicación, por lo que no se requiere conexión a Supabase.
 */
describe('ReportesController (integración): acceso por rol', () => {
  let contexto: AppDePruebas;

  const consulta = {
    fecha_desde: PERIODO_REPORTES.fecha_desde,
    fecha_hasta: PERIODO_REPORTES.fecha_hasta,
  };

  const servidor = () => contexto.app.getHttpServer();
  const bearer = (rol: string) => `Bearer ${contexto.tokenConRol(rol)}`;

  beforeAll(async () => {
    contexto = await crearAppDePruebas(
      [ReportesModule],
      sembrarEscenarioReportes,
    );
  }, 60_000);

  afterAll(async () => {
    await contexto?.cerrar();
  });

  describe.each(['/reportes/ingresos', '/reportes/ocupacion'])(
    'GET %s',
    (ruta) => {
      it('responde 401 sin token', async () => {
        const respuesta = await request(servidor())
          .get(ruta)
          .query(consulta)
          .expect(401);

        const cuerpo = respuesta.body as CuerpoDeError;
        expect(cuerpo.statusCode).toBe(401);
      });

      it('responde 401 con un encabezado Authorization mal formado', async () => {
        await request(servidor())
          .get(ruta)
          .query(consulta)
          .set('Authorization', 'Basic abc123')
          .expect(401);
      });

      it('responde 403 con token de socio', async () => {
        const respuesta = await request(servidor())
          .get(ruta)
          .query(consulta)
          .set('Authorization', bearer('socio'))
          .expect(403);

        const cuerpo = respuesta.body as CuerpoDeError;
        expect(cuerpo.statusCode).toBe(403);
        expect(String(cuerpo.message)).toContain('gerente');
      });

      it('responde 403 con token de recepcionista', async () => {
        await request(servidor())
          .get(ruta)
          .query(consulta)
          .set('Authorization', bearer('recepcionista'))
          .expect(403);
      });
    },
  );

  it('con token de gerente devuelve el reporte de ingresos consolidado', async () => {
    const respuesta = await request(servidor())
      .get('/reportes/ingresos')
      .query(consulta)
      .set('Authorization', bearer('gerente'))
      .expect(200);

    expect(respuesta.body).toEqual({
      fecha_desde: PERIODO_REPORTES.fecha_desde,
      fecha_hasta: PERIODO_REPORTES.fecha_hasta,
      total_ingresos: INGRESOS_ESPERADOS.total,
      sedes: INGRESOS_ESPERADOS.porSede,
    });
  });

  it('con token de gerente devuelve las métricas de ocupación por sede', async () => {
    const respuesta = await request(servidor())
      .get('/reportes/ocupacion')
      .query(consulta)
      .set('Authorization', bearer('gerente'))
      .expect(200);

    expect(respuesta.body).toEqual({
      fecha_desde: PERIODO_REPORTES.fecha_desde,
      fecha_hasta: PERIODO_REPORTES.fecha_hasta,
      sedes: OCUPACION_ESPERADA,
    });
  });

  it('sigue validando el rango de fechas (400) una vez autorizado', async () => {
    await request(servidor())
      .get('/reportes/ingresos')
      .query({ fecha_desde: '2026-10-14', fecha_hasta: '2026-10-01' })
      .set('Authorization', bearer('gerente'))
      .expect(400);
  });
});
