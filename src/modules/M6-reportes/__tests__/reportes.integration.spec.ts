import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { ReportesRepository } from '../repositories/reportes.repository';
import { ReportesService } from '../services/reportes.service';
import { ConceptoIngreso } from '../dto/consulta-ingresos.dto';
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

/**
 * Pruebas de integración de M6-reportes (E11-T2): ReportesService y
 * ReportesRepository contra una base PostgreSQL temporal (PGlite) con el
 * esquema real y datos conocidos. Fijan los resultados de los reportes para
 * que cualquier cambio en la forma de consultar (SQL nativo o Prisma ORM)
 * tenga que devolver exactamente los mismos números.
 */
describe('Reportes (integración con PostgreSQL temporal)', () => {
  let base: BaseDePruebas;
  let service: ReportesService;
  let repository: ReportesRepository;

  const { desde, hastaExclusiva } = PERIODO_REPORTES;
  const periodo = {
    fecha_desde: PERIODO_REPORTES.fecha_desde,
    fecha_hasta: PERIODO_REPORTES.fecha_hasta,
  };

  beforeAll(async () => {
    base = await crearBaseDePruebas();
    await sembrarEscenarioReportes(base.prisma);

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReportesService,
        ReportesRepository,
        { provide: PrismaService, useValue: base.prisma },
      ],
    }).compile();

    service = moduleRef.get(ReportesService);
    repository = moduleRef.get(ReportesRepository);
  }, 60_000);

  afterAll(async () => {
    await base?.cerrar();
  });

  describe('ingresos por sede', () => {
    it('consolida solo pagos aprobados dentro del período, por sede', async () => {
      await expect(service.obtenerReporteIngresos(periodo)).resolves.toEqual({
        ...periodo,
        total_ingresos: INGRESOS_ESPERADOS.total,
        sedes: INGRESOS_ESPERADOS.porSede,
      });
    });

    it('filtra por sede', async () => {
      await expect(
        service.obtenerReporteIngresos({ ...periodo, id_sede: 2 }),
      ).resolves.toEqual({
        ...periodo,
        total_ingresos: 2000,
        sedes: INGRESOS_ESPERADOS.soloCanchas,
      });
    });

    it('filtra por concepto membresía o cancha', async () => {
      const membresias = await service.obtenerReporteIngresos({
        ...periodo,
        concepto: ConceptoIngreso.MEMBRESIA,
      });
      const canchas = await service.obtenerReporteIngresos({
        ...periodo,
        concepto: ConceptoIngreso.CANCHA,
      });

      expect(membresias.sedes).toEqual(INGRESOS_ESPERADOS.soloMembresias);
      expect(membresias.total_ingresos).toBe(1500);
      expect(canchas.sedes).toEqual(INGRESOS_ESPERADOS.soloCanchas);
      expect(canchas.total_ingresos).toBe(2000);
    });

    it('combina sede y concepto sin resultados cuando no hay coincidencias', async () => {
      await expect(
        service.obtenerReporteIngresos({
          ...periodo,
          id_sede: 1,
          concepto: ConceptoIngreso.CANCHA,
        }),
      ).resolves.toEqual({ ...periodo, total_ingresos: 0, sedes: [] });
    });

    it('compara el estado del pago sin distinguir mayúsculas', async () => {
      const filas = await repository.obtenerIngresosPorSede(
        desde,
        hastaExclusiva,
        'APROBADO',
      );

      expect(
        filas.map((fila) => ({
          id_sede: fila.id_sede,
          nombre_sede: fila.nombre_sede,
          total_ingresos: Number(fila.total_ingresos),
        })),
      ).toEqual(INGRESOS_ESPERADOS.porSede);
    });

    it('devuelve una lista vacía para un período sin pagos', async () => {
      await expect(
        service.obtenerReporteIngresos({
          fecha_desde: '2027-01-01',
          fecha_hasta: '2027-01-31',
        }),
      ).resolves.toEqual({
        fecha_desde: '2027-01-01',
        fecha_hasta: '2027-01-31',
        total_ingresos: 0,
        sedes: [],
      });
    });
  });

  describe('métricas de ocupación por sede', () => {
    it('cuenta asistencias y reservas confirmadas de canchas y clases', async () => {
      await expect(service.obtenerMetricasOcupacion(periodo)).resolves.toEqual({
        ...periodo,
        sedes: OCUPACION_ESPERADA,
      });
    });

    it('filtra por sede', async () => {
      await expect(
        service.obtenerMetricasOcupacion({ ...periodo, id_sede: 2 }),
      ).resolves.toEqual({ ...periodo, sedes: [OCUPACION_ESPERADA[1]] });
    });

    it('no incluye sedes sin actividad en el período', async () => {
      await expect(
        repository.obtenerMetricasOcupacionPorSede(desde, hastaExclusiva, 3),
      ).resolves.toEqual([]);
    });

    it('devuelve una lista vacía para un período sin actividad', async () => {
      await expect(
        repository.obtenerMetricasOcupacionPorSede(
          new Date('2027-01-01T00:00:00.000Z'),
          new Date('2027-01-02T00:00:00.000Z'),
        ),
      ).resolves.toEqual([]);
    });
  });
});
