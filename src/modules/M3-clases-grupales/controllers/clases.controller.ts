import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClasesService } from '../services/clases.service';
import { CreateClaseDto } from '../dto/create-clase.dto';
import { UpdateClaseDto } from '../dto/update-clase.dto';
import { ClaseResponseDto } from '../dto/clase-response.dto';
import { ClaseAgendaResponseDto } from '../dto/clase-agenda-response.dto';
import { EliminarClaseResponseDto } from '../dto/eliminar-clase-response.dto';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Clases Grupales')
@Controller('clases')
export class ClasesController {
  constructor(private readonly clasesService: ClasesService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin', 'gerente')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear una nueva clase grupal (Solo admin y gerente)',
  })
  @ApiResponse({
    status: 201,
    description: 'La clase fue creada exitosamente.',
    type: ClaseResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol admin o gerente.',
  })
  async crearClase(
    @Body() createClaseDto: CreateClaseDto,
  ): Promise<ClaseResponseDto> {
    return await this.clasesService.crearClase(createClaseDto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Obtener catálogo de clases por sede o agenda con ocupación por fecha',
    description:
      'Si se especifica la fecha (YYYY-MM-DD), devuelve la agenda con ocupación real, cupos y estado.',
  })
  @ApiQuery({
    name: 'id_sede',
    required: true,
    type: Number,
    description: 'ID de la sede para filtrar las clases activas',
    example: 1,
  })
  @ApiQuery({
    name: 'fecha',
    required: false,
    type: String,
    description: 'Fecha en formato YYYY-MM-DD para calcular ocupación y agenda',
    example: '2026-10-12',
  })
  @ApiResponse({
    status: 200,
    description:
      'Lista de clases o agenda detallada con ocupación para la fecha especificada.',
    type: [ClaseAgendaResponseDto],
  })
  async obtenerClasesPorSede(
    @Query('id_sede', ParseIntPipe) id_sede: number,
    @Query('fecha') fecha?: string,
  ): Promise<ClaseResponseDto[] | ClaseAgendaResponseDto[]> {
    return await this.clasesService.obtenerClasesPorSede(id_sede, fecha);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una clase específica' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID único de la clase grupal',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle completo de la clase.',
    type: ClaseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Clase no encontrada.' })
  async obtenerClasePorId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ClaseResponseDto> {
    return await this.clasesService.obtenerClasePorId(id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin', 'gerente')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Actualizar parcialmente datos o cupos de una clase (Solo admin y gerente)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID único de la clase a actualizar',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'La clase fue actualizada exitosamente.',
    type: ClaseResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol admin o gerente.',
  })
  @ApiResponse({ status: 404, description: 'Clase no encontrada.' })
  async actualizarClase(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClaseDto: UpdateClaseDto,
  ): Promise<ClaseResponseDto> {
    return await this.clasesService.actualizarClase(id, updateClaseDto);
  }

  @Put(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin', 'gerente')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Reemplazar totalmente los datos de una clase (Solo admin y gerente)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID único de la clase a reemplazar',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'La clase fue reemplazada exitosamente.',
    type: ClaseResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol admin o gerente.',
  })
  @ApiResponse({ status: 404, description: 'Clase no encontrada.' })
  async reemplazarClase(
    @Param('id', ParseIntPipe) id: number,
    @Body() createClaseDto: CreateClaseDto,
  ): Promise<ClaseResponseDto> {
    return await this.clasesService.reemplazarClase(id, createClaseDto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin', 'gerente')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Baja lógica de una clase grupal y cancelación preventiva de reservas futuras (Solo admin y gerente)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID único de la clase a dar de baja',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description:
      'La clase fue dada de baja lógicamente y sus reservas futuras confirmadas fueron canceladas.',
    type: EliminarClaseResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol admin o gerente.',
  })
  @ApiResponse({ status: 404, description: 'Clase no encontrada.' })
  async eliminarClase(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EliminarClaseResponseDto> {
    return await this.clasesService.eliminarClase(id);
  }
}
