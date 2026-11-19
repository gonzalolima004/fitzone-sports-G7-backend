import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConsultaIngresosDto } from '../dto/consulta-ingresos.dto';
import { ReporteIngresosResponseDto } from '../dto/reporte-ingresos-response.dto';
import { ReportesService } from '../services/reportes.service';
import { ConsultaMetricasOcupacionDto } from '../dto/consulta-metricas-ocupacion.dto';
import { ReporteOcupacionResponseDto } from '../dto/reporte-ocupacion-response.dto';
import { ConsultaSociosActivosDto } from '../dto/consulta-socios-activos.dto';
import { ReporteSociosActivosResponseDto } from '../dto/reporte-socios-activos-response.dto';
import { ReporteAforoResponseDto } from '../dto/reporte-aforo-response.dto';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Reportes')
@ApiBearerAuth()
@ApiResponse({
  status: 401,
  description: 'No autorizado. Token no proporcionado o inválido.',
})
@ApiResponse({
  status: 403,
  description: 'Acceso denegado: se requiere rol gerente.',
})
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('gerente')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('ingresos')
  @ApiOperation({
    summary: 'Obtener reporte consolidado de ingresos (Solo gerente)',
  })
  @ApiResponse({
    status: 200,
    description: 'Reportes de ingresos generados correctamente',
    type: ReporteIngresosResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Rango de fechas invalido',
  })
  async obtenerIngresos(
    @Query() consulta: ConsultaIngresosDto,
  ): Promise<ReporteIngresosResponseDto> {
    return this.reportesService.obtenerReporteIngresos(consulta);
  }

  @Get('ocupacion')
  @ApiOperation({
    summary: 'Obtener métricas de ocupación por sede (Solo gerente)',
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

  @Get('socios-activos')
  @ApiOperation({
    summary:
      'Obtener los socios con membresía activa y vigente, en total y por sede (Solo gerente)',
  })
  @ApiResponse({
    status: 200,
    description: 'Socios activos contados correctamente',
    type: ReporteSociosActivosResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Fecha inválida',
  })
  async obtenerSociosActivos(
    @Query() consulta: ConsultaSociosActivosDto,
  ): Promise<ReporteSociosActivosResponseDto> {
    return this.reportesService.obtenerSociosActivos(consulta);
  }

  @Get('aforo')
  @ApiOperation({
    summary:
      'Obtener el aforo actual y máximo de todas las sedes activas (Solo gerente)',
  })
  @ApiResponse({
    status: 200,
    description: 'Aforo de las sedes obtenido correctamente',
    type: ReporteAforoResponseDto,
  })
  async obtenerAforo(): Promise<ReporteAforoResponseDto> {
    return this.reportesService.obtenerAforo();
  }
}
