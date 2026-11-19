import { BadRequestException, Injectable } from '@nestjs/common';
import { ConsultaIngresosDto } from '../dto/consulta-ingresos.dto';
import { ReporteIngresosResponseDto } from '../dto/reporte-ingresos-response.dto';
import { ReportesRepository } from '../repositories/reportes.repository';
import { ConsultaMetricasOcupacionDto } from '../dto/consulta-metricas-ocupacion.dto';
import { ReporteOcupacionResponseDto } from '../dto/reporte-ocupacion-response.dto';
import { ESTADOS_QUE_CUENTAN } from '../constants/reportes.constants';
import { ConsultaSociosActivosDto } from '../dto/consulta-socios-activos.dto';
import { ReporteSociosActivosResponseDto } from '../dto/reporte-socios-activos-response.dto';
import { ReporteAforoResponseDto } from '../dto/reporte-aforo-response.dto';

/**
 * Fecha de hoy en Argentina (YYYY-MM-DD). Se calcula con la zona horaria
 * explícita para no depender del huso horario de la máquina que corre el
 * backend.
 */
function fechaDeHoyEnArgentina(): string {
  const partes = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const parte = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((p) => p.type === tipo)?.value ?? '';
  return `${parte('year')}-${parte('month')}-${parte('day')}`;
}

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
      ESTADOS_QUE_CUENTAN.PAGO,
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

  /**
   * Socios activos de toda la cadena y por sede en la fecha consultada (por
   * defecto, hoy en Argentina). Las fechas de las membresías son de tipo
   * fecha, así que se compara contra la medianoche UTC de ese día.
   */
  async obtenerSociosActivos(
    consulta: ConsultaSociosActivosDto,
  ): Promise<ReporteSociosActivosResponseDto> {
    const fecha = (consulta.fecha ?? fechaDeHoyEnArgentina()).slice(0, 10);

    const sedes = await this.reportesRepository.obtenerSociosActivosPorSede(
      new Date(`${fecha}T00:00:00.000Z`),
      ESTADOS_QUE_CUENTAN.MEMBRESIA,
    );

    return {
      fecha,
      total_socios_activos: sedes.reduce(
        (total, sede) => total + sede.socios_activos,
        0,
      ),
      sedes,
    };
  }

  /** Aforo actual y máximo de cada sede activa, con los totales de la cadena. */
  async obtenerAforo(): Promise<ReporteAforoResponseDto> {
    const sedes = await this.reportesRepository.obtenerAforoPorSede();

    return {
      total_aforo_actual: sedes.reduce(
        (total, sede) => total + sede.aforo_actual,
        0,
      ),
      total_aforo_maximo: sedes.reduce(
        (total, sede) => total + sede.aforo_maximo,
        0,
      ),
      sedes,
    };
  }
}
