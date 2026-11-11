import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  ParseBoolPipe,
  UseGuards,
  Optional,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CotizarTurnoQueryDto,
  CotizacionResponseDto,
} from '../dto/cotizacion-turno.dto';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { CanchasService } from '../services/canchas.service';
import { CanchasDisponibilidadService } from '../services/canchas-disponibilidad.service';
import { CrearCanchaDto } from '../dto/crear-cancha.dto';
import { ActualizarCanchaDto } from '../dto/actualizar-cancha.dto';
import { DisponibilidadSlotResponseDto } from '../dto/disponibilidad-slot-response.dto';
import { ConsultaDisponibilidadQueryDto } from '../dto/consulta-disponibilidad-query.dto';
import { CrearTipoCanchaDto } from '../dto/crear-tipo-cancha.dto';
import { ActualizarTipoCanchaDto } from '../dto/actualizar-tipo-cancha.dto';

@ApiTags('Canchas Deportivas')
@Controller('canchas')
export class CanchasController {
  constructor(
    private readonly canchasService: CanchasService,
    @Optional()
    private readonly disponibilidadService?: CanchasDisponibilidadService,
  ) {}

  @Post()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dar de alta una nueva cancha (Solo gerente)' })
  @ApiResponse({ status: 201, description: 'Cancha creada exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado / Token inválido.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido / Requiere rol gerente.',
  })
  crear(@Body() crearCanchaDto: CrearCanchaDto) {
    return this.canchasService.crearCancha(crearCanchaDto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar todas las canchas activas con sus relaciones con filtro opcional de sede',
  })
  @ApiQuery({
    name: 'sedeId',
    required: false,
    type: Number,
    description: 'Filtrar canchas por ID de sede',
  })
  listar(@Query('sedeId') sedeId?: string) {
    return this.canchasService.listarCanchas(
      sedeId ? Number(sedeId) : undefined,
    );
  }

  @Get('tipos')
  @ApiOperation({ summary: 'Listar todos los tipos de deportes disponibles' })
  @ApiQuery({
    name: 'inactivos',
    required: false,
    type: Boolean,
    description: 'Indica si se deben incluir los tipos de cancha inactivos',
  })
  @ApiResponse({
    status: 200,
    description: 'Tipos de cancha obtenidos correctamente.',
  })
  listarTipos(
    @Query('inactivos', new ParseBoolPipe({ optional: true }))
    inactivos?: boolean,
  ) {
    return this.canchasService.listarTiposCancha(inactivos);
  }

  @Post('tipos')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo tipo de cancha (Solo gerente)' })
  @ApiResponse({
    status: 201,
    description: 'Tipo de cancha creado exitosamente.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado / Token inválido.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido / Requiere rol gerente.',
  })
  crearTipo(@Body() dto: CrearTipoCanchaDto) {
    return this.canchasService.crearTipoCancha(dto.descripcion);
  }

  @Patch('tipos/:id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar un tipo de cancha existente (Solo gerente)',
  })
  @ApiResponse({
    status: 200,
    description: 'Tipo de cancha actualizado correctamente.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado / Token inválido.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido / Requiere rol gerente.',
  })
  actualizarTipo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarTipoCanchaDto,
  ) {
    return this.canchasService.actualizarTipoCancha(id, dto);
  }

  @Delete('tipos/:id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Realizar un borrado lógico del tipo de cancha verificando que no posea canchas activas (Solo gerente)',
  })
  @ApiResponse({
    status: 200,
    description: 'Tipo de cancha dado de baja correctamente.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado / Token inválido.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido / Requiere rol gerente.',
  })
  eliminarTipo(@Param('id', ParseIntPipe) id: number) {
    return this.canchasService.eliminarTipoCancha(id);
  }

  @Get('disponibilidad')
  @ApiOperation({
    summary: 'Consultar grilla horaria de todas las canchas de una sede',
  })
  obtenerDisponibilidadPorSede(
    @Query('sedeId', ParseIntPipe) sedeId: number,
    @Query('fecha') fecha: string,
    @Query('tipoId', new ParseIntPipe({ optional: true })) tipoId?: number,
  ) {
    const service = this.disponibilidadService ?? this.canchasService;
    return service.obtenerDisponibilidadPorSede(sedeId, fecha, tipoId);
  }

  @Get('cotizar')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Cotizar el costo de un turno de cancha validando horario pico y descuento de socio en misma ciudad',
  })
  @ApiResponse({
    status: 200,
    type: CotizacionResponseDto,
    description: 'Cotización calculada exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Parámetros inválidos o formato incorrecto de fecha/hora (RFC 9457).',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado / Token de autenticación ausente o inválido.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Cancha inactiva/inexistente o usuario no encontrado (RFC 9457).',
  })
  cotizar(
    @Query() query: CotizarTurnoQueryDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ): Promise<CotizacionResponseDto> {
    return this.canchasService.cotizarTurno(query, usuario.id_usuario);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de una cancha específica' })
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.canchasService.obtenerCancha(id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar datos parciales de una cancha (Solo gerente)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cancha actualizada correctamente.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado / Token inválido.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido / Requiere rol gerente.',
  })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() actualizarCanchaDto: ActualizarCanchaDto,
  ) {
    return this.canchasService.actualizarCancha(id, actualizarCanchaDto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Realizar un borrado lógico de la cancha (Solo gerente)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cancha dada de baja correctamente.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado / Token inválido.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido / Requiere rol gerente.',
  })
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.canchasService.eliminarCancha(id);
  }

  @Get(':id/disponibilidad')
  @ApiOperation({ summary: 'Consultar grilla horaria de disponibilidad' })
  @ApiResponse({ status: 200, type: [DisponibilidadSlotResponseDto] })
  obtenerDisponibilidad(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ConsultaDisponibilidadQueryDto,
  ) {
    const service = this.disponibilidadService ?? this.canchasService;
    return service.obtenerDisponibilidad(id, query.fecha);
  }
}
