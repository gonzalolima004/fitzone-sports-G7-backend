export interface AuthenticatedUser {
  id_usuario: number;
  supabase_user_id: string;
  email: string;
  rol?: string;
  roles?: string[];
  dni?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string | null;
  foto_url?: string | null;
  id_sede?: number;
  sede?: {
    id_sede: number;
    nombre: string;
    id_ciudad: number;
  };
}
