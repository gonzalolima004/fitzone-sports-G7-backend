import { Exclude, Expose, Transform } from 'class-transformer';

// Interfaz auxiliar opcional para tipar el objeto que viene de la consulta
interface UsuarioPrismaObj {
  usuario_rol?: Array<{ rol: { id_rol: number; nombre: string } }>;
  roles?: Array<{ id_rol: number; nombre: string }>;
}

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

  // Transforma la relación de Prisma tipando correctamente el parámetro
  @Expose()
  @Transform(({ obj }: { obj: UsuarioPrismaObj }) => {
    if (obj.usuario_rol && Array.isArray(obj.usuario_rol)) {
      return obj.usuario_rol.map((ur) => ur.rol);
    }
    return obj.roles || [];
  })
  roles?: Array<{ id_rol: number; nombre: string }>;

  @Expose()
  sede?: {
    id_sede: number;
    nombre: string;
    direccion: string;
    aforo_maximo: number;
    activo: boolean;
    id_ciudad: number;
  };

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
