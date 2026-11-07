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
import { CalendarioSedeService } from '../services/calendario-sede.service';
import { CreateCalendarioSedeDto } from '../dto/create-calendario-sede.dto';
import { UpdateCalendarioSedeDto } from '../dto/update-calendario-sede.dto';
import { RangoFechasDto } from '../dto/rango-fechas.dto';
import { CalendarioSedeResponseDto } from '../dto/calendario-sede-response.dto';

/**
 * Excepciones de una sede al calendario general: feriados locales, cierres o
 * días con horario especial. Todo el CRUD es exclusivo del gerente.
 */
@ApiTags('Calendario')
@ApiBearerAuth()
@ApiParam({ name: 'idSede', type: Number, description: 'ID de la sede' })
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
@Controller('sedes/:idSede/calendario')
export class CalendarioSedeController {
  constructor(private readonly calendarioSedeService: CalendarioSedeService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar las excepciones de calendario de una sede (Solo gerente)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Excepciones en orden cronológico, con su fecha del calendario',
    type: [CalendarioSedeResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Rango de fechas inválido' })
  async findAll(
    @Param('idSede', ParseIntPipe) idSede: number,
    @Query() filtros: RangoFechasDto,
  ): Promise<CalendarioSedeResponseDto[]> {
    return this.calendarioSedeService.findAll(idSede, filtros);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una excepción de la sede (Solo gerente)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la excepción' })
  @ApiResponse({ status: 200, type: CalendarioSedeResponseDto })
  @ApiResponse({ status: 404, description: 'Excepción no encontrada' })
  async findById(
    @Param('idSede', ParseIntPipe) idSede: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CalendarioSedeResponseDto> {
    return this.calendarioSedeService.findById(idSede, id);
  }

  @Post()
  @ApiOperation({
    summary:
      'Cargar un cierre o un horario especial para una fecha (Solo gerente)',
  })
  @ApiResponse({ status: 201, type: CalendarioSedeResponseDto })
  @ApiResponse({ status: 400, description: 'Datos u horario inválidos' })
  @ApiResponse({ status: 404, description: 'La sede no existe' })
  @ApiResponse({
    status: 409,
    description: 'La sede ya tiene una excepción esa fecha',
  })
  async create(
    @Param('idSede', ParseIntPipe) idSede: number,
    @Body() dto: CreateCalendarioSedeDto,
  ): Promise<CalendarioSedeResponseDto> {
    return this.calendarioSedeService.create(idSede, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Modificar una excepción de la sede (Solo gerente)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la excepción' })
  @ApiResponse({ status: 200, type: CalendarioSedeResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Datos u horario inválidos, o sin cambios',
  })
  @ApiResponse({ status: 404, description: 'Excepción no encontrada' })
  @ApiResponse({
    status: 409,
    description: 'La sede ya tiene una excepción en la nueva fecha',
  })
  async update(
    @Param('idSede', ParseIntPipe) idSede: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCalendarioSedeDto,
  ): Promise<CalendarioSedeResponseDto> {
    return this.calendarioSedeService.update(idSede, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una excepción de la sede (Solo gerente)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la excepción' })
  @ApiResponse({ status: 200, type: CalendarioSedeResponseDto })
  @ApiResponse({ status: 404, description: 'Excepción no encontrada' })
  async remove(
    @Param('idSede', ParseIntPipe) idSede: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CalendarioSedeResponseDto> {
    return this.calendarioSedeService.remove(idSede, id);
  }
}
