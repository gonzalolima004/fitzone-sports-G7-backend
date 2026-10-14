// Verificación aislada: npm run build y luego ejecutar este archivo con Node.
// PGLITE_MODULE_PATH puede apuntar a una instalación temporal de @electric-sql/pglite.
const assert = require('node:assert/strict');
const path = require('node:path');
const { PGlite } = require(process.env.PGLITE_MODULE_PATH || '@electric-sql/pglite');
const repoRoot = process.env.REPORTES_REPO_ROOT || path.resolve(__dirname, '..');
const { ReportesRepository } = require(path.join(repoRoot, 'dist/src/modules/M6-reportes/repositories/reportes.repository.js'));

async function main() {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE TABLE sede (id_sede int PRIMARY KEY, nombre text);
      CREATE TABLE registro_accesos (id_registro_acceso int, id_sede int, fecha_ingreso timestamp);
      CREATE TABLE cancha (id_cancha int, id_sede int);
      CREATE TABLE cancha_reserva_estado (id_cancha_reserva_estado int, descripcion text);
      CREATE TABLE cancha_reserva (id_cancha_reserva int, id_cancha int, id_cancha_reserva_estado int, fecha_inicio timestamp);
      CREATE TABLE clase (id_clase int, id_sede int);
      CREATE TABLE clase_reserva_estado (id_clase_reserva_estado int, descripcion text);
      CREATE TABLE clase_reserva (id_clase_reserva int, id_clase int, id_clase_reserva_estado int, fecha_inicio timestamp);
      INSERT INTO sede VALUES (1, 'Centro'), (2, 'Solo canchas'), (3, 'Solo clases'), (4, 'Sin actividad');
      INSERT INTO cancha VALUES (1, 1), (2, 2);
      INSERT INTO clase VALUES (1, 1), (3, 3);
      INSERT INTO cancha_reserva_estado VALUES (1, 'Confirmada'), (2, 'Cancelada');
      INSERT INTO clase_reserva_estado VALUES (1, 'CONFIRMADA'), (2, 'En espera'), (3, 'Cancelada');
      INSERT INTO registro_accesos VALUES
        (1, 1, '2026-10-01 00:00'), (2, 1, '2026-10-14 23:59:59'), (3, 1, '2026-10-15 00:00'), (4, 1, '2026-09-30 23:59:59');
      INSERT INTO cancha_reserva VALUES
        (1, 1, 1, '2026-10-01'), (2, 1, 1, '2026-10-14 23:59:59'), (3, 2, 1, '2026-10-10'),
        (4, 1, 2, '2026-10-10'), (5, 1, 1, '2026-10-15');
      INSERT INTO clase_reserva VALUES
        (1, 1, 1, '2026-10-10'), (2, 3, 1, '2026-10-10'), (3, 1, 2, '2026-10-10'),
        (4, 1, 3, '2026-10-10'), (5, 1, 1, '2026-10-15');
    `);
    const repository = new ReportesRepository({
      $queryRaw: async (query) => (await db.query(query.text, query.values)).rows,
    });
    const desde = new Date('2026-10-01T00:00:00Z');
    const hasta = new Date('2026-10-15T00:00:00Z');
    const rows = await repository.obtenerMetricasOcupacionPorSede(desde, hasta);
    assert.deepEqual(rows, [
      { id_sede: 1, nombre_sede: 'Centro', total_asistencias: 2, total_reservas_canchas: 2, total_reservas_clases: 1 },
      { id_sede: 2, nombre_sede: 'Solo canchas', total_asistencias: 0, total_reservas_canchas: 1, total_reservas_clases: 0 },
      { id_sede: 3, nombre_sede: 'Solo clases', total_asistencias: 0, total_reservas_canchas: 0, total_reservas_clases: 1 },
    ]);
    assert.deepEqual(await repository.obtenerMetricasOcupacionPorSede(desde, hasta, 2), [rows[1]]);
    assert.deepEqual(await repository.obtenerMetricasOcupacionPorSede(desde, hasta, 4), []);
    assert.deepEqual(await repository.obtenerMetricasOcupacionPorSede(new Date('2027-01-01'), new Date('2027-01-02')), []);
    console.log('SQL OK: consolidado, sede, sin actividad, rango vacío; límites de fecha, estados y reservas sin asistencia verificados.');
  } finally {
    await db.close();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
