import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si la ruta o controlador no define roles requeridos, se permite el acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(
        'Usuario no autenticado para verificar permisos de rol.',
      );
    }

    const userRoles: string[] = [];

    if (user.roles && Array.isArray(user.roles)) {
      userRoles.push(...user.roles.map((r) => r.toLowerCase()));
    }

    if (user.rol && !userRoles.includes(user.rol.toLowerCase())) {
      userRoles.push(user.rol.toLowerCase());
    }

    const hasRole = requiredRoles.some((requiredRole) =>
      userRoles.includes(requiredRole.toLowerCase()),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Acceso denegado: se requiere uno de los siguientes roles: [${requiredRoles.join(', ')}].`,
      );
    }

    return true;
  }
}
