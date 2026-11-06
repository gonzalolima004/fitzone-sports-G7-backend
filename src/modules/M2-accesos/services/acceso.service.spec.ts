import { Test, TestingModule } from '@nestjs/testing';
import { AccesosService } from './accesos.service';
import {
  AccesosRepository,
  RegistroAccesoConSede,
} from '../repositories/accesos.repository';
import { QrService } from './qr.service';
import { AforoRealtimeService } from './aforo-realtime.service';
import { MembresiasService } from '../../M1-usuarios/services/membresias.service';
import { UsuariosService } from '../../M1-usuarios/services/usuarios.service';
import {
  BadRequestException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { VerificarMembresiaResponseDto } from '../../M1-usuarios/dto/verificar-membresia-response.dto';
import { UsuarioResponseDto } from '../../M1-usuarios/dto/usuario-response.dto';
import { Prisma, Usuario } from '@prisma/client';

describe('AccesosService', () => {
  let service: AccesosService;
  let mockAccesosRepository: {
    buscarUsuarioPorDni: jest.Mock;
    ejecutarTransaccionIngreso: jest.Mock;
    buscarAccesoActivoPorUsuario: jest.Mock;
    crearIngreso: jest.Mock;
    cerrarEgreso: jest.Mock;
    obtenerAforoMaximoSede: jest.Mock;
    contarAforoActual: jest.Mock;
    buscarSedePorId: jest.Mock;
  };
  let accesosRepository: jest.Mocked<AccesosRepository>;
  let qrService: jest.Mocked<QrService>;
  let membresiasService: jest.Mocked<MembresiasService>;
  let usuariosService: jest.Mocked<UsuariosService>;
  let emitirAforoMock: jest.Mock;

  beforeEach(async () => {
    emitirAforoMock = jest.fn();

    mockAccesosRepository = {
      buscarUsuarioPorDni: jest.fn(),
      ejecutarTransaccionIngreso: jest.fn(),
      buscarAccesoActivoPorUsuario: jest.fn(),
      crearIngreso: jest.fn(),
      cerrarEgreso: jest.fn(),
      obtenerAforoMaximoSede: jest.fn(),
      contarAforoActual: jest.fn(),
      buscarSedePorId: jest.fn(),
    };

    const mockQrService = {
      validarTokenEfimero: jest.fn(),
    };

    const mockAforoRealtimeService = {
      emitirAforo: emitirAforoMock,
    };

    const mockMembresiasService = {
      verificarMembresia: jest.fn(),
    };

    const mockUsuariosService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccesosService,
        { provide: AccesosRepository, useValue: mockAccesosRepository },
        { provide: QrService, useValue: mockQrService },
        { provide: AforoRealtimeService, useValue: mockAforoRealtimeService },
        { provide: MembresiasService, useValue: mockMembresiasService },
        { provide: UsuariosService, useValue: mockUsuariosService },
      ],
    }).compile();

    service = module.get<AccesosService>(AccesosService);
    accesosRepository = module.get(AccesosRepository);
    qrService = module.get(QrService);
    membresiasService = module.get(MembresiasService);
    usuariosService = module.get(UsuariosService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('validarYRegistrarIngreso', () => {
    it('debe registrar el ingreso exitosamente usando un token QR válido y membresía al día', async () => {
      // Arrange
      const dto = { qrToken: '1.12345678.sig', id_sede: 1 };

      qrService.validarTokenEfimero.mockReturnValue(true);

      membresiasService.verificarMembresia.mockResolvedValue({
        esSocioActivo: true,
        enMora: false,
      } as unknown as VerificarMembresiaResponseDto);

      usuariosService.findById.mockResolvedValue({
        id_usuario: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        sede: {
          id_sede: 1,
          nombre: 'Sede Central',
          id_ciudad: 1,
        },
      } as unknown as UsuarioResponseDto);

      accesosRepository.ejecutarTransaccionIngreso.mockImplementation(
        async (callback) => {
          accesosRepository.buscarAccesoActivoPorUsuario.mockResolvedValue(
            null,
          );
          accesosRepository.buscarSedePorId.mockResolvedValue({
            id_sede: 1,
            nombre: 'Sede Central',
            id_ciudad: 1,
          });
          return callback({} as unknown as Prisma.TransactionClient);
        },
      );

      accesosRepository.crearIngreso.mockResolvedValue({
        id_registro_acceso: 10,
        id_usuario: 1,
        id_sede: 1,
        fecha_ingreso: new Date(),
        fecha_egreso: null,
      });

      accesosRepository.obtenerAforoMaximoSede.mockResolvedValue(100);
      accesosRepository.contarAforoActual.mockResolvedValue(20);

      // Act
      const resultado = await service.validarYRegistrarIngreso(dto);

      // Assert
      expect(resultado).toBeDefined();
      expect(resultado.accesoPermitido).toBe(true);
      expect(resultado.nombreUsuario).toBe('Juan Pérez');
      expect(emitirAforoMock).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('debe registrar el ingreso exitosamente usando el número de DNI ingresado manualmente y membresía al día', async () => {
      // Arrange
      const dto = { dni: '30111222', id_sede: 1 };

      accesosRepository.buscarUsuarioPorDni.mockResolvedValue({
        id_usuario: 1,
        dni: '30111222',
      } as unknown as Usuario);

      membresiasService.verificarMembresia.mockResolvedValue({
        esSocioActivo: true,
        enMora: false,
      } as unknown as VerificarMembresiaResponseDto);

      usuariosService.findById.mockResolvedValue({
        id_usuario: 1,
        nombre: 'María',
        apellido: 'Gómez',
        sede: {
          id_sede: 1,
          nombre: 'Sede Central',
          id_ciudad: 1,
        },
      } as unknown as UsuarioResponseDto);

      accesosRepository.ejecutarTransaccionIngreso.mockImplementation(
        async (callback) => {
          accesosRepository.buscarAccesoActivoPorUsuario.mockResolvedValue(
            null,
          );
          accesosRepository.buscarSedePorId.mockResolvedValue({
            id_sede: 1,
            nombre: 'Sede Central',
            id_ciudad: 1,
          });
          return callback({} as unknown as Prisma.TransactionClient);
        },
      );

      accesosRepository.crearIngreso.mockResolvedValue({
        id_registro_acceso: 11,
        id_usuario: 1,
        id_sede: 1,
        fecha_ingreso: new Date(),
        fecha_egreso: null,
      });

      accesosRepository.obtenerAforoMaximoSede.mockResolvedValue(100);
      accesosRepository.contarAforoActual.mockResolvedValue(21);

      // Act
      const resultado = await service.validarYRegistrarIngreso(dto);

      // Assert
      expect(resultado).toBeDefined();
      expect(resultado.accesoPermitido).toBe(true);
      expect(resultado.nombreUsuario).toBe('María Gómez');
      expect(mockAccesosRepository.buscarUsuarioPorDni).toHaveBeenCalledWith(
        '30111222',
      );
      expect(emitirAforoMock).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('debe denegar el acceso (ForbiddenException) si la membresía está inactiva o en mora', async () => {
      // Arrange
      const dto = { dni: '30111222', id_sede: 1 };

      accesosRepository.buscarUsuarioPorDni.mockResolvedValue({
        id_usuario: 1,
        dni: '30111222',
      } as unknown as Usuario);

      membresiasService.verificarMembresia.mockResolvedValue({
        esSocioActivo: false,
        enMora: true,
      } as unknown as VerificarMembresiaResponseDto);

      // Act & Assert
      await expect(service.validarYRegistrarIngreso(dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe lanzar ConflictException si el usuario ya posee un acceso activo sin egresar (Anti-Doble Ingreso)', async () => {
      // Arrange
      const dto = { dni: '30111222', id_sede: 1 };

      accesosRepository.buscarUsuarioPorDni.mockResolvedValue({
        id_usuario: 1,
        dni: '30111222',
      } as unknown as Usuario);

      membresiasService.verificarMembresia.mockResolvedValue({
        esSocioActivo: true,
        enMora: false,
      } as unknown as VerificarMembresiaResponseDto);

      usuariosService.findById.mockResolvedValue({
        id_usuario: 1,
        nombre: 'Ana',
        apellido: 'Gómez',
        sede: {
          id_sede: 1,
          nombre: 'Sede Central',
          id_ciudad: 1,
        },
      } as unknown as UsuarioResponseDto);

      accesosRepository.ejecutarTransaccionIngreso.mockImplementation(
        async (callback) => {
          const accesoActivoMock = {
            id_registro_acceso: 5,
            id_sede: 1,
            sede: { nombre: 'Sede Central' },
          };
          accesosRepository.buscarAccesoActivoPorUsuario.mockResolvedValue(
            accesoActivoMock as unknown as RegistroAccesoConSede,
          );
          accesosRepository.buscarSedePorId.mockResolvedValue({
            id_sede: 1,
            nombre: 'Sede Central',
            id_ciudad: 1,
          });

          return callback({} as unknown as Prisma.TransactionClient);
        },
      );

      // Act & Assert
      await expect(service.validarYRegistrarIngreso(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe denegar el acceso (BadRequestException) si la sede de destino pertenece a una ciudad distinta a la ciudad de registro del socio', async () => {
      // Arrange
      const dto = { dni: '30111222', id_sede: 99 };

      accesosRepository.buscarUsuarioPorDni.mockResolvedValue({
        id_usuario: 1,
        dni: '30111222',
      } as unknown as Usuario);

      membresiasService.verificarMembresia.mockResolvedValue({
        esSocioActivo: true,
        enMora: false,
      } as unknown as VerificarMembresiaResponseDto);

      usuariosService.findById.mockResolvedValue({
        id_usuario: 1,
        nombre: 'Carlos',
        apellido: 'López',
        sede: {
          id_sede: 1,
          nombre: 'Sede Concordia',
          id_ciudad: 1,
        },
      } as unknown as UsuarioResponseDto);

      accesosRepository.ejecutarTransaccionIngreso.mockImplementation(
        async (callback) => {
          accesosRepository.buscarAccesoActivoPorUsuario.mockResolvedValue(
            null,
          );
          // Sede destino en otra ciudad (id_ciudad: 2)
          accesosRepository.buscarSedePorId.mockResolvedValue({
            id_sede: 99,
            nombre: 'Sede Paraná',
            id_ciudad: 2,
          });

          return callback({} as unknown as Prisma.TransactionClient);
        },
      );

      // Act & Assert
      await expect(service.validarYRegistrarIngreso(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar NotFoundException si la sede de destino no existe', async () => {
      // Arrange
      const dto = { dni: '30111222', id_sede: 999 };

      accesosRepository.buscarUsuarioPorDni.mockResolvedValue({
        id_usuario: 1,
        dni: '30111222',
      } as unknown as Usuario);

      membresiasService.verificarMembresia.mockResolvedValue({
        esSocioActivo: true,
        enMora: false,
      } as unknown as VerificarMembresiaResponseDto);

      usuariosService.findById.mockResolvedValue({
        id_usuario: 1,
        nombre: 'Carlos',
        apellido: 'López',
        sede: {
          id_sede: 1,
          nombre: 'Sede Concordia',
          id_ciudad: 1,
        },
      } as unknown as UsuarioResponseDto);

      accesosRepository.ejecutarTransaccionIngreso.mockImplementation(
        async (callback) => {
          accesosRepository.buscarAccesoActivoPorUsuario.mockResolvedValue(
            null,
          );
          accesosRepository.buscarSedePorId.mockResolvedValue(null);

          return callback({} as unknown as Prisma.TransactionClient);
        },
      );

      // Act & Assert
      await expect(service.validarYRegistrarIngreso(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('registrarEgreso', () => {
    it('debe registrar el egreso exitosamente utilizando un token QR válido', async () => {
      // Arrange
      const dto = { qrToken: '1.12345678.sig', id_sede: 1 };
      qrService.validarTokenEfimero.mockReturnValue(true);

      const fechaIngresoMock = new Date(Date.now() - 3600000);
      const fechaEgresoMock = new Date();

      accesosRepository.buscarAccesoActivoPorUsuario.mockResolvedValue({
        id_registro_acceso: 10,
        id_usuario: 1,
        id_sede: 1,
        fecha_ingreso: fechaIngresoMock,
        fecha_egreso: null,
        sede: { id_sede: 1, nombre: 'Sede Central', id_ciudad: 1 },
      } as unknown as RegistroAccesoConSede);

      accesosRepository.cerrarEgreso.mockResolvedValue({
        id_registro_acceso: 10,
        id_usuario: 1,
        id_sede: 1,
        fecha_ingreso: fechaIngresoMock,
        fecha_egreso: fechaEgresoMock,
      });

      accesosRepository.obtenerAforoMaximoSede.mockResolvedValue(100);
      accesosRepository.contarAforoActual.mockResolvedValue(19);

      // Act
      const resultado = await service.registrarEgreso(dto);

      // Assert
      expect(resultado).toBeDefined();
      expect(resultado.id_registro_acceso).toBe(10);
      expect(resultado.fechaEgreso).toEqual(fechaEgresoMock);
      expect(emitirAforoMock).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('debe registrar el egreso exitosamente utilizando el número de DNI ingresado manualmente', async () => {
      // Arrange
      const dto = { dni: '30111222', id_sede: 1 };

      accesosRepository.buscarUsuarioPorDni.mockResolvedValue({
        id_usuario: 1,
        dni: '30111222',
      } as unknown as Usuario);

      const fechaIngresoMock = new Date(Date.now() - 3600000);
      const fechaEgresoMock = new Date();

      accesosRepository.buscarAccesoActivoPorUsuario.mockResolvedValue({
        id_registro_acceso: 12,
        id_usuario: 1,
        id_sede: 1,
        fecha_ingreso: fechaIngresoMock,
        fecha_egreso: null,
        sede: { id_sede: 1, nombre: 'Sede Central', id_ciudad: 1 },
      } as unknown as RegistroAccesoConSede);

      accesosRepository.cerrarEgreso.mockResolvedValue({
        id_registro_acceso: 12,
        id_usuario: 1,
        id_sede: 1,
        fecha_ingreso: fechaIngresoMock,
        fecha_egreso: fechaEgresoMock,
      });

      accesosRepository.obtenerAforoMaximoSede.mockResolvedValue(100);
      accesosRepository.contarAforoActual.mockResolvedValue(18);

      // Act
      const resultado = await service.registrarEgreso(dto);

      // Assert
      expect(resultado).toBeDefined();
      expect(resultado.id_registro_acceso).toBe(12);
      expect(mockAccesosRepository.buscarUsuarioPorDni).toHaveBeenCalledWith(
        '30111222',
      );
      expect(emitirAforoMock).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('debe lanzar NotFoundException si se intenta registrar egreso y el usuario no posee un acceso activo', async () => {
      // Arrange
      const dto = { dni: '30111222', id_sede: 1 };

      accesosRepository.buscarUsuarioPorDni.mockResolvedValue({
        id_usuario: 1,
        dni: '30111222',
      } as unknown as Usuario);

      accesosRepository.buscarAccesoActivoPorUsuario.mockResolvedValue(null);

      // Act & Assert
      await expect(service.registrarEgreso(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar BadRequestException si el usuario intenta egresar de una sede diferente a la que ingresó', async () => {
      // Arrange
      const dto = { dni: '30111222', id_sede: 2 }; // Sede distinta

      accesosRepository.buscarUsuarioPorDni.mockResolvedValue({
        id_usuario: 1,
        dni: '30111222',
      } as unknown as Usuario);

      accesosRepository.buscarAccesoActivoPorUsuario.mockResolvedValue({
        id_registro_acceso: 10,
        id_usuario: 1,
        id_sede: 1, // Ingresó en Sede 1
        fecha_ingreso: new Date(),
        fecha_egreso: null,
        sede: { id_sede: 1, nombre: 'Sede Central', id_ciudad: 1 },
      } as unknown as RegistroAccesoConSede);

      // Act & Assert
      await expect(service.registrarEgreso(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
