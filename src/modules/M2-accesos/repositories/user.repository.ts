import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';

@Injectable()
export class UserRepository {

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Actualiza la columna qr_url del perfil/usuario en Postgres vía Prisma
   */
  async actualizarQrUrl(
    idUsuario: string | number,
    qrUrl: string,
  ): Promise<void> {
    try {
      await this.prisma.usuario.update({
        where: { id_usuario: Number(idUsuario) },
        data: { qr_url: qrUrl },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al actualizar qr_url en la base de datos: ${(error as Error).message}`,
      );
    }
  }
}
