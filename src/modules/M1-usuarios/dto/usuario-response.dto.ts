import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UsuarioResponseDto {
  @Expose()
  id_usuario: number;
  @Expose()
  dni: string;
  @Expose()
  email: string;
  @Expose()
  nombre: string;
  @Expose()
  apellido: string;
  @Expose()
  telefono?: string;
  @Expose()
  foto_url?: string;
  @Expose()
  roles?: number[];
  @Expose()
  creacion: Date;
  @Expose()
  modificado: Date;
  @Expose()
  qr_url: string;
  @Expose()
  id_sede: number;
  @Expose()
  id_usuario_estado: number;
}
