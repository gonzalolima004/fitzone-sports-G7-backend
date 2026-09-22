import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: { id_usuario: number } }>();
    // Extraemos el id inyectado por el JwtAuthGuard
    return request.user?.id_usuario;
  },
);
