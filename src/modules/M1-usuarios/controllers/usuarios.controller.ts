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
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { UsuariosService } from '../services/usuarios.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUsuarioDto } from '../dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from '../dto/actualizar-usuario.dto';
import { Usuario } from '@prisma/client';
import { UsuarioResponseDto } from '../dto/usuario-response.dto';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { RolesGuard } from '../../../common/guards/roles.guard';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

@ApiTags('Usuarios')
@Controller('usuarios')
@UseInterceptors(ClassSerializerInterceptor)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  async create(
    @Body() createUsuarioDto: CreateUsuarioDto,
  ): Promise<UsuarioResponseDto> {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
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
    type: [UsuarioResponseDto],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'includeDeactivated', required: false, type: Boolean })
  @ApiQuery({ name: 'id_usuario_estado', required: false, type: Number })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('includeDeactivated') includeDeactivated?: string,
    @Query('id_sede', new ParseIntPipe({ optional: true })) id_sede?: number,
    @Query('id_usuario_estado', new ParseIntPipe({ optional: true }))
    id_usuario_estado?: number,
  ): Promise<{
    data: UsuarioResponseDto[];
    meta: { total: number; page: number; lastPage: number };
  }> {
    const showDeactivated = includeDeactivated === 'true';
    return this.usuariosService.findAll(
      id_sede,
      page,
      limit,
      showDeactivated,
      id_usuario_estado,
    );
  }

  @Get(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiResponse({
    status: 200,
    description: 'Usuario obtenido correctamente.',
    type: UsuarioResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UsuarioResponseDto | null> {
    return this.usuariosService.findById(id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar datos permitidos del perfil de usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Intento de modificar campos protegidos (DNI, email o roles).',
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado para modificar otro usuario.',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: ActualizarUsuarioDto,
    @Req() req: RequestWithUser,
  ): Promise<UsuarioResponseDto> {
    const usuarioAutenticado = req.user;
    const esGerente = Boolean(usuarioAutenticado?.roles?.includes('gerente'));

    if (
      !usuarioAutenticado ||
      (usuarioAutenticado.id_usuario !== id && !esGerente)
    ) {
      throw new ForbiddenException(
        'No tienes permisos para modificar el perfil de otro usuario.',
      );
    }

    const rawBody = (req.body ?? {}) as Record<string, unknown>;
    const camposProhibidos = [
      'dni',
      'email',
      'roles',
      'contrasenia',
      'password',
    ];
    const intentoProhibido = camposProhibidos.find((campo) =>
      Object.prototype.hasOwnProperty.call(rawBody, campo),
    );

    if (intentoProhibido) {
      throw new BadRequestException(
        `El campo '${intentoProhibido}' no puede ser modificado mediante este endpoint.`,
      );
    }

    if (updateUsuarioDto.id_usuario_estado !== undefined && !esGerente) {
      throw new ForbiddenException(
        'Solo un gerente puede modificar el estado de un usuario.',
      );
    }

    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar usuario (Soft Delete)' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Usuario> {
    return this.usuariosService.remove(id);
  }
}
