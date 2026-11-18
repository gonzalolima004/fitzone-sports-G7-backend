import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CalendarioService } from '../services/calendario.service';
import { CreateCalendarioDto } from '../dto/create-calendario.dto';
import { UpdateCalendarioDto } from '../dto/update-calendario.dto';
import { RangoFechasDto } from '../dto/rango-fechas.dto';
import { CalendarioResponseDto } from '../dto/calendario-response.dto';

/**
 * Calendario general de la cadena (feriados nacionales o para todas las
 * sedes). Todo el CRUD es exclusivo del gerente.
 */
@ApiTags('Calendario')
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
@Controller('calendario')
export class CalendarioController {
  constructor(private readonly calendarioService: CalendarioService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar las fechas del calendario general (Solo gerente)',
  })
  @ApiResponse({
    status: 200,
    description: 'Fechas ordenadas, opcionalmente filtradas por rango',
    type: [CalendarioResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Rango de fechas inválido' })
  async findAll(
    @Query() filtros: RangoFechasDto,
  ): Promise<CalendarioResponseDto[]> {
    return this.calendarioService.findAll(filtros);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una fecha del calendario (Solo gerente)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la fecha' })
  @ApiResponse({ status: 200, type: CalendarioResponseDto })
  @ApiResponse({ status: 404, description: 'Fecha no encontrada' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CalendarioResponseDto> {
    return this.calendarioService.findById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Agregar una fecha o feriado al calendario (Solo gerente)',
  })
  @ApiResponse({ status: 201, type: CalendarioResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'La fecha ya está cargada' })
  async create(
    @Body() dto: CreateCalendarioDto,
  ): Promise<CalendarioResponseDto> {
    return this.calendarioService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Modificar una fecha del calendario (Solo gerente)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la fecha' })
  @ApiResponse({ status: 200, type: CalendarioResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos o sin cambios' })
  @ApiResponse({ status: 404, description: 'Fecha no encontrada' })
  @ApiResponse({ status: 409, description: 'La nueva fecha ya está cargada' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCalendarioDto,
  ): Promise<CalendarioResponseDto> {
    return this.calendarioService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una fecha del calendario (Solo gerente)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la fecha' })
  @ApiResponse({ status: 200, type: CalendarioResponseDto })
  @ApiResponse({ status: 404, description: 'Fecha no encontrada' })
  @ApiResponse({
    status: 409,
    description: 'La fecha tiene excepciones cargadas en alguna sede',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CalendarioResponseDto> {
    return this.calendarioService.remove(id);
  }
}
