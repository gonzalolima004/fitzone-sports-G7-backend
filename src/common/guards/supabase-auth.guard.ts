import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { UsuariosRepository } from '../../modules/M1-usuarios/repositories/usuarios.repository';

type AuthenticatedRequest = {
  headers: {
    authorization?: string;
  };
  user?: AuthenticatedUser;
};

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usuariosRepository: UsuariosRepository,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException(
        'Token de autenticacion no proporcionado',
      );
    }

    const [tipo, token] = authorization.split(' ');

    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Formato de autenticacion invalido');
    }

    try {
      const payload = this.jwtService.verify<{
        sub: number | string;
        email?: string;
        rol?: string;
        roles?: string[];
      }>(token);

      if (payload && payload.sub) {
        const roles =
          payload.roles ?? (payload.rol ? [payload.rol] : ['externo']);
        request.user = {
          id_usuario: Number(payload.sub),
          supabase_user_id: String(payload.sub),
          email: payload.email ?? '',
          rol: payload.rol ?? roles[0] ?? 'externo',
          roles,
        };
        return true;
      }
    } catch {
      // No es JWT local; continuamos con Supabase Auth
    }

    const { user, error } = await this.supabaseService.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Token invalido o expirado');
    }

    if (!user.email) {
      throw new UnauthorizedException(
        'El usuario autenticado no tiene email asociado',
      );
    }

    const usuarioFitZone = await this.usuariosRepository.findAuthProfileByEmail(
      user.email,
    );

    if (!usuarioFitZone) {
      throw new ForbiddenException(
        'Usuario autenticado sin cuenta asociada a FitZone',
      );
    }

    const userRoles =
      usuarioFitZone.usuario_rol?.map((ur) => ur.rol?.nombre).filter(Boolean) ??
      [];

    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const googleAvatarUrl =
      typeof metadata.avatar_url === 'string' && metadata.avatar_url.trim()
        ? metadata.avatar_url.trim()
        : typeof metadata.picture === 'string' && metadata.picture.trim()
          ? metadata.picture.trim()
          : null;

    request.user = {
      id_usuario: usuarioFitZone.id_usuario,
      supabase_user_id: user.id,
      email: user.email,
      rol: userRoles[0] ?? 'externo',
      roles: userRoles.length > 0 ? userRoles : ['externo'],
      dni: usuarioFitZone.dni,
      nombre: usuarioFitZone.nombre,
      apellido: usuarioFitZone.apellido,
      telefono: usuarioFitZone.telefono,
      foto_url: usuarioFitZone.foto_url ?? googleAvatarUrl,
      id_sede: usuarioFitZone.id_sede,
      sede: usuarioFitZone.sede,
    };

    return true;
  }
}
