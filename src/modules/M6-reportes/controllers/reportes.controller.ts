import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConsultaIngresosDto } from '../dto/consulta-ingresos.dto';
import { ReporteIngresosResponseDto } from '../dto/reporte-ingresos-response.dto';
import { ReportesService } from '../services/reportes.service';
import { ConsultaMetricasOcupacionDto } from '../dto/consulta-metricas-ocupacion.dto';
import { ReporteOcupacionResponseDto } from '../dto/reporte-ocupacion-response.dto';

@ApiTags('Reportes')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('ingresos')
  @ApiOperation({
    summary: 'Obtener reporte consolidado de ingresos',
  })
  @ApiResponse({
    status: 200,
    description: 'Reportes de ingresos generados correctamente',
    type: ReporteIngresosResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Rango de fechas invalido',
    type: ReporteIngresosResponseDto,
  })
  async obtenerIngresos(
    @Query() consulta: ConsultaIngresosDto,
  ): Promise<ReporteIngresosResponseDto> {
    return this.reportesService.obtenerReporteIngresos(consulta);
  }

  @Get('ocupacion')
  @ApiOperation({
    summary: 'Obtener métricas de ocupación por sede',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas de ocupación generadas correctamente',
    type: ReporteOcupacionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Rango de fechas inválido',
  })
  async obtenerMetricasOcupacion(
    @Query() consulta: ConsultaMetricasOcupacionDto,
  ): Promise<ReporteOcupacionResponseDto> {
    return this.reportesService.obtenerMetricasOcupacion(consulta);
  }
}
