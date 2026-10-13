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
} from '@nestjs/swagger';

@ApiTags('Sedes')
@Controller('sedes')
export class SedeController {
  constructor(private readonly sedeService: SedeService) {}

  @ApiOperation({ summary: 'Obtener todas las sedes activas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de sedes obtenida correctamente',
  })
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
    status: 404,
    description: 'Sede no encontrada',
  })
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id_sede: number) {
    return this.sedeService.findById(id_sede);
  }

  @ApiOperation({ summary: 'Crear una nueva sede' })
  @ApiResponse({
    status: 201,
    description: 'Sede creada correctamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Los datos enviados no son válidos',
  })
  @ApiResponse({
    status: 404,
    description: 'La ciudad especificada no existe',
  })
  @Post()
  async create(@Body() data: CreateSedeDto) {
    return this.sedeService.create(data);
  }

  @ApiOperation({ summary: 'Actualizar datos de la sede' })
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
    status: 404,
    description: 'Sede o ciudad especificada no encontrada',
  })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id_sede: number,
    @Body() data: UpdateSedeDto,
  ) {
    return this.sedeService.update(id_sede, data);
  }

  @ApiOperation({
    summary: 'Eliminar lógicamente una sede',
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
    status: 404,
    description: 'Sede no encontrada',
  })
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
    description: 'Horario operativo obtenido correctamente',
  })
  @Get(':id/horario-operativo')
  async getHorarioOperativo(
    @Param('id', ParseIntPipe) id_sede: number,
    @Query('fecha') fecha: string,
  ) {
    return this.sedeService.getHorarioOperativo(id_sede, fecha);
  }
}
