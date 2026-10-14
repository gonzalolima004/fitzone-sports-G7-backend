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
