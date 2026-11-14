import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
import { UsuariosRepository } from '../../modules/M1-usuarios/repositories/usuarios.repository';

describe('SupabaseAuthGuard', () => {
  let guard: SupabaseAuthGuard;
  let mockSupabaseService: Partial<SupabaseService>;
  let mockUsuariosRepository: Partial<UsuariosRepository>;
  let mockJwtService: Partial<JwtService>;

  beforeEach(() => {
    mockSupabaseService = {
      getUser: jest.fn(),
    };
    mockUsuariosRepository = {
      findAuthProfileByEmail: jest.fn(),
    };
    mockJwtService = {
      verify: jest.fn(),
    };

    guard = new SupabaseAuthGuard(
      mockSupabaseService as SupabaseService,
      mockUsuariosRepository as UsuariosRepository,
      mockJwtService as JwtService,
    );
  });

  const createMockContext = (
    authorizationHeader?: string,
  ): {
    context: ExecutionContext;
    request: { headers: { authorization?: string }; user?: unknown };
  } => {
    const request = {
      headers: {
        authorization: authorizationHeader,
      },
      user: undefined,
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    return { context, request };
  };

  it('debe lanzar UnauthorizedException si no se incluye encabezado de autorizacion', async () => {
    const { context } = createMockContext(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debe lanzar UnauthorizedException si el formato no es Bearer', async () => {
    const { context } = createMockContext('Basic 123456');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debe autenticar exitosamente cuando el token es un JWT local emitido por FitZone', async () => {
    const { context, request } = createMockContext('Bearer token_local_valido');
    (mockJwtService.verify as jest.Mock).mockReturnValue({
      sub: 15,
      email: 'gerente@fitzone.com',
      rol: 'gerente',
      roles: ['gerente'],
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({
      id_usuario: 15,
      supabase_user_id: '15',
      email: 'gerente@fitzone.com',
      rol: 'gerente',
      roles: ['gerente'],
    });
    expect(mockSupabaseService.getUser).not.toHaveBeenCalled();
  });

  it('debe recurrir a Supabase si el token no es un JWT local y resolver el usuario FitZone con sus roles', async () => {
    const { context, request } = createMockContext('Bearer token_supabase');
    (mockJwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    (mockSupabaseService.getUser as jest.Mock).mockResolvedValue({
      user: {
        id: 'supabase-uuid-123',
        email: 'socio@fitzone.com',
      },
      error: null,
    });

    (
      mockUsuariosRepository.findAuthProfileByEmail as jest.Mock
    ).mockResolvedValue({
      id_usuario: 25,
      dni: '12345678',
      email: 'socio@fitzone.com',
      password: 'hash',
      nombre: 'Juan',
      apellido: 'Perez',
      telefono: '+54911223344',
      foto_url: null,
      id_sede: 1,
      id_usuario_estado: 1,
      sede: {
        id_sede: 1,
        nombre: 'Sede Central',
        id_ciudad: 1,
      },
      usuario_rol: [
        {
          rol: {
            id_rol: 1,
            nombre: 'socio',
          },
        },
      ],
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({
      id_usuario: 25,
      supabase_user_id: 'supabase-uuid-123',
      email: 'socio@fitzone.com',
      rol: 'socio',
      roles: ['socio'],
      dni: '12345678',
      nombre: 'Juan',
      apellido: 'Perez',
      telefono: '+54911223344',
      foto_url: null,
      id_sede: 1,
      sede: {
        id_sede: 1,
        nombre: 'Sede Central',
        id_ciudad: 1,
      },
    });
  });

  it('debe lanzar UnauthorizedException si tanto el JWT local como Supabase fallan', async () => {
    const { context } = createMockContext('Bearer token_totalmente_invalido');
    (mockJwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    (mockSupabaseService.getUser as jest.Mock).mockResolvedValue({
      user: null,
      error: { message: 'bad_jwt' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
