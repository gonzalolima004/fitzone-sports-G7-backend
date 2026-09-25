import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class FotoStorageService {
  private supabase: ReturnType<typeof createClient>;
  private readonly bucketName = 'fitzonepublic';

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new InternalServerErrorException(
        'Las variables de entorno SUPABASE_URL o SUPABASE_KEY no están configuradas.',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadFoto(
    file: Express.Multer.File,
    idUsuario: number,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException(
        'No se ha proporcionado ningún archivo de imagen.',
      );
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        'El archivo subido debe ser una imagen (JPG, PNG, WEBP, etc.).',
      );
    }

    //Genera nombre único del archivo para evitar coliciones
    const fileExtension = (
      file.originalname.split('.').pop() || 'jpg'
    ).toLowerCase();
    const filePath = `avatars/usuario-${idUsuario}.${fileExtension}`;

    //Sube la foto a Supabase Storage
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        throw new InternalServerErrorException(
          `Error al subir la foto: ${error.message}`,
        );
      }

      const { data } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new InternalServerErrorException(
          'No se pudo generar la URL pública de la foto de perfil.',
        );
      }

      return data.publicUrl;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error no controlado al subir la foto:', error);
      throw new InternalServerErrorException(
        'Error inesperado al subir la foto',
      );
    }
  }
}
