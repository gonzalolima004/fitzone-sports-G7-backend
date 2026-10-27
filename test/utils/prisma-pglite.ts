import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { PrismaPGlite } from 'pglite-prisma-adapter';
import { PrismaClient } from '@prisma/client';

/**
 * Base de datos PostgreSQL temporal (PGlite, en memoria) con el esquema real
 * de `prisma/schema.prisma` y un Prisma Client conectado a ella.
 *
 * Permite escribir pruebas de integración de repositorios y controladores sin
 * mocks y sin tocar la base compartida de Supabase (ADR-005 / ADR-006).
 */
export interface BaseDePruebas {
  prisma: PrismaClient;
  db: PGlite;
  cerrar(): Promise<void>;
}

const RAIZ_REPO = resolve(__dirname, '..', '..');
const RUTA_ESQUEMA = join(RAIZ_REPO, 'prisma', 'schema.prisma');
const DIRECTORIO_CACHE = join(RAIZ_REPO, 'node_modules', '.cache', 'fitzone');

/**
 * Genera el DDL equivalente al schema.prisma actual con `prisma migrate diff`
 * (no se conecta a ninguna base), para que la base temporal tenga exactamente
 * las mismas tablas y columnas que la real. El resultado se cachea por hash
 * del esquema: si alguien modifica schema.prisma, el DDL se regenera solo.
 */
export function obtenerDdlDelEsquema(): string {
  const esquema = readFileSync(RUTA_ESQUEMA, 'utf8');
  const hash = createHash('sha1').update(esquema).digest('hex').slice(0, 12);
  const rutaCache = join(DIRECTORIO_CACHE, `schema-${hash}.sql`);

  if (existsSync(rutaCache)) {
    return readFileSync(rutaCache, 'utf8');
  }

  const cliPrisma = require.resolve('prisma/build/index.js', {
    paths: [RAIZ_REPO],
  });

  const ddl = execFileSync(
    process.execPath,
    [
      cliPrisma,
      'migrate',
      'diff',
      '--from-empty',
      '--to-schema',
      RUTA_ESQUEMA,
      '--script',
    ],
    {
      cwd: RAIZ_REPO,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PRISMA_HIDE_UPDATE_MESSAGE: '1' },
    },
  );

  // Escritura atómica: Jest corre archivos de test en paralelo y otro worker
  // podría leer el caché a medio escribir.
  mkdirSync(DIRECTORIO_CACHE, { recursive: true });
  const rutaTemporal = `${rutaCache}.${process.pid}.tmp`;
  writeFileSync(rutaTemporal, ddl, 'utf8');
  renameSync(rutaTemporal, rutaCache);

  return ddl;
}

export async function crearBaseDePruebas(): Promise<BaseDePruebas> {
  const db = new PGlite();
  await db.exec(obtenerDdlDelEsquema());

  const prisma = new PrismaClient({ adapter: new PrismaPGlite(db) });

  return {
    prisma,
    db,
    cerrar: async () => {
      await prisma.$disconnect();
      await db.close();
    },
  };
}
