import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { UsuariosService } from '../services/usuarios.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUsuarioDto } from '../dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from '../dto/actualizar-usuario.dto';
import { Usuario } from '@prisma/client';

@ApiTags('Usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  async create(@Body() createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener lista de usuarios (con filtro opcional por sede)',
  })
  @ApiQuery({
    name: 'id_sede',
    required: false,
    type: Number,
    description: 'ID opcional de la sede para filtrar la lista',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida correctamente.',
  })
  async findAll(
    @Query('id_sede', new ParseIntPipe({ optional: true })) id_sede?: number,
  ): Promise<Usuario[]> {
    return this.usuariosService.findAll(id_sede);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiResponse({ status: 200, description: 'Usuario obtenido correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Usuario | null> {
    return this.usuariosService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado correctamente.',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: ActualizarUsuarioDto,
  ): Promise<Usuario> {
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar usuario (Soft Delete)' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Usuario> {
    return this.usuariosService.remove(id);
  }
}
