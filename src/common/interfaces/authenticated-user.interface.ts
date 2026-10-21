export interface AuthenticatedUser {
  id_usuario: number;
  supabase_user_id: string;
  email: string;
  rol?: string;
  roles?: string[];
}
