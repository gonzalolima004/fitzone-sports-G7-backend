import { INestApplication, Type, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { App } from 'supertest/types';
import supabaseConfig from '../../src/config/supabase.config';
import { SupabaseModule } from '../../src/common/supabase/supabase.module';
import { PrismaModule } from '../../src/database/prisma-service/prisma.module';
import { PrismaService } from '../../src/database/prisma-service/prisma.service';
import { UsuariosModule } from '../../src/modules/M1-usuarios/usuarios.module';
import { BaseDePruebas, crearBaseDePruebas } from './prisma-pglite';

/**
 * Aplicación NestJS de pruebas para tests de integración HTTP (Supertest).
 *
 * - Usa los módulos reales (incluidos los guards de autenticación y roles).
 * - Reemplaza únicamente la conexión a la base: PrismaService apunta a una
 *   base PostgreSQL temporal en memoria (PGlite) con el esquema real.
 * - Los tokens se firman con el mismo JwtService de la aplicación, por lo que
 *   SupabaseAuthGuard los valida localmente y no hay llamadas de red.
 */
export interface AppDePruebas {
  app: INestApplication<App>;
  base: BaseDePruebas;
  tokenConRol(rol: string, idUsuario?: number): string;
  cerrar(): Promise<void>;
}

export async function crearAppDePruebas(
  modulos: Type<unknown>[],
  sembrar?: (prisma: PrismaClient) => Promise<void>,
): Promise<AppDePruebas> {
  // Variables mínimas para construir los clientes de Supabase (sin uso de red).
  process.env.SUPABASE_URL ??= 'http://127.0.0.1:54321';
  process.env.SUPABASE_ANON_KEY ??= 'clave-anon-de-prueba';

  const base = await crearBaseDePruebas();
  if (sembrar) {
    await sembrar(base.prisma);
  }

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
      ...modulos,
    ],
  })
    .overrideProvider(PrismaService)
    .useValue(base.prisma)
    .compile();

  const app = moduleRef.createNestApplication<INestApplication<App>>();
  // Misma configuración que main.ts
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();

  const jwtService = app.get(JwtService);

  return {
    app,
    base,
    tokenConRol: (rol: string, idUsuario = 1) =>
      jwtService.sign({
        sub: idUsuario,
        email: `${rol}@test.local`,
        rol,
        roles: [rol],
      }),
    cerrar: async () => {
      await app.close();
      await base.cerrar();
    },
  };
}
