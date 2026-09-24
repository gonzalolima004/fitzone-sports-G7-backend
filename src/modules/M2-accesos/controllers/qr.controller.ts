import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUserId } from '../../../common/decorators/current-user.decorator';
import { QrService } from '../services/qr.service';
import { QrDinamicoResponseDto } from '../dto/qr-dinamico-response.dto';

@ApiTags('Control de Acceso')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('access/qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Get('generate')
  @ApiOperation({
    summary: 'Generar código QR dinámico temporal (60s)',
    description:
      'Genera un token QR dinámico basado en JWT y TOTP para usuarios autenticados. Actualiza automáticamente la propiedad qr_url del perfil del usuario.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token QR generado y qr_url actualizada exitosamente.',
    type: QrDinamicoResponseDto,
  })
  @ApiResponse({
    status: 401,
    description:
      'No autorizado. El token de autenticación está ausente, manipulado o expirado.',
  })
  @ApiResponse({
    status: 500,
    description:
      'Error interno del servidor durante la generación del token o guardado de perfil.',
  })
  async generarQr(
    @CurrentUserId() id_usuario: number,
  ): Promise<QrDinamicoResponseDto> {
    return await this.qrService.generarQrDinamico(id_usuario);
  }
}
