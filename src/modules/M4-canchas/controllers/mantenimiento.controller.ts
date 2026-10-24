import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MantenimientoService } from '../services/mantenimiento.service';
import { CrearMantenimientoDto } from '../dto/crear-mantenimiento.dto';
import { MantenimientoResponseDto } from '../dto/mantenimiento-response.dto';

@ApiTags('Mantenimiento de Canchas')
@Controller('canchas')
export class MantenimientoController {
  constructor(private readonly mantenimientoService: MantenimientoService) {}

  @Post(':id/mantenimiento')
  @ApiBearerAuth() // Dejar preparado para cuando se integre el guard JWT de la Épica 1
  @ApiOperation({
    summary: 'Programar mantenimiento inhabilitando turnos futuros (RF-12)',
  })
  @ApiResponse({ status: 201, type: MantenimientoResponseDto })
  programarMantenimiento(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearMantenimientoDto,
  ) {
    return this.mantenimientoService.programarMantenimiento(id, dto);
  }

  @Get('mantenimientos')
  @ApiOperation({
    summary: 'Listar mantenimientos de canchas con filtros opcionales',
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
