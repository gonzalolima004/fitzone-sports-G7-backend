import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UploadFotoResponseDto {
  @Expose()
  @ApiProperty({
    example:
      'https://xyz.supabase.co/storage/v1/object/public/fitzonepublic/avatars/usuario-1-1726700000.jpg',
    description:
      'URL pública de la foto de perfil almacenada en Supabase Storage',
  })
  foto_url: string;

  @Expose()
  @ApiProperty({
    example: 'Foto de perfil subida correctamente',
    description: 'Mensaje de respuesta',
  })
  mensaje: string;
}
