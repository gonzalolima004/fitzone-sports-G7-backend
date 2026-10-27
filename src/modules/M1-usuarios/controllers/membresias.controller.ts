//Controller de membresias
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
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
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MembresiasService } from '../services/membresias.service';
import { CreateMembresiaDto } from '../dto/crear-membresia.dto';
import { ActualizarMembresiaEstadoDto } from '../dto/actualizar-membresia-estado.dto';
import { ActualizarMembresiaDto } from '../dto/actualizar-membresia.dto';
import {
  MembresiaEstadoDto,
  MembresiaResponseDto,
} from '../dto/membresia-response.dto';
import { VerificarMembresiaResponseDto } from '../dto/verificar-membresia-response.dto';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

// La administración de las membresías de los socios (alta, listado general,
// detalle, modificación, cambio de estado y baja) queda para el gerente.
// Las consultas por usuario y el catálogo de estados siguen públicos.
@ApiTags('Membresías')
@Controller('membresias')
@UseInterceptors(ClassSerializerInterceptor)
export class MembresiasController {
  constructor(private readonly membresiasService: MembresiasService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva membresía (Solo gerente)' })
  @ApiResponse({ status: 201, description: 'Membresía creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol gerente.',
  })
  @ApiResponse({ status: 404, description: 'Usuario o plan no encontrados.' })
  create(
    @Body() createMembresiaDto: CreateMembresiaDto,
  ): Promise<MembresiaResponseDto> {
    return this.membresiasService.create(createMembresiaDto);
  }

  @Get('usuario/:id_usuario')
  @ApiOperation({
    summary: 'Obtener historial completo de membresías de un usuario',
  })
  @ApiParam({
    name: 'id_usuario',
    type: Number,
    description: 'ID del usuario',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de membresías obtenido correctamente.',
    type: [MembresiaResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async findByUsuarioId(
    @Param('id_usuario', ParseIntPipe) id_usuario: number,
  ): Promise<MembresiaResponseDto[]> {
    return this.membresiasService.findByUsuarioId(id_usuario);
  }

  @Get('usuario/:id_usuario/activa')
  @ApiOperation({
    summary: 'Obtener la membresía activa vigente de un usuario',
  })
  @ApiParam({
    name: 'id_usuario',
    type: Number,
    description: 'ID del usuario',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description:
      'Membresía activa obtenida correctamente (o null si no posee).',
    type: MembresiaResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async findActiveByUsuarioId(
    @Param('id_usuario', ParseIntPipe) id_usuario: number,
  ): Promise<MembresiaResponseDto | null> {
    return this.membresiasService.findActiveByUsuarioId(id_usuario);
  }

  @Get('usuario/:id_usuario/verificar')
  @ApiOperation({
    summary: 'Verificar estado de membresía multi-sede y regla de mora',
  })
  @ApiParam({
    name: 'id_usuario',
    type: Number,
    description: 'ID del usuario a verificar',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de membresía verificado correctamente.',
    type: VerificarMembresiaResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async verificarEstadoMembresia(
    @Param('id_usuario', ParseIntPipe) id_usuario: number,
  ): Promise<VerificarMembresiaResponseDto> {
    return this.membresiasService.verificarMembresia(id_usuario);
  }

  // Va antes de GET :id para que "estados" no se tome como un ID.
  @Get('estados')
  @ApiOperation({
    summary: 'Obtener el catálogo de estados de membresía',
  })
  @ApiResponse({
    status: 200,
    description: 'Estados de membresía obtenidos correctamente.',
    type: [MembresiaEstadoDto],
  })
  async findAllEstados(): Promise<MembresiaEstadoDto[]> {
    return this.membresiasService.findAllEstados();
  }

  @Get(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener detalle de una membresía por ID (Solo gerente)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la membresía',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Membresía obtenida correctamente.',
    type: MembresiaResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol gerente.',
  })
  @ApiResponse({ status: 404, description: 'Membresía no encontrada.' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MembresiaResponseDto> {
    return this.membresiasService.findById(id);
  }

  @Get()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Obtener listado general de membresías con filtros opcionales (Solo gerente)',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol gerente.',
  })
  @ApiQuery({
    name: 'id_usuario',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'id_membresia_estado',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'id_membresia_plan',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de membresías obtenido correctamente.',
    type: [MembresiaResponseDto],
  })
  async findAll(
    @Query('id_usuario') id_usuario?: number,
    @Query('id_membresia_estado') id_membresia_estado?: number,
    @Query('id_membresia_plan') id_membresia_plan?: number,
  ): Promise<MembresiaResponseDto[]> {
    return this.membresiasService.findAll({
      id_usuario: id_usuario ? Number(id_usuario) : undefined,
      id_membresia_estado: id_membresia_estado
        ? Number(id_membresia_estado)
        : undefined,
      id_membresia_plan: id_membresia_plan
        ? Number(id_membresia_plan)
        : undefined,
    });
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Modificar la fecha de vencimiento o la renovación automática (Solo gerente)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la membresía',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Membresía actualizada correctamente.',
    type: MembresiaResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol gerente.',
  })
  @ApiResponse({ status: 404, description: 'Membresía no encontrada.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarMembresiaDto,
  ): Promise<MembresiaResponseDto> {
    return this.membresiasService.update(id, dto);
  }

  @Patch(':id/estado')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Cambiar el estado de una membresía (Activa, Vencida, Suspendida) (Solo gerente)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la membresía',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de la membresía actualizado correctamente.',
    type: MembresiaResponseDto,
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
    description: 'Membresía o Estado no encontrado.',
  })
  async updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarMembresiaEstadoDto,
  ): Promise<MembresiaResponseDto> {
    return this.membresiasService.updateEstado(id, dto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Eliminar una membresía sin pagos registrados (Solo gerente)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la membresía',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Membresía eliminada correctamente.',
    type: MembresiaResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol gerente.',
  })
  @ApiResponse({ status: 404, description: 'Membresía no encontrada.' })
  @ApiResponse({
    status: 409,
    description:
      'La membresía tiene pagos registrados: se suspende en lugar de eliminarse.',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MembresiaResponseDto> {
    return this.membresiasService.remove(id);
  }
}
