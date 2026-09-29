import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Body,
  Post,
  Patch,
  Delete,
} from '@nestjs/common';
import { CiudadService } from '../services/ciudad.service';
import { CreateCiudadDto } from '../dto/create-ciudad.dto';
import { UpdateCiudadDto } from '../dto/update-ciudad.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Ciudades')
@Controller('ciudades')
export class CiudadController {
  constructor(private readonly ciudadService: CiudadService) {}

  @ApiOperation({ summary: 'Obtener todas las ciudades activas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de ciudades obtenida correctamente',
  })
  @Get()
  async findAll() {
    return this.ciudadService.findAll();
  }

  @ApiOperation({ summary: 'Obtener una ciudad por su ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la ciudad',
  })
  @ApiResponse({
    status: 200,
    description: 'Ciudad obtenida correctamente',
  })
  @ApiResponse({
    status: 400,
    description: 'El ID proporcionado no es válido',
  })
  @ApiResponse({
    status: 404,
    description: 'Ciudad no encontrada',
  })
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id_ciudad: number) {
    return this.ciudadService.findById(id_ciudad);
  }

  @ApiOperation({ summary: 'Crear una nueva ciudad' })
  @ApiResponse({
    status: 201,
    description: 'Ciudad creada correctamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Los datos enviados no son válidos',
  })
  @Post()
  async create(@Body() data: CreateCiudadDto) {
    return this.ciudadService.create(data);
  }

  @ApiOperation({ summary: 'Actualizar datos de la ciudad' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la ciudad',
  })
  @ApiResponse({
    status: 200,
    description: 'Ciudad actualizada correctamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Los datos enviados no son válidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Ciudad no encontrada',
  })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id_ciudad: number,
    @Body() data: UpdateCiudadDto,
  ) {
    return this.ciudadService.update(id_ciudad, data);
  }

  @ApiOperation({ summary: 'Eliminar lógicamente una ciudad' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la ciudad',
  })
  @ApiResponse({
    status: 200,
    description: 'Eliminacion logica realizada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'ID de la ciudad invalido',
  })
  @ApiResponse({
    status: 404,
    description: 'Ciudad no encontrada',
  })
  @Delete(':id')
  async logicalDelete(@Param('id', ParseIntPipe) id_ciudad: number) {
    return this.ciudadService.logicalDelete(id_ciudad);
  }
}
