import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Body,
  Post,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CiudadService } from '../services/ciudad.service';
import { CreateCiudadDto } from '../dto/create-ciudad.dto';
import { UpdateCiudadDto } from '../dto/update-ciudad.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

// Los GET siguen siendo públicos (landing y formularios de sedes).
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

  @ApiOperation({ summary: 'Crear una nueva ciudad (Solo gerente)' })
  @ApiResponse({
    status: 201,
    description: 'Ciudad creada correctamente',
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
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @Post()
  async create(@Body() data: CreateCiudadDto) {
    return this.ciudadService.create(data);
  }

  @ApiOperation({
    summary: 'Actualizar datos de la ciudad (Solo gerente)',
  })
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
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol gerente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Ciudad no encontrada',
  })
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id_ciudad: number,
    @Body() data: UpdateCiudadDto,
  ) {
    return this.ciudadService.update(id_ciudad, data);
  }

  @ApiOperation({
    summary: 'Eliminar lógicamente una ciudad (Solo gerente)',
  })
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
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol gerente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Ciudad no encontrada',
  })
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @Delete(':id')
  async logicalDelete(@Param('id', ParseIntPipe) id_ciudad: number) {
    return this.ciudadService.logicalDelete(id_ciudad);
  }
}
