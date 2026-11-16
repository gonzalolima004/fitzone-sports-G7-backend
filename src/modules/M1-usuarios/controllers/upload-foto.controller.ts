import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FotoStorageService } from '../services/foto-storage.service';
import { UploadFotoResponseDto } from '../dto/upload-foto-response.dto';
import { UsuariosService } from '../services/usuarios.service';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

@ApiTags('Usuarios - Foto de Perfil')
@Controller('usuarios')
export class UploadFotoController {
  constructor(
    private readonly fotoStorageService: FotoStorageService,
    private readonly usuariosService: UsuariosService,
  ) {}

  @Post(':id/foto')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('foto', {
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Subir foto de perfil del usuario autenticado' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del usuario',
    example: 1,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        foto: {
          type: 'string',
          format: 'binary',
          description:
            'Archivo de imagen de la foto de perfil (JPG, PNG o WEBP, máx 2MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Foto de perfil actualizada correctamente.',
    type: UploadFotoResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado para modificar la foto de otro usuario.',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async uploadFoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ): Promise<UploadFotoResponseDto> {
    if (!req.user || req.user.id_usuario !== id) {
      throw new ForbiddenException(
        'No tienes permisos para modificar la fotografía de otro usuario.',
      );
    }

    if (!file) {
      throw new BadRequestException(
        'No se ha proporcionado ningún archivo de imagen.',
      );
    }

    const usuarioActual = await this.usuariosService.findById(id);
    const publicUrl = await this.fotoStorageService.uploadFoto(
      file,
      id,
      usuarioActual.foto_url,
    );

    await this.usuariosService.updateFotoUrl(id, publicUrl);

    return {
      foto_url: publicUrl,
      mensaje: 'Foto de perfil actualizada correctamente.',
    };
  }
}
