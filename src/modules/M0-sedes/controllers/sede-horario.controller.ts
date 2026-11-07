import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import { SedeHorarioService } from '../services/sede-horario.service';
import { CreateSedeHorarioDto } from '../dto/create-sede-horario.dto';
import { UpdateSedeHorarioDto } from '../dto/update-sede-horario.dto';
import { SedeHorarioResponseDto } from '../dto/sede-horario-response.dto';

/**
 * Horario semanal de apertura y cierre de cada sede (un registro por día).
 * Todo el CRUD es exclusivo del gerente.
 */
@ApiTags('Horarios de sede')
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
@Controller('sedes/:idSede/horarios')
export class SedeHorarioController {
  constructor(private readonly sedeHorarioService: SedeHorarioService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar el horario semanal de una sede (Solo gerente)',
  })
  @ApiResponse({
    status: 200,
    description: 'Un registro por día cargado, de domingo a sábado',
    type: [SedeHorarioResponseDto],
  })
  async findAll(
    @Param('idSede', ParseIntPipe) idSede: number,
  ): Promise<SedeHorarioResponseDto[]> {
    return this.sedeHorarioService.findAll(idSede);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el horario de un día (Solo gerente)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del horario' })
  @ApiResponse({ status: 200, type: SedeHorarioResponseDto })
  @ApiResponse({ status: 404, description: 'Horario no encontrado' })
  async findById(
    @Param('idSede', ParseIntPipe) idSede: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SedeHorarioResponseDto> {
    return this.sedeHorarioService.findById(idSede, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Cargar el horario de un día de la semana (Solo gerente)',
  })
  @ApiResponse({ status: 201, type: SedeHorarioResponseDto })
  @ApiResponse({ status: 400, description: 'Datos u horario inválidos' })
  @ApiResponse({ status: 404, description: 'La sede no existe' })
  @ApiResponse({
    status: 409,
    description: 'La sede ya tiene un horario para ese día',
  })
  async create(
    @Param('idSede', ParseIntPipe) idSede: number,
    @Body() dto: CreateSedeHorarioDto,
  ): Promise<SedeHorarioResponseDto> {
    return this.sedeHorarioService.create(idSede, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modificar el horario de un día (Solo gerente)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del horario' })
  @ApiResponse({ status: 200, type: SedeHorarioResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Datos u horario inválidos, o sin cambios',
  })
  @ApiResponse({ status: 404, description: 'Horario no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'La sede ya tiene un horario para el nuevo día',
  })
  async update(
    @Param('idSede', ParseIntPipe) idSede: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSedeHorarioDto,
  ): Promise<SedeHorarioResponseDto> {
    return this.sedeHorarioService.update(idSede, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar el horario de un día (Solo gerente)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del horario' })
  @ApiResponse({ status: 200, type: SedeHorarioResponseDto })
  @ApiResponse({ status: 404, description: 'Horario no encontrado' })
  async remove(
    @Param('idSede', ParseIntPipe) idSede: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SedeHorarioResponseDto> {
    return this.sedeHorarioService.remove(idSede, id);
  }
}
