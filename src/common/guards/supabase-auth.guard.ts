import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { UsuariosService } from '../../modules/M1-usuarios/services/usuarios.service';

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
    private readonly usuariosService: UsuariosService,
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

    // 1. Intentar validar como JWT local emitido por AuthService (FitZone)
    try {
      const payload = this.jwtService.verify<{
        sub: number | string;
        email?: string;
        rol?: string;
      }>(token);

      if (payload && payload.sub) {
        request.user = {
          id_usuario: Number(payload.sub),
          supabase_user_id: String(payload.sub),
          email: payload.email ?? '',
        };
        return true;
      }
    } catch {
      // Si no es un JWT emitido localmente, procedemos a validar con Supabase Auth
    }

    // 2. Fallback: Validar con Supabase Auth
    const { user, error } = await this.supabaseService.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Token invalido o expirado');
    }

    if (!user.email) {
      throw new UnauthorizedException(
        'El usuario autenticado no tiene email asociado',
      );
    }

    const usuarioFitZone = await this.usuariosService
      .findByEmail(user.email)
      .catch((error: unknown) => {
        if (error instanceof NotFoundException) {
          throw new ForbiddenException(
            'Usuario autenticado sin cuenta asociada a FitZone',
          );
        }

        throw error;
      });

    request.user = {
      id_usuario: usuarioFitZone.id_usuario,
      supabase_user_id: user.id,
      email: user.email,
    };

    return true;
  }
}
