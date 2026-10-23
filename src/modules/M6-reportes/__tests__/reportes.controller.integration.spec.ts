import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import supabaseConfig from '../../../config/supabase.config';
import { SupabaseModule } from '../../../common/supabase/supabase.module';
import { PrismaModule } from '../../../database/prisma-service/prisma.module';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { UsuariosModule } from '../../M1-usuarios/usuarios.module';
import { ReportesModule } from '../reportes.module';
import {
  BaseDePruebas,
  crearBaseDePruebas,
} from '../../../../test/utils/prisma-pglite';
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
  let app: INestApplication<App>;
  let base: BaseDePruebas;
  let jwtService: JwtService;

  const consulta = {
    fecha_desde: PERIODO_REPORTES.fecha_desde,
    fecha_hasta: PERIODO_REPORTES.fecha_hasta,
  };

  const tokenConRol = (rol: string, id_usuario: number): string =>
    jwtService.sign({
      sub: id_usuario,
      email: `${rol}@test.local`,
      rol,
      roles: [rol],
    });

  beforeAll(async () => {
    // Variables mínimas para construir los servicios de Supabase; las pruebas
    // no realizan llamadas de red porque usan JWT locales.
    process.env.SUPABASE_URL ??= 'http://127.0.0.1:54321';
    process.env.SUPABASE_ANON_KEY ??= 'clave-anon-de-prueba';

    base = await crearBaseDePruebas();
    await sembrarEscenarioReportes(base.prisma);

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [supabaseConfig],
        }),
        PrismaModule,
        SupabaseModule,
        UsuariosModule,
        ReportesModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(base.prisma)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    jwtService = app.get(JwtService);
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await base?.cerrar();
  });

  describe.each(['/reportes/ingresos', '/reportes/ocupacion'])(
    'GET %s',
    (ruta) => {
      it('responde 401 sin token', async () => {
        const respuesta = await request(app.getHttpServer())
          .get(ruta)
          .query(consulta)
          .expect(401);

        const cuerpo = respuesta.body as CuerpoDeError;
        expect(cuerpo.statusCode).toBe(401);
      });

      it('responde 401 con un encabezado Authorization mal formado', async () => {
        await request(app.getHttpServer())
          .get(ruta)
          .query(consulta)
          .set('Authorization', 'Basic abc123')
          .expect(401);
      });

      it('responde 403 con token de socio', async () => {
        const respuesta = await request(app.getHttpServer())
          .get(ruta)
          .query(consulta)
          .set('Authorization', `Bearer ${tokenConRol('socio', 1)}`)
          .expect(403);

        const cuerpo = respuesta.body as CuerpoDeError;
        expect(cuerpo.statusCode).toBe(403);
        expect(String(cuerpo.message)).toContain('gerente');
      });

      it('responde 403 con token de recepcionista', async () => {
        await request(app.getHttpServer())
          .get(ruta)
          .query(consulta)
          .set('Authorization', `Bearer ${tokenConRol('recepcionista', 2)}`)
          .expect(403);
      });

      it('responde 200 con token de admin', async () => {
        await request(app.getHttpServer())
          .get(ruta)
          .query(consulta)
          .set('Authorization', `Bearer ${tokenConRol('admin', 2)}`)
          .expect(200);
      });
    },
  );

  it('con token de gerente devuelve el reporte de ingresos consolidado', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/reportes/ingresos')
      .query(consulta)
      .set('Authorization', `Bearer ${tokenConRol('gerente', 2)}`)
      .expect(200);

    expect(respuesta.body).toEqual({
      fecha_desde: PERIODO_REPORTES.fecha_desde,
      fecha_hasta: PERIODO_REPORTES.fecha_hasta,
      total_ingresos: INGRESOS_ESPERADOS.total,
      sedes: INGRESOS_ESPERADOS.porSede,
    });
  });

  it('con token de gerente devuelve las métricas de ocupación por sede', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/reportes/ocupacion')
      .query(consulta)
      .set('Authorization', `Bearer ${tokenConRol('gerente', 2)}`)
      .expect(200);

    expect(respuesta.body).toEqual({
      fecha_desde: PERIODO_REPORTES.fecha_desde,
      fecha_hasta: PERIODO_REPORTES.fecha_hasta,
      sedes: OCUPACION_ESPERADA,
    });
  });

  it('sigue validando el rango de fechas (400) una vez autorizado', async () => {
    await request(app.getHttpServer())
      .get('/reportes/ingresos')
      .query({ fecha_desde: '2026-10-14', fecha_hasta: '2026-10-01' })
      .set('Authorization', `Bearer ${tokenConRol('gerente', 2)}`)
      .expect(400);
  });
});
