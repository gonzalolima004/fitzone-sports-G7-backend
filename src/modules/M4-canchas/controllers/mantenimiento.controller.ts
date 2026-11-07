import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { MantenimientoService } from '../services/mantenimiento.service';
import { CrearMantenimientoDto } from '../dto/crear-mantenimiento.dto';
import { MantenimientoResponseDto } from '../dto/mantenimiento-response.dto';

@ApiTags('Mantenimiento de Canchas')
@Controller('canchas')
export class MantenimientoController {
  constructor(private readonly mantenimientoService: MantenimientoService) {}

  @Post(':id/mantenimiento')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente', 'recepcionista')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Programar mantenimiento inhabilitando turnos futuros (Solo personal)',
  })
  @ApiResponse({ status: 201, type: MantenimientoResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado / Token inválido.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido / Requiere rol gerente o recepcionista.',
  })
  programarMantenimiento(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearMantenimientoDto,
  ) {
    return this.mantenimientoService.programarMantenimiento(id, dto);
  }

  @Get('mantenimientos')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente', 'recepcionista')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Listar mantenimientos de canchas con filtros opcionales (Solo personal)',
  })
  @ApiResponse({ status: 401, description: 'No autorizado / Token inválido.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido / Requiere rol gerente o recepcionista.',
  })
  @ApiQuery({
    name: 'sedeId',
    required: false,
    type: Number,
    description: 'Filtrar mantenimientos por ID de sede',
  })
  @ApiQuery({
    name: 'canchaId',
    required: false,
    type: Number,
    description: 'Filtrar mantenimientos por ID de cancha',
  })
  @ApiQuery({
    name: 'fechaInicio',
    required: false,
    type: String,
    description: 'Fecha de inicio del rango (ISO 8601 o YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'fechaFin',
    required: false,
    type: String,
    description: 'Fecha de fin del rango (ISO 8601 o YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de mantenimientos obtenida exitosamente.',
  })
  listarMantenimientos(
    @Query('sedeId') sedeId?: string,
    @Query('canchaId') canchaId?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.mantenimientoService.obtenerMantenimientos({
      sedeId: sedeId ? Number(sedeId) : undefined,
      canchaId: canchaId ? Number(canchaId) : undefined,
      fechaInicio,
      fechaFin,
    });
  }
}
