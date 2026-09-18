import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ClasesService } from '../services/clases.service';
import { CreateClaseDto } from '../dto/create-clase.dto';
import { UpdateClaseDto } from '../dto/update-clase.dto';
import { ClaseResponseDto } from '../dto/clase-response.dto';

@ApiTags('Clases Grupales')
@Controller('clases')
export class ClasesController {
  constructor(private readonly clasesService: ClasesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva clase grupal' })
  @ApiResponse({
    status: 201,
    description: 'La clase fue creada exitosamente.',
    type: ClaseResponseDto,
  })
  async crearClase(@Body() createClaseDto: CreateClaseDto) {
    return await this.clasesService.crearClase(createClaseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener el catálogo de clases por sede' })
  @ApiQuery({
    name: 'id_sede',
    required: true,
    type: Number,
    description: 'ID de la sede para filtrar las clases activas',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de clases activas para la sede especificada.',
    type: [ClaseResponseDto],
  })
  async obtenerClasesPorSede(@Query('id_sede', ParseIntPipe) id_sede: number) {
    return await this.clasesService.obtenerClasesPorSede(id_sede);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una clase específica' })
  @ApiResponse({
    status: 200,
    description: 'Detalle completo de la clase.',
    type: ClaseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Clase no encontrada.' })
  async obtenerClasePorId(@Param('id', ParseIntPipe) id: number) {
    return await this.clasesService.obtenerClasePorId(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos o cupos de una clase' })
  @ApiResponse({
    status: 200,
    description: 'La clase fue actualizada exitosamente.',
    type: ClaseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Clase no encontrada.' })
  async actualizarClase(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClaseDto: UpdateClaseDto,
  ) {
    return await this.clasesService.actualizarClase(id, updateClaseDto);
  }
}
