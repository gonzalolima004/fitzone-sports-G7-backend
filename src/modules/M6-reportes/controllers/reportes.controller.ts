import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConsultaIngresosDto } from '../dto/consulta-ingresos.dto';
import { ReporteIngresosResponseDto } from '../dto/reporte-ingresos-response.dto';
import { ReportesService } from '../services/reportes.service';

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
}
