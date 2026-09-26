//Controller de membresias
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MembresiasService } from '../services/membresias.service';
import { CreateMembresiaDto } from '../dto/crear-membresia.dto';
import { ActualizarMembresiaEstadoDto } from '../dto/actualizar-membresia-estado.dto';
import { MembresiaResponseDto } from '../dto/membresia-response.dto';

@ApiTags('Membresías')
@Controller('membresias')
@UseInterceptors(ClassSerializerInterceptor)
export class MembresiasController {
  constructor(private readonly membresiasService: MembresiasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva membresía' })
  @ApiResponse({ status: 201, description: 'Membresía creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
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

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una membresía por ID' })
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
  @ApiResponse({ status: 404, description: 'Membresía no encontrada.' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MembresiaResponseDto> {
    return this.membresiasService.findById(id);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener listado general de membresías con filtros opcionales',
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

  @Patch(':id/estado')
  @ApiOperation({
    summary: 'Cambiar el estado de una membresía (Activa, Vencida, Suspendida)',
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
    status: 404,
    description: 'Membresía o Estado no encontrado.',
  })
  async updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarMembresiaEstadoDto,
  ): Promise<MembresiaResponseDto> {
    return this.membresiasService.updateEstado(id, dto);
  }
}
