import {
  Controller,
  Delete,
  Get,
  Patch,
  ParseIntPipe,
  Param,
  Body,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SedeService } from '../services/sede.service';
import { CreateSedeDto } from '../dto/create-sede.dto';
import { UpdateSedeDto } from '../dto/update-sede.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { LimiteConsultasPublicasGuard } from '../../../common/guards/limite-consultas-publicas.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ROLES_CON_CUENTA } from '../constants/sedes.constants';

// Todos los endpoints tienen guards. El listado es el único sin sesión,
// porque la landing y el registro de usuarios lo consultan sin token: tiene
// límite de consultas por IP. El resto pide una cuenta de FitZone y el alta,
// la modificación y la baja, el rol gerente.
@ApiTags('Sedes')
@Controller('sedes')
export class SedeController {
  constructor(private readonly sedeService: SedeService) {}

  @ApiOperation({
    summary:
      'Obtener todas las sedes activas (público, con límite de consultas)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de sedes obtenida correctamente',
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiadas consultas seguidas desde la misma IP.',
  })
  @UseGuards(LimiteConsultasPublicasGuard)
  @Get()
  async findAll() {
    return this.sedeService.findAll();
  }

  @ApiOperation({ summary: 'Obtener una sede por su ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la sede',
  })
  @ApiResponse({
    status: 200,
    description: 'Sede obtenida correctamente',
  })
  @ApiResponse({
    status: 400,
    description: 'El ID proporcionado no es válido',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 404,
    description: 'Sede no encontrada',
  })
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(...ROLES_CON_CUENTA)
  @ApiBearerAuth()
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id_sede: number) {
    return this.sedeService.findById(id_sede);
  }

  @ApiOperation({ summary: 'Crear una nueva sede (Solo gerente)' })
  @ApiResponse({
    status: 201,
    description: 'Sede creada correctamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Los datos enviados no son válidos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol gerente.',
  })
  @ApiResponse({
    status: 404,
    description: 'La ciudad especificada no existe',
  })
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @Post()
  async create(@Body() data: CreateSedeDto) {
    return this.sedeService.create(data);
  }

  @ApiOperation({
    summary: 'Actualizar datos de la sede (Solo gerente)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la sede',
  })
  @ApiResponse({
    status: 200,
    description: 'Sede actualizada correctamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Los datos enviados no son válidos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol gerente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Sede o ciudad especificada no encontrada',
  })
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id_sede: number,
    @Body() data: UpdateSedeDto,
  ) {
    return this.sedeService.update(id_sede, data);
  }

  @ApiOperation({
    summary: 'Eliminar lógicamente una sede (Solo gerente)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la sede',
  })
  @ApiResponse({
    status: 200,
    description: 'Eliminacion logica realizada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'ID de la sede invalido',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol gerente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Sede no encontrada',
  })
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @Delete(':id')
  async logicalDelete(@Param('id', ParseIntPipe) id_sede: number) {
    return this.sedeService.logicalDelete(id_sede);
  }

  @ApiOperation({
    summary: 'Obtener horario operativo de una sede para una fecha',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la sede',
  })
  @ApiQuery({
    name: 'fecha',
    type: String,
    description: 'Fecha a consultar en formato YYYY-MM-DD',
    example: '2026-10-13',
  })
  @ApiResponse({
    status: 200,
    description:
      'Horario operativo obtenido correctamente. Si la sede no tiene horario cargado para ese día, figura cerrada.',
  })
  @ApiResponse({
    status: 400,
    description: 'La fecha no tiene formato YYYY-MM-DD o no existe',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 404,
    description: 'Sede no encontrada',
  })
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(...ROLES_CON_CUENTA)
  @ApiBearerAuth()
  @Get(':id/horario-operativo')
  async getHorarioOperativo(
    @Param('id', ParseIntPipe) id_sede: number,
    @Query('fecha') fecha: string,
  ) {
    return this.sedeService.getHorarioOperativo(id_sede, fecha);
  }
}
