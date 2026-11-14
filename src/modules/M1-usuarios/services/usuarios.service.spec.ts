import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosRepository } from '../repositories/usuarios.repository';
import { CreateUsuarioDto } from '../dto/crear-usuario.dto';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('UsuariosService', () => {
  let service: UsuariosService;
  let repository: jest.Mocked<UsuariosRepository>;

  const mockCreateDto: CreateUsuarioDto = {
    dni: '12345678',
    email: 'test@fitzone.com',
    nombre: 'Juan',
    apellido: 'Perez',
    telefono: '+54911223344',
    id_sede: 1,
    contrasenia: 'Password123!',
    roles: [1], // Intento de enviar rol privilegiado
  };

  beforeEach(async () => {
    const mockRepo = {
      findExistingByDniOrEmail: jest.fn(),
      findRolByNombre: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: UsuariosRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
    repository = module.get(UsuariosRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería asignar dinámicamente el rol "externo" obtenido por nombre e ignorar roles del cliente', async () => {
      repository.findExistingByDniOrEmail.mockResolvedValue(null);
      repository.findRolByNombre.mockResolvedValue({
        id_rol: 99,
        nombre: 'externo',
      } as any);

      repository.create.mockResolvedValue({
        id_usuario: 1,
        dni: mockCreateDto.dni,
        email: mockCreateDto.email,
        password: 'hashed_password',
        nombre: mockCreateDto.nombre,
        apellido: mockCreateDto.apellido,
        telefono: mockCreateDto.telefono,
        foto_url: null,
        qr_url: null,
        id_sede: 1,
        id_usuario_estado: 1,
        creacion: new Date(),
        modificado: new Date(),
        usuario_rol: [
          {
            id_usuario: 1,
            id_rol: 99,
            fecha_asignacion: new Date(),
            rol: { id_rol: 99, nombre: 'externo' },
          },
        ],
        sede: {
          id_sede: 1,
          nombre: 'Central',
          direccion: 'Calle 123',
          aforo_maximo: 50,
          activo: true,
          id_ciudad: 1,
          ciudad: { id_ciudad: 1, nombre: 'BsAs', activo: true },
        },
        usuario_estado: { id_usuario_estado: 1, descripcion: 'activo' },
        membresia: [],
      } as any);

      const result = await service.create(mockCreateDto);

      expect(repository.findExistingByDniOrEmail).toHaveBeenCalledWith(
        mockCreateDto.dni,
        mockCreateDto.email,
      );
      expect(repository.findRolByNombre).toHaveBeenCalledWith('externo');
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dni: mockCreateDto.dni,
          email: mockCreateDto.email,
          usuario_rol: {
            create: [
              {
                rol: { connect: { id_rol: 99 } },
              },
            ],
          },
        }),
      );
      expect(result).toBeDefined();
    });

    it('debería lanzar InternalServerErrorException cuando el rol "externo" no existe en BD', async () => {
      repository.findExistingByDniOrEmail.mockResolvedValue(null);
      repository.findRolByNombre.mockResolvedValue(null);

      await expect(service.create(mockCreateDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('debería lanzar ConflictException cuando findExistingByDniOrEmail detecta un DNI duplicado', async () => {
      repository.findExistingByDniOrEmail.mockResolvedValue({
        id_usuario: 2,
        dni: mockCreateDto.dni,
        email: 'otro@fitzone.com',
      });

      await expect(service.create(mockCreateDto)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.findRolByNombre).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('debería lanzar ConflictException cuando findExistingByDniOrEmail detecta un email duplicado', async () => {
      repository.findExistingByDniOrEmail.mockResolvedValue({
        id_usuario: 3,
        dni: '87654321',
        email: mockCreateDto.email,
      });

      await expect(service.create(mockCreateDto)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.findRolByNombre).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });
  });
});
