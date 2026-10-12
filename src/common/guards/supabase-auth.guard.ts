import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
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

    let userEmail: string | null = null;
    let supabaseUserId: string | null = null;

    // 1. Intentar validar como JWT local emitido por AuthService (/auth/login)
    try {
      const jwtSecret = process.env.JWT_SECRET || 'secreto_desarrollo_fitzone';
      const decoded = jwt.verify(token, jwtSecret) as {
        sub?: number | string;
        email?: string;
        rol?: string;
      };

      if (decoded && decoded.email) {
        userEmail = decoded.email;
        supabaseUserId = decoded.sub ? String(decoded.sub) : null;
      }
    } catch {
      // Si no es un JWT local, continúa para validar con Supabase
    }

    // 2. Si no fue un JWT local válido, validar con Supabase Auth
    if (!userEmail) {
      const { user, error } = await this.supabaseService.getUser(token);

      if (!error && user && user.email) {
        userEmail = user.email;
        supabaseUserId = user.id;
      }
    }

    // 3. Si ninguno de los proveedores validó el token, denegar acceso
    if (!userEmail) {
      throw new UnauthorizedException('Token invalido o expirado');
    }

    const usuarioFitZone = await this.usuariosService
      .findByEmail(userEmail)
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
      supabase_user_id: supabaseUserId || String(usuarioFitZone.id_usuario),
      email: usuarioFitZone.email,
    };

    return true;
  }
}
