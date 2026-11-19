import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AccesosService } from './accesos.service';
import { AccesosRepository } from '../repositories/accesos.repository';
import { QrService } from './qr.service';
import { AforoRealtimeService } from './aforo-realtime.service';
import { MembresiasService } from '../../M1-usuarios/services/membresias.service';
import { UsuariosService } from '../../M1-usuarios/services/usuarios.service';
import { UsuariosRepository } from '../../M1-usuarios/repositories/usuarios.repository';
import { AccesosController } from '../controllers/accesos.controller';
import { QrController } from '../controllers/qr.controller';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

describe('M2 Accesos - Cobertura de Reglas de Negocio, Repository y Controllers', () => {
  describe('AccesosService - Casos adicionales, Aforo, Perfil y Sync Offline', () => {
    let accRepo: Record<string, jest.Mock>;
    let userRepo: Record<string, jest.Mock>;
    let qrService: Record<string, jest.Mock>;
    let aforoRt: Record<string, jest.Mock>;
    let membService: Record<string, jest.Mock>;
    let userService: Record<string, jest.Mock>;
    let service: AccesosService;

    beforeEach(() => {
      accRepo = {
        buscarSedePorId: jest.fn(),
        ejecutarTransaccionIngreso: jest.fn(
          (fn: (tx: unknown) => Promise<unknown>) => fn({}),
        ),
        buscarAccesoActivoPorUsuario: jest.fn(),
        crearIngreso: jest.fn(),
        cerrarEgreso: jest.fn(),
        obtenerAforoMaximoSede: jest.fn(),
        contarAforoActual: jest.fn(),
      };
      userRepo = {
        findByDni: jest.fn(),
      };
      qrService = {
        validarTokenEfimero: jest.fn(),
        generarQrDinamico: jest.fn(),
      };
      aforoRt = {
        emitirAforo: jest.fn(),
      };
      membService = {
        verificarMembresia: jest.fn(),
      };
      userService = {
        findById: jest.fn(),
      };

      service = new AccesosService(
        accRepo as unknown as AccesosRepository,
        userRepo as unknown as UsuariosRepository,
        qrService as unknown as QrService,
        aforoRt as unknown as AforoRealtimeService,
        membService as unknown as MembresiasService,
        userService as unknown as UsuariosService,
      );
    });

    it('debe validar errores de formato de token QR, DNI inexistente y modo híbrido offline', async () => {
      await expect(
        service.validarYRegistrarIngreso({ id_sede: 1 }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.validarYRegistrarIngreso({ qrToken: 'invalido', id_sede: 1 }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.validarYRegistrarIngreso({
          qrToken: '0.1.12345.sig',
          id_sede: 1,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.validarYRegistrarIngreso({
          qrToken: '1.0.12345.sig',
          id_sede: 1,
        }),
      ).rejects.toThrow(BadRequestException);

      userRepo.findByDni.mockResolvedValueOnce(null);
      await expect(
        service.validarYRegistrarIngreso({ dni: '000000', id_sede: 1 }),
      ).rejects.toThrow(NotFoundException);

      // Modo híbrido offline cuando validarTokenEfimero lanza Error genérico
      qrService.validarTokenEfimero.mockImplementationOnce(() => {
        throw new Error('Offline fallback');
      });
      accRepo.buscarSedePorId.mockResolvedValueOnce({
        id_sede: 1,
        id_ciudad: 99,
      });
      await expect(
        service.validarYRegistrarIngreso({
          qrToken: '10.1.12345.sig',
          id_sede: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('obtenerEstadoAforo y obtenerPerfilSocio deben manejar 404 y estados ACTIVO/INACTIVO', async () => {
      accRepo.obtenerAforoMaximoSede.mockResolvedValueOnce(null);
      await expect(service.obtenerEstadoAforo(99)).rejects.toThrow(
        NotFoundException,
      );

      userService.findById.mockResolvedValueOnce(null);
      await expect(service.obtenerPerfilSocio(99)).rejects.toThrow(
        NotFoundException,
      );

      userService.findById.mockResolvedValue({
        id_usuario: 10,
        email: 'socio@fitzone.com',
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '30111222',
        foto_url: null,
        id_sede: 1,
        sede: { id_ciudad: 1, ciudad: { nombre: 'Córdoba' } },
        membresia: [],
      });

      membService.verificarMembresia.mockResolvedValueOnce({
        esSocioActivo: true,
        enMora: false,
      });
      const perfilActivo = await service.obtenerPerfilSocio(10);
      expect(perfilActivo.estado).toBe('ACTIVO');

      membService.verificarMembresia.mockResolvedValueOnce({
        esSocioActivo: false,
        enMora: true,
      });
      const perfilInactivo = await service.obtenerPerfilSocio(10);
      expect(perfilInactivo.estado).toBe('INACTIVO');
    });

    it('sincronizarAccesoOffline debe procesar INGRESO y EGRESO validando usuario, sede y membresía', async () => {
      const now = new Date();
      userService.findById.mockResolvedValueOnce(null);
      await expect(
        service.sincronizarAccesoOffline({
          id_usuario: 99,
          id_sede: 1,
          tipo: 'INGRESO',
          timestamp: now,
        }),
      ).rejects.toThrow(NotFoundException);

      userService.findById.mockResolvedValue({ id_usuario: 10 });
      accRepo.buscarSedePorId.mockResolvedValueOnce(null);
      await expect(
        service.sincronizarAccesoOffline({
          id_usuario: 10,
          id_sede: 99,
          tipo: 'INGRESO',
          timestamp: now,
        }),
      ).rejects.toThrow(NotFoundException);

      accRepo.buscarSedePorId.mockResolvedValue({ id_sede: 1 });
      accRepo.obtenerAforoMaximoSede.mockResolvedValue(100);
      accRepo.contarAforoActual.mockResolvedValue(10);

      // INGRESO con mora -> 403
      membService.verificarMembresia.mockResolvedValueOnce({
        esSocioActivo: false,
        enMora: true,
      });
      await expect(
        service.sincronizarAccesoOffline({
          id_usuario: 10,
          id_sede: 1,
          tipo: 'INGRESO',
          timestamp: now,
        }),
      ).rejects.toThrow(ForbiddenException);

      // INGRESO cuando ya tenía acceso activo
      membService.verificarMembresia.mockResolvedValue({
        esSocioActivo: true,
        enMora: false,
      });
      accRepo.buscarAccesoActivoPorUsuario.mockResolvedValueOnce({
        id_registro_acceso: 1,
      });
      const resDup = await service.sincronizarAccesoOffline({
        id_usuario: 10,
        id_sede: 1,
        tipo: 'INGRESO',
        timestamp: now,
      });
      expect(resDup.mensaje).toContain('ya figuraba');

      // INGRESO exitoso
      accRepo.buscarAccesoActivoPorUsuario.mockResolvedValueOnce(null);
      const resIng = await service.sincronizarAccesoOffline({
        id_usuario: 10,
        id_sede: 1,
        tipo: 'INGRESO',
        timestamp: now,
      });
      expect(resIng.mensaje).toContain('INGRESO procesada con éxito');
      expect(accRepo.crearIngreso).toHaveBeenCalledWith(10, 1);

      // EGRESO sin ingreso activo previo
      accRepo.buscarAccesoActivoPorUsuario.mockResolvedValueOnce(null);
      const resEgrSin = await service.sincronizarAccesoOffline({
        id_usuario: 10,
        id_sede: 1,
        tipo: 'EGRESO',
        timestamp: now,
      });
      expect(resEgrSin.mensaje).toContain('No se encontró un ingreso activo');

      // EGRESO exitoso con timestamp
      accRepo.buscarAccesoActivoPorUsuario.mockResolvedValueOnce({
        id_registro_acceso: 55,
      });
      const resEgrOk = await service.sincronizarAccesoOffline({
        id_usuario: 10,
        id_sede: 1,
        tipo: 'EGRESO',
        timestamp: new Date('2026-11-10T18:00:00Z'),
      });
      expect(resEgrOk.mensaje).toContain('EGRESO procesada con éxito');
      expect(accRepo.cerrarEgreso).toHaveBeenCalled();
    });
  });

  describe('AccesosRepository, AccesosController y QrController', () => {
    it('AccesosRepository debe ejecutar operaciones en PrismaService', async () => {
      const mockPrisma = {
        registroAcceso: {
          create: jest.fn().mockResolvedValue({ id_registro_acceso: 1 }),
          findFirst: jest.fn().mockResolvedValue({ id_registro_acceso: 1 }),
          update: jest.fn().mockResolvedValue({ id_registro_acceso: 1 }),
          count: jest.fn().mockResolvedValue(15),
        },
        sede: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ id_sede: 1, aforo_maximo: 80 }),
        },
        $transaction: jest.fn(),
      };
      mockPrisma.$transaction.mockImplementation(
        (fn: (tx: unknown) => Promise<unknown>) => fn(mockPrisma),
      );

      const repo = new AccesosRepository(
        mockPrisma as unknown as PrismaService,
      );
      await repo.crearIngreso(10, 1);
      await repo.buscarAccesoActivoPorUsuario(10);
      await repo.cerrarEgreso(1);
      await repo.ejecutarTransaccionIngreso(() => Promise.resolve('ok'));
      expect(await repo.contarAforoActual(1)).toBe(15);
      expect(await repo.obtenerAforoMaximoSede(1)).toBe(80);
      await repo.buscarSedePorId(1);

      mockPrisma.sede.findUnique.mockRejectedValueOnce(new Error('DB err'));
      expect(await repo.obtenerAforoMaximoSede(1)).toBeNull();
    });

    it('AccesosController y QrController deben delegar en sus servicios', async () => {
      const mockAccService = {
        validarYRegistrarIngreso: jest
          .fn()
          .mockResolvedValue({ accesoPermitido: true }),
        registrarEgreso: jest.fn().mockResolvedValue({ id_registro_acceso: 1 }),
        obtenerEstadoAforo: jest.fn().mockResolvedValue({ aforoActual: 5 }),
        obtenerPerfilSocio: jest.fn().mockResolvedValue({ socioId: 10 }),
        sincronizarAccesoOffline: jest
          .fn()
          .mockResolvedValue({ mensaje: 'ok' }),
      };

      const accCtrl = new AccesosController(
        mockAccService as unknown as AccesosService,
      );
      expect(await accCtrl.validarIngreso({ dni: '123', id_sede: 1 })).toEqual({
        accesoPermitido: true,
      });
      expect(await accCtrl.registrarEgreso({ dni: '123', id_sede: 1 })).toEqual(
        {
          id_registro_acceso: 1,
        },
      );
      expect(await accCtrl.obtenerAforo(1)).toEqual({ aforoActual: 5 });
      expect(await accCtrl.obtenerPerfilSocio(10)).toEqual({ socioId: 10 });
      expect(
        await accCtrl.sincronizarOffline({
          id_usuario: 10,
          id_sede: 1,
          tipo: 'INGRESO',
          timestamp: new Date(),
        }),
      ).toEqual({ mensaje: 'ok' });

      const mockQrService = {
        generarQrDinamico: jest.fn().mockResolvedValue({ token: 'qr-tok' }),
      };
      const qrCtrl = new QrController(mockQrService as unknown as QrService);
      expect(
        await qrCtrl.generarQr({ id_usuario: 10 } as AuthenticatedUser),
      ).toEqual({ token: 'qr-tok' });
    });
  });
});
