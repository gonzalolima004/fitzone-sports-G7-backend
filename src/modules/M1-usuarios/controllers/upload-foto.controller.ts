import {
  BadRequestException,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
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

@ApiTags('Usuarios - Foto de Perfil')
@Controller('usuarios')
export class UploadFotoController {
  constructor(
    private readonly fotoStorageService: FotoStorageService,
    private readonly usuariosService: UsuariosService,
  ) {}

  @Post(':id/foto')
  @UseInterceptors(FileInterceptor('foto'))
  @ApiOperation({ summary: 'Subir foto de perfil' })
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
          description: 'Archivo de imagen de la foto de perfil',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Foto de perfil actualizada correctamente.',
    type: UploadFotoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async uploadFoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadFotoResponseDto> {
    if (!file) {
      throw new BadRequestException(
        'No se ha proporcionado ningún archivo de imagen.',
      );
    }
    const publicUrl = await this.fotoStorageService.uploadFoto(file, id);

    await this.usuariosService.update(id, { foto_url: publicUrl });

    return {
      foto_url: publicUrl,
      mensaje: 'Foto de perfil actualizada correctamente.',
    };
  }
}
