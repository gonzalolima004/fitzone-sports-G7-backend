import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: unknown): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('debe permitir el acceso si no hay roles requeridos en la ruta', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe lanzar ForbiddenException si no hay usuario autenticado en request.user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('debe permitir acceso si el usuario tiene rol coincidente (directo en user.rol)', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['admin', 'gerente']);

    const context = createMockContext({
      id_usuario: 1,
      rol: 'gerente',
      roles: ['gerente'],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe permitir acceso case-insensitive (ej. Gerente vs gerente)', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['admin', 'gerente']);

    const context = createMockContext({
      id_usuario: 1,
      rol: 'GERENTE',
      roles: ['GERENTE'],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe lanzar ForbiddenException si el usuario tiene otro rol (ej. socio)', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['admin', 'gerente']);

    const context = createMockContext({
      id_usuario: 2,
      rol: 'socio',
      roles: ['socio'],
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
