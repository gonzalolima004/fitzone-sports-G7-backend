import { BadRequestException } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { ReportesRepository } from '../repositories/reportes.repository';

describe('ReportesService: ocupación', () => {
  const obtenerMetricasOcupacionPorSede = jest.fn();
  const service = new ReportesService({
    obtenerMetricasOcupacionPorSede,
  } as unknown as ReportesRepository);

  beforeEach(() => jest.resetAllMocks());

  it('incluye todo el último día, incluso al cambiar de mes', async () => {
    obtenerMetricasOcupacionPorSede.mockResolvedValue([]);
    const result = await service.obtenerMetricasOcupacion({
      fecha_desde: '2026-10-01',
      fecha_hasta: '2026-10-31',
      id_sede: 2,
    });
    expect(obtenerMetricasOcupacionPorSede).toHaveBeenCalledWith(
      new Date('2026-10-01'),
      new Date('2026-11-01'),
      2,
    );
    expect(result).toEqual({
      fecha_desde: '2026-10-01',
      fecha_hasta: '2026-10-31',
      sedes: [],
    });
  });

  it('rechaza rangos invertidos antes de consultar', async () => {
    await expect(
      service.obtenerMetricasOcupacion({
        fecha_desde: '2026-10-14',
        fecha_hasta: '2026-10-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(obtenerMetricasOcupacionPorSede).not.toHaveBeenCalled();
  });
});

describe('ReportesService: socios activos', () => {
  const obtenerSociosActivosPorSede = jest.fn();
  const service = new ReportesService({
    obtenerSociosActivosPorSede,
  } as unknown as ReportesRepository);

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it('sin fecha cuenta los socios de hoy en Argentina, sin importar el huso del servidor', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });
    // A las 02:00 UTC del 18/11 en Argentina todavía es 17/11.
    jest.setSystemTime(new Date('2026-11-18T02:00:00.000Z'));
    obtenerSociosActivosPorSede.mockResolvedValue([
      { id_sede: 1, nombre_sede: 'Centro', socios_activos: 3 },
      { id_sede: 2, nombre_sede: 'Norte', socios_activos: 2 },
    ]);

    await expect(service.obtenerSociosActivos({})).resolves.toEqual({
      fecha: '2026-11-17',
      total_socios_activos: 5,
      sedes: [
        { id_sede: 1, nombre_sede: 'Centro', socios_activos: 3 },
        { id_sede: 2, nombre_sede: 'Norte', socios_activos: 2 },
      ],
    });
    expect(obtenerSociosActivosPorSede).toHaveBeenCalledWith(
      new Date('2026-11-17T00:00:00.000Z'),
      'Activa',
    );
  });

  it('usa solo el día de la fecha consultada', async () => {
    obtenerSociosActivosPorSede.mockResolvedValue([]);

    await expect(
      service.obtenerSociosActivos({ fecha: '2026-10-10T15:30:00.000Z' }),
    ).resolves.toEqual({
      fecha: '2026-10-10',
      total_socios_activos: 0,
      sedes: [],
    });
    expect(obtenerSociosActivosPorSede).toHaveBeenCalledWith(
      new Date('2026-10-10T00:00:00.000Z'),
      'Activa',
    );
  });
});
