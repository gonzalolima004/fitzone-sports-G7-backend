/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../services/auth.service';
import {
  UsuariosRepository,
  UsuarioConRoles,
} from '../repositories/usuarios.repository';
import { LoginDto } from '../dto/login.dto';

// Mock de bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usuariosRepository: jest.Mocked<UsuariosRepository>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUsuario: UsuarioConRoles = {
    id_usuario: 1,
    dni: '12345678',
    email: 'test@fitzone.com',
    password: 'hashed_password',
    nombre: 'Test',
    apellido: 'User',
    telefono: '+54911223344',
    foto_url: null,
    qr_url: null,
    id_sede: 1,
    id_usuario_estado: 1,
    sede: {
      nombre: 'Sucursal',
      id_sede: 1,
      direccion: 'Calle 123',
      aforo_maximo: 100,
      activo: true,
      id_ciudad: 1,
    },
    usuario_estado: {
      id_usuario_estado: 1,
      descripcion: 'activo',
    },

    creacion: new Date(),
    modificado: new Date(),
    usuario_rol: [
      {
        id_usuario: 1,
        id_rol: 1,
        fecha_asignacion: new Date(),
        rol: { id_rol: 1, nombre: 'socio' },
      },
    ],
  };

  beforeEach(async () => {
    const mockRepo = {
      findByEmail: jest.fn(),
    };
    const mockJwt = {
      sign: jest.fn().mockReturnValue('mock_jwt_token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsuariosRepository, useValue: mockRepo },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usuariosRepository = module.get(UsuariosRepository);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@fitzone.com',
      password: 'password123',
    };

    it('debería retornar un token y datos del usuario si las credenciales son correctas', async () => {
      usuariosRepository.findByEmail.mockResolvedValue(mockUsuario);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login(loginDto);

      expect(usuariosRepository.findByEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUsuario.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUsuario.id_usuario,
        email: mockUsuario.email,
        rol: 'socio',
      });
      expect(result).toEqual({
        token: 'mock_jwt_token',
        usuario: {
          id: mockUsuario.id_usuario,
          id_usuario: mockUsuario.id_usuario,
          nombre: mockUsuario.nombre,
          apellido: mockUsuario.apellido,
          email: mockUsuario.email,
          rol: 'socio',
        },
      });
    });

    it('debería lanzar UnauthorizedException si el usuario no existe', async () => {
      usuariosRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('debería lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      usuariosRepository.findByEmail.mockResolvedValue(mockUsuario);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debería asignar el rol "socio" por defecto si el usuario no tiene roles cargados', async () => {
      const usuarioSinRoles = { ...mockUsuario, usuario_rol: [] };
      usuariosRepository.findByEmail.mockResolvedValue(usuarioSinRoles);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ rol: 'socio' }),
      );
      expect(result.usuario.rol).toBe('socio');
    });
  });
});
