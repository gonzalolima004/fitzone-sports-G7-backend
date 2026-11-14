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
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];
  private readonly maxFileSizeBytes = 2 * 1024 * 1024; // 2 MB

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new InternalServerErrorException(
        'Las variables de entorno SUPABASE_URL o SUPABASE_KEY/SUPABASE_ANON_KEY no están configuradas.',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  private extractOwnedStoragePath(
    fotoUrl: string | null | undefined,
    idUsuario: number,
  ): string | null {
    if (!fotoUrl) return null;
    const marker = `/storage/v1/object/public/${this.bucketName}/`;
    const idx = fotoUrl.indexOf(marker);
    if (idx === -1) return null;

    const relativePath = decodeURIComponent(
      fotoUrl.slice(idx + marker.length).split('?')[0],
    );

    if (
      relativePath.startsWith(`avatars/usuario-${idUsuario}-`) ||
      relativePath.startsWith(`avatars/usuario-${idUsuario}.`)
    ) {
      return relativePath;
    }

    return null;
  }

  async uploadFoto(
    file: Express.Multer.File,
    idUsuario: number,
    fotoAnteriorUrl?: string | null,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException(
        'No se ha proporcionado ningún archivo de imagen.',
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Formato no permitido. Solo se aceptan imágenes JPG, PNG o WEBP.',
      );
    }

    if (file.size > this.maxFileSizeBytes) {
      throw new BadRequestException(
        'La imagen supera el tamaño máximo permitido de 2 MB.',
      );
    }

    const extensionPorMime: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const fileExtension = extensionPorMime[file.mimetype] || 'jpg';
    const filePath = `avatars/usuario-${idUsuario}-${Date.now()}.${fileExtension}`;

    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false,
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

      const oldPath = this.extractOwnedStoragePath(fotoAnteriorUrl, idUsuario);
      if (oldPath && oldPath !== filePath) {
        await this.supabase.storage.from(this.bucketName).remove([oldPath]);
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
