import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { id_usuario: number } }>();
    // MOCK: Simulamos que el usuario logueado es el ID 1 hasta que se implemente Auth real
    request.user = { id_usuario: 1 };
    return true;
  }
}
