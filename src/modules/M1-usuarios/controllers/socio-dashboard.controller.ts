import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SocioDashboardService } from '../services/socio-dashboard.service';
import { HistorialQueryDto } from '../dto/historial-query.dto';
import { HistorialResponseDto } from '../dto/historial-response.dto';
import { SocioDashboardResponseDto } from '../dto/socio-dashboard-response.dto';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUserId } from '../../../common/decorators/current-user.decorator';

@ApiTags('Socio - Dashboard e Historial')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('socio')
@Controller('usuarios/me')
@UseInterceptors(ClassSerializerInterceptor)
export class SocioDashboardController {
  constructor(private readonly socioDashboardService: SocioDashboardService) {}

  @Get('dashboard')
  @ApiOperation({
    summary:
      'Obtener métricas, membresía y próximas reservas para el Dashboard del Socio',
    description:
      'Devuelve el resumen de actividades del socio autenticado, estado de su membresía y próximas reservas confirmadas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen del dashboard obtenido exitosamente.',
    type: SocioDashboardResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol socio.',
  })
  async obtenerDashboard(
    @CurrentUserId() userId: number,
  ): Promise<SocioDashboardResponseDto> {
    return this.socioDashboardService.obtenerDashboard(userId);
  }

  @Get('historial')
  @Roles('socio', 'externo')
  @ApiOperation({
    summary:
      'Obtener historial unificado de reservas de canchas y clases grupales',
    description:
      'Recupera las actividades pasadas y futuras del socio ordenadas de más reciente a más antigua. Permite paginación y filtro por tipo (todas, canchas, clases).',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de reservas obtenido correctamente.',
    type: HistorialResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol socio o externo.',
  })
  async obtenerHistorial(
    @CurrentUserId() userId: number,
    @Query() query: HistorialQueryDto,
  ): Promise<HistorialResponseDto> {
    return this.socioDashboardService.obtenerHistorial(userId, query);
  }
}
