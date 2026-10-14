import { BadRequestException, Injectable } from '@nestjs/common';
import { ConsultaIngresosDto } from '../dto/consulta-ingresos.dto';
import { ReporteIngresosResponseDto } from '../dto/reporte-ingresos-response.dto';
import { ReportesRepository } from '../repositories/reportes.repository';
import { ConsultaMetricasOcupacionDto } from '../dto/consulta-metricas-ocupacion.dto';
import { ReporteOcupacionResponseDto } from '../dto/reporte-ocupacion-response.dto';

@Injectable()
export class ReportesService {
  constructor(private readonly reportesRepository: ReportesRepository) {}

  async obtenerReporteIngresos(
    consulta: ConsultaIngresosDto,
  ): Promise<ReporteIngresosResponseDto> {
    const fechaDesde = new Date(consulta.fecha_desde);
    const fechaHasta = new Date(consulta.fecha_hasta);

    if (fechaDesde > fechaHasta) {
      throw new BadRequestException(
        'La fecha desde no puede ser posterior a la fecha hasta',
      );
    }

    const fechaHastaExclusica = new Date(fechaHasta);
    fechaHastaExclusica.setUTCDate(fechaHastaExclusica.getUTCDate() + 1);

    const ingresos = await this.reportesRepository.obtenerIngresosPorSede(
      fechaDesde,
      fechaHastaExclusica,
      'Aprobado',
      consulta.id_sede,
      consulta.concepto,
    );

    const sedes = ingresos.map((ingreso) => ({
      id_sede: ingreso.id_sede,
      nombre_sede: ingreso.nombre_sede,
      total_ingresos: Number(ingreso.total_ingresos),
    }));

    const totalIngresos = sedes.reduce(
      (acumulador, sede) => acumulador + sede.total_ingresos,
      0,
    );

    return {
      fecha_desde: consulta.fecha_desde,
      fecha_hasta: consulta.fecha_hasta,
      total_ingresos: totalIngresos,
      sedes,
    };
  }

  async obtenerMetricasOcupacion(
    consulta: ConsultaMetricasOcupacionDto,
  ): Promise<ReporteOcupacionResponseDto> {
    const fechaDesde = new Date(consulta.fecha_desde);
    const fechaHasta = new Date(consulta.fecha_hasta);

    if (fechaDesde > fechaHasta) {
      throw new BadRequestException(
        'La fecha desde no puede ser posterior a la fecha hasta',
      );
    }

    const fechaHastaExclusiva = new Date(fechaHasta);
    fechaHastaExclusiva.setUTCDate(fechaHastaExclusiva.getUTCDate() + 1);

    const sedes = await this.reportesRepository.obtenerMetricasOcupacionPorSede(
      fechaDesde,
      fechaHastaExclusiva,
      consulta.id_sede,
    );

    return {
      fecha_desde: consulta.fecha_desde,
      fecha_hasta: consulta.fecha_hasta,
      sedes,
    };
  }
}
