/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosRepository } from '../repositories/usuarios.repository';
import { UsuariosController } from '../controllers/usuarios.controller';
import { UploadFotoController } from '../controllers/upload-foto.controller';
import { FotoStorageService } from './foto-storage.service';
import { CreateUsuarioDto } from '../dto/crear-usuario.dto';
import { PrismaService } from '../../../database/prisma-service/prisma.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('UsuariosService, UsuariosRepository y Controllers', () => {
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
    roles: [1],
  };

  const mockUserEntity = {
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
  };

  beforeEach(async () => {
    const mockRepo = {
      findExistingByDniOrEmail: jest.fn(),
      findRolByNombre: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      findAllPaginated: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      updateStatus: jest.fn(),
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
      });
      repository.create.mockResolvedValue(mockUserEntity);

      const result = await service.create(mockCreateDto);

      expect(repository.findExistingByDniOrEmail).toHaveBeenCalledWith(
        mockCreateDto.dni,
        mockCreateDto.email,
      );
      expect(repository.findRolByNombre).toHaveBeenCalledWith('externo');
      expect(result).toBeDefined();
    });

    it('debería usar SUPABASE_MANAGED_AUTH cuando no se envía contraseña', async () => {
      repository.findExistingByDniOrEmail.mockResolvedValue(null);
      repository.findRolByNombre.mockResolvedValue({
        id_rol: 99,
        nombre: 'externo',
      });
      repository.create.mockResolvedValue(mockUserEntity);

      await service.create({ ...mockCreateDto, contrasenia: undefined });
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'SUPABASE_MANAGED_AUTH',
        }),
      );
    });

    it('debería lanzar InternalServerErrorException cuando el rol "externo" no existe en BD', async () => {
      repository.findExistingByDniOrEmail.mockResolvedValue(null);
      repository.findRolByNombre.mockResolvedValue(null);

      await expect(service.create(mockCreateDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('debería lanzar ConflictException cuando findExistingByDniOrEmail detecta un DNI o email duplicado', async () => {
      repository.findExistingByDniOrEmail.mockResolvedValueOnce({
        id_usuario: 2,
        dni: mockCreateDto.dni,
        email: 'otro@fitzone.com',
      });
      await expect(service.create(mockCreateDto)).rejects.toThrow(
        ConflictException,
      );

      repository.findExistingByDniOrEmail.mockResolvedValueOnce({
        id_usuario: 3,
        dni: '87654321',
        email: mockCreateDto.email,
      });
      await expect(service.create(mockCreateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll, findById, findByEmail, update, remove y restore', () => {
    it('findAll debe paginar y filtrar por sede y estado de usuario', async () => {
      repository.findAllPaginated.mockResolvedValue([mockUserEntity]);
      repository.count.mockResolvedValue(1);

      const res1 = await service.findAll(1, 1, 10, false);
      expect(res1.meta.total).toBe(1);
      expect(repository.findAllPaginated).toHaveBeenCalledWith(
        { id_sede: 1, id_usuario_estado: 1 },
        0,
        10,
      );

      const res2 = await service.findAll(undefined, 2, 5, true, 3);
      expect(res2.meta.page).toBe(2);
      expect(repository.findAllPaginated).toHaveBeenCalledWith(
        { id_usuario_estado: 3 },
        5,
        5,
      );
    });

    it('findById y findByEmail deben retornar DTO o lanzar 404', async () => {
      repository.findById.mockResolvedValueOnce(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);

      repository.findById.mockResolvedValueOnce(mockUserEntity);
      expect(await service.findById(1)).toBeDefined();

      repository.findByEmail.mockResolvedValueOnce(null);
      await expect(service.findByEmail('no@fitzone.com')).rejects.toThrow(
        NotFoundException,
      );

      repository.findByEmail.mockResolvedValueOnce(mockUserEntity);
      expect(await service.findByEmail('test@fitzone.com')).toBeDefined();

      repository.findByEmail.mockResolvedValueOnce(mockUserEntity);
      expect(await service.findEntityByEmail('test@fitzone.com')).toEqual(
        mockUserEntity,
      );
    });

    it('update, updateFotoUrl, remove y restore deben actualizar los campos permitidos', async () => {
      repository.findById.mockResolvedValue(mockUserEntity);
      repository.update.mockResolvedValue(mockUserEntity);
      repository.softDelete.mockResolvedValue(mockUserEntity);
      repository.updateStatus.mockResolvedValue(mockUserEntity);

      await service.update(1, {
        nombre: 'Pedro',
        apellido: 'Gomez',
        telefono: '123',
        foto_url: 'https://img',
        id_sede: 2,
        id_usuario_estado: 1,
      });
      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          nombre: 'Pedro',
          apellido: 'Gomez',
        }),
      );

      await service.updateFotoUrl(1, 'https://nueva.jpg');
      expect(repository.update).toHaveBeenCalledWith(1, {
        foto_url: 'https://nueva.jpg',
      });

      await service.remove(1);
      expect(repository.softDelete).toHaveBeenCalledWith(1, 3);

      await service.restore(1);
      expect(repository.updateStatus).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('UsuariosRepository', () => {
    it('debe delegar todas las consultas a PrismaService', async () => {
      const mockPrisma = {
        usuario: {
          create: jest.fn().mockResolvedValue(mockUserEntity),
          findFirst: jest.fn().mockResolvedValue(mockUserEntity),
          findUnique: jest.fn().mockResolvedValue(mockUserEntity),
          findMany: jest.fn().mockResolvedValue([mockUserEntity]),
          update: jest.fn().mockResolvedValue(mockUserEntity),
          count: jest.fn().mockResolvedValue(1),
        },
        rol: {
          findFirst: jest
            .fn()
            .mockResolvedValue({ id_rol: 1, nombre: 'socio' }),
        },
      };

      const repo = new UsuariosRepository(
        mockPrisma as unknown as PrismaService,
      );
      await repo.create({} as never);
      await repo.findExistingByDniOrEmail('123', 'a@b.c');
      await repo.findRolByNombre('socio');
      await repo.findAuthProfileByEmail('a@b.c');
      await repo.findByDni('123');
      await repo.findByEmail('a@b.c');
      await repo.findById(1);
      await repo.findAll(1);
      await repo.findAll();
      await repo.update(1, {});
      await repo.softDelete(1, 3);
      await repo.findAllPaginated({}, 0, 10);
      await repo.count({});
      await repo.updateStatus(1, 1);

      expect(mockPrisma.usuario.create).toHaveBeenCalled();
      expect(mockPrisma.usuario.count).toHaveBeenCalled();
    });
  });

  describe('UsuariosController y UploadFotoController', () => {
    it('UsuariosController debe validar permisos RBAC y campos prohibidos en update', async () => {
      const ctrl = new UsuariosController(service);
      repository.findById.mockResolvedValue(mockUserEntity);
      repository.update.mockResolvedValue(mockUserEntity);
      repository.softDelete.mockResolvedValue(mockUserEntity);
      repository.findAllPaginated.mockResolvedValue([mockUserEntity]);
      repository.count.mockResolvedValue(1);
      repository.findExistingByDniOrEmail.mockResolvedValue(null);
      repository.findRolByNombre.mockResolvedValue({
        id_rol: 1,
        nombre: 'externo',
      });
      repository.create.mockResolvedValue(mockUserEntity);

      await ctrl.create(mockCreateDto);
      await ctrl.findAll(1, 10, 'true', 1, 1);
      await ctrl.findById(1);
      await ctrl.remove(1);

      // 403 si otro usuario no gerente intenta modificar
      await expect(
        ctrl.update(1, { nombre: 'X' }, {
          user: { id_usuario: 99, roles: ['socio'] },
          body: { nombre: 'X' },
        } as never),
      ).rejects.toThrow(ForbiddenException);

      // 400 si envía campo prohibido (dni, email, roles, password)
      await expect(
        ctrl.update(1, { nombre: 'X' }, {
          user: { id_usuario: 1, roles: ['socio'] },
          body: { dni: '999' },
        } as never),
      ).rejects.toThrow(BadRequestException);

      // 403 si usuario no gerente intenta cambiar id_usuario_estado
      await expect(
        ctrl.update(1, { id_usuario_estado: 3 }, {
          user: { id_usuario: 1, roles: ['socio'] },
          body: { id_usuario_estado: 3 },
        } as never),
      ).rejects.toThrow(ForbiddenException);

      // Éxito cuando gerente modifica estado de otro usuario
      const updated = await ctrl.update(
        1,
        { nombre: 'Nuevo', id_usuario_estado: 3 },
        {
          user: { id_usuario: 50, roles: ['gerente'] },
          body: { nombre: 'Nuevo', id_usuario_estado: 3 },
        } as never,
      );
      expect(updated).toBeDefined();
    });

    it('UploadFotoController debe validar titularidad, archivo presente y delegar subida', async () => {
      const mockFotoStorage = {
        uploadFoto: jest.fn().mockResolvedValue('https://cdn/foto.jpg'),
      };
      const ctrl = new UploadFotoController(
        mockFotoStorage as unknown as FotoStorageService,
        service,
      );

      const mockFile = {
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('img'),
      } as Express.Multer.File;

      await expect(
        ctrl.uploadFoto(1, mockFile, {
          user: { id_usuario: 99 },
        } as never),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        ctrl.uploadFoto(
          1,
          undefined as unknown as Express.Multer.File,
          {
            user: { id_usuario: 1 },
          } as never,
        ),
      ).rejects.toThrow(BadRequestException);

      repository.findById.mockResolvedValue(mockUserEntity);
      repository.update.mockResolvedValue(mockUserEntity);

      const res = await ctrl.uploadFoto(1, mockFile, {
        user: { id_usuario: 1 },
      } as never);
      expect(res.foto_url).toBe('https://cdn/foto.jpg');
    });
  });
});
