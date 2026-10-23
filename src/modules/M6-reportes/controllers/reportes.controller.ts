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
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

/**
 * Roles habilitados para consultar la reportería consolidada multi-sede.
 * El actor del dominio es el Gerente Central (A4); admin se incluye por
 * consistencia con el resto de los controladores protegidos del proyecto
 * (ver clases.controller.ts). Si el equipo define "solo gerente", se cambia acá.
 */
const ROLES_REPORTES = ['gerente', 'admin'];

@ApiTags('Reportes')
@ApiBearerAuth()
@ApiResponse({
  status: 401,
  description: 'No autorizado. Token no proporcionado o inválido.',
})
@ApiResponse({
  status: 403,
  description: 'Acceso denegado: se requiere rol gerente o admin.',
})
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(...ROLES_REPORTES)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('ingresos')
  @ApiOperation({
    summary: 'Obtener reporte consolidado de ingresos (Solo gerente y admin)',
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
    summary: 'Obtener métricas de ocupación por sede (Solo gerente y admin)',
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
