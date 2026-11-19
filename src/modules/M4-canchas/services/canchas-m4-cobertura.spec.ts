import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CanchasService } from './canchas.service';
import { CanchasRepository } from '../repositories/canchas.repository';
import { ReservasCanchasRepository } from '../repositories/reservas-canchas.repository';
import { SedeService } from '../../M0-sedes/services/sede.service';
import { CotizacionCacheService } from './cotizacion-cache.service';
import { CanchasDisponibilidadService } from './canchas-disponibilidad.service';
import { MantenimientoController } from '../controllers/mantenimiento.controller';
import { ReservasCanchasController } from '../controllers/reservas-canchas.controller';
import { CanchasController } from '../controllers/canchas.controller';
import { MantenimientoService } from './mantenimiento.service';
import { ReservasCanchasService } from './reservas-canchas.service';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

describe('M4 Canchas - CRUD CanchasService, Repositories y Controllers', () => {
  describe('CanchasService CRUD y Fachada', () => {
    let canchasRepo: Record<string, jest.Mock>;
    let reservasRepo: Record<string, jest.Mock>;
    let sedeService: Record<string, jest.Mock>;
    let cacheService: CotizacionCacheService;
    let dispService: Record<string, jest.Mock>;
    let service: CanchasService;

    beforeEach(() => {
      canchasRepo = {
        existeSede: jest.fn(),
        existeTipoCancha: jest.fn(),
        crear: jest.fn(),
        obtenerTodasActivas: jest.fn(),
        obtenerTiposCancha: jest.fn(),
        crearTipoCancha: jest.fn(),
        actualizarTipoCancha: jest.fn(),
        contarCanchasActivasPorTipo: jest.fn(),
        borradoLogicoTipoCancha: jest.fn(),
        obtenerPorId: jest.fn(),
        actualizar: jest.fn(),
        borradoLogico: jest.fn(),
        obtenerDatosUsuarioParaCotizacion: jest.fn(),
      };
      reservasRepo = {};
      sedeService = {};
      cacheService = new CotizacionCacheService();
      dispService = {
        obtenerDisponibilidad: jest.fn().mockResolvedValue([]),
        obtenerDisponibilidadPorSede: jest
          .fn()
          .mockResolvedValue({ canchas: [] }),
      };

      service = new CanchasService(
        canchasRepo as unknown as CanchasRepository,
        reservasRepo as unknown as ReservasCanchasRepository,
        sedeService as unknown as SedeService,
        undefined,
        cacheService,
        dispService as unknown as CanchasDisponibilidadService,
      );
    });

    it('crearCancha, listarCanchas, obtenerCancha, actualizarCancha y eliminarCancha deben validar existencia', async () => {
      canchasRepo.existeSede.mockResolvedValueOnce(false);
      await expect(
        service.crearCancha({
          nombre: 'C1',
          costo_base: 1000,
          id_cancha_tipo: 1,
          id_sede: 99,
        }),
      ).rejects.toThrow(BadRequestException);

      canchasRepo.existeSede.mockResolvedValue(true);
      canchasRepo.existeTipoCancha.mockResolvedValueOnce(false);
      await expect(
        service.crearCancha({
          nombre: 'C1',
          costo_base: 1000,
          id_cancha_tipo: 99,
          id_sede: 1,
        }),
      ).rejects.toThrow(BadRequestException);

      canchasRepo.existeTipoCancha.mockResolvedValue(true);
      canchasRepo.crear.mockResolvedValue({ id_cancha: 1 });
      expect(
        await service.crearCancha({
          nombre: 'C1',
          costo_base: 1000,
          id_cancha_tipo: 1,
          id_sede: 1,
        }),
      ).toEqual({ id_cancha: 1 });

      canchasRepo.obtenerTodasActivas.mockResolvedValue([{ id_cancha: 1 }]);
      expect(await service.listarCanchas(1)).toHaveLength(1);

      canchasRepo.obtenerPorId.mockResolvedValueOnce(null);
      await expect(service.obtenerCancha(99)).rejects.toThrow(
        NotFoundException,
      );

      canchasRepo.obtenerPorId.mockResolvedValue({
        id_cancha: 1,
        activo: true,
      });
      canchasRepo.actualizar.mockResolvedValue({
        id_cancha: 1,
        nombre: 'Edit',
      });
      canchasRepo.borradoLogico.mockResolvedValue({
        id_cancha: 1,
        activo: false,
      });

      expect(await service.actualizarCancha(1, { nombre: 'Edit' })).toEqual({
        id_cancha: 1,
        nombre: 'Edit',
      });
      expect(await service.eliminarCancha(1)).toEqual({
        id_cancha: 1,
        activo: false,
      });
    });

    it('debe gestionar tipos de cancha (crear, listar, actualizar y eliminar validando canchas activas)', async () => {
      canchasRepo.obtenerTiposCancha.mockResolvedValue([{ id_cancha_tipo: 1 }]);
      expect(await service.listarTiposCancha(true)).toHaveLength(1);

      await expect(service.crearTipoCancha('   ')).rejects.toThrow(
        BadRequestException,
      );
      canchasRepo.crearTipoCancha.mockResolvedValue({
        id_cancha_tipo: 2,
        descripcion: 'Fútbol 5',
      });
      expect(await service.crearTipoCancha('  Fútbol 5  ')).toEqual({
        id_cancha_tipo: 2,
        descripcion: 'Fútbol 5',
      });

      canchasRepo.existeTipoCancha.mockResolvedValueOnce(false);
      await expect(
        service.actualizarTipoCancha(99, { descripcion: 'Tenis' }),
      ).rejects.toThrow(NotFoundException);

      canchasRepo.existeTipoCancha.mockResolvedValue(true);
      await expect(
        service.actualizarTipoCancha(1, { descripcion: '   ' }),
      ).rejects.toThrow(BadRequestException);
      await expect(service.actualizarTipoCancha(1, {})).rejects.toThrow(
        BadRequestException,
      );

      canchasRepo.actualizarTipoCancha.mockResolvedValue({
        id_cancha_tipo: 1,
        descripcion: 'Tenis',
      });
      expect(
        await service.actualizarTipoCancha(1, { descripcion: ' Tenis ' }),
      ).toEqual({ id_cancha_tipo: 1, descripcion: 'Tenis' });

      // eliminarTipoCancha: 404 si no existe, 400 si tiene canchas activas, éxito si 0
      canchasRepo.existeTipoCancha.mockResolvedValueOnce(false);
      await expect(service.eliminarTipoCancha(99)).rejects.toThrow(
        NotFoundException,
      );

      canchasRepo.existeTipoCancha.mockResolvedValue(true);
      canchasRepo.contarCanchasActivasPorTipo.mockResolvedValueOnce(2);
      await expect(service.eliminarTipoCancha(1)).rejects.toThrow(
        BadRequestException,
      );

      canchasRepo.contarCanchasActivasPorTipo.mockResolvedValueOnce(0);
      canchasRepo.borradoLogicoTipoCancha.mockResolvedValueOnce({
        id_cancha_tipo: 1,
        activo: false,
      });
      expect(await service.eliminarTipoCancha(1)).toEqual({
        id_cancha_tipo: 1,
        activo: false,
      });
    });

    it('debe delegar disponibilidad (Fachada) y ejecutar cotizarTurno con cache hit y fallback sin PrecioContextService', async () => {
      expect(await service.obtenerDisponibilidad(1, '2026-11-15')).toEqual([]);
      expect(
        await service.obtenerDisponibilidadPorSede(1, '2026-11-15', 2),
      ).toEqual({ canchas: [] });

      await cacheService.set('1_10_2026-11-15', {
        costoBase: 10000,
        esSocio: true,
        aplicaDescuentoSocio: true,
        motivoSinDescuento: null,
      });

      const cotizacion = await service.cotizarTurno(
        { canchaId: 1, fecha: '2026-11-15', hora: '20:00' },
        10,
      );
      expect(cotizacion.es_horario_pico).toBe(true);
      expect(cotizacion.precio_final).toBe(10500);
    });
  });

  describe('CanchasRepository y ReservasCanchasRepository', () => {
    it('CanchasRepository debe ejecutar consultas en PrismaService', async () => {
      const mockPrisma = {
        cancha: {
          create: jest.fn().mockResolvedValue({ id_cancha: 1 }),
          findMany: jest.fn().mockResolvedValue([{ id_cancha: 1 }]),
          findUnique: jest.fn().mockResolvedValue({ id_cancha: 1 }),
          update: jest.fn().mockResolvedValue({ id_cancha: 1 }),
          count: jest.fn().mockResolvedValue(0),
        },
        canchaTipo: {
          findMany: jest.fn().mockResolvedValue([]),
          findUnique: jest.fn().mockResolvedValue({ id_cancha_tipo: 1 }),
          create: jest.fn().mockResolvedValue({ id_cancha_tipo: 1 }),
          update: jest.fn().mockResolvedValue({ id_cancha_tipo: 1 }),
        },
        sede: {
          findUnique: jest.fn().mockResolvedValue({ id_sede: 1 }),
        },
        usuario: {
          findUnique: jest.fn().mockResolvedValue({ id_usuario: 10 }),
        },
        canchaMantenimiento: {
          create: jest.fn().mockResolvedValue({ id_cancha_mantenimiento: 1 }),
          findMany: jest.fn().mockResolvedValue([]),
        },
      };

      const repo = new CanchasRepository(
        mockPrisma as unknown as PrismaService,
      );
      await repo.crear({} as never);
      await repo.obtenerCanchasParaGrilla(1, 2);
      await repo.obtenerTodasActivas(1);
      await repo.obtenerTiposCancha(true);
      await repo.obtenerTiposCancha(false);
      await repo.obtenerPorId(1);
      await repo.obtenerDatosUsuarioParaCotizacion(10, '2026-11-15');
      await repo.actualizar(1, {});
      await repo.borradoLogico(1);
      expect(await repo.existeSede(1)).toBe(true);
      expect(await repo.existeTipoCancha(1)).toBe(true);
      await repo.crearMantenimiento({} as never);
      await repo.obtenerMantenimientos({
        sedeId: 1,
        canchaId: 1,
        fechaInicio: new Date(),
        fechaFin: new Date(),
      });
      await repo.obtenerMantenimientos({ fechaInicio: new Date() });
      await repo.obtenerMantenimientos({ fechaFin: new Date() });
      await repo.crearTipoCancha('Padel');
      await repo.actualizarTipoCancha(1, { activo: false });
      await repo.contarCanchasActivasPorTipo(1);
      await repo.borradoLogicoTipoCancha(1);

      expect(mockPrisma.cancha.create).toHaveBeenCalled();
    });

    it('ReservasCanchasRepository debe resolver estados, consultar rangos y ejecutar reserva transaccional con FOR UPDATE', async () => {
      const mockPrisma = {
        canchaReservaEstado: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce({ id_cancha_reserva_estado: 2 })
            .mockResolvedValueOnce(null),
          create: jest.fn().mockResolvedValue({ id_cancha_reserva_estado: 3 }),
        },
        canchaReserva: {
          findMany: jest.fn().mockResolvedValue([]),
          findUnique: jest.fn().mockResolvedValue({ id_cancha_reserva: 1 }),
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id_cancha_reserva: 10 }),
        },
        canchaMantenimiento: {
          findMany: jest.fn().mockResolvedValue([]),
        },
        $executeRaw: jest.fn().mockResolvedValue(1),
        $transaction: jest.fn(),
      };
      mockPrisma.$transaction.mockImplementation(
        (fn: (tx: unknown) => Promise<unknown>) => fn(mockPrisma),
      );

      const repo = new ReservasCanchasRepository(
        mockPrisma as unknown as PrismaService,
      );
      expect(await repo.obtenerIdEstadoPorDescripcion('Confirmada')).toBe(2);
      expect(await repo.obtenerIdEstadoPorDescripcion('Nuevo')).toBe(3);

      await repo.obtenerReservasPorFecha(1, new Date(), new Date());
      await repo.obtenerMantenimientosPorFecha(1, new Date(), new Date());
      expect(
        await repo.obtenerReservasPorCanchasYFecha([], new Date(), new Date()),
      ).toEqual([]);
      await repo.obtenerReservasPorCanchasYFecha([1], new Date(), new Date());
      expect(
        await repo.obtenerMantenimientosPorCanchasYFecha(
          [],
          new Date(),
          new Date(),
        ),
      ).toEqual([]);
      await repo.obtenerMantenimientosPorCanchasYFecha(
        [1],
        new Date(),
        new Date(),
      );
      await repo.obtenerPorId(1);

      const creada = await repo.crearReservaTransaccional({
        id_cancha: 1,
        id_usuario: 10,
        id_cancha_reserva_estado: 1,
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
        descuento_porcentaje: 0,
        es_horario_pico: false,
        precio_congelado: 1000,
      });
      expect(creada.id_cancha_reserva).toBe(10);

      mockPrisma.canchaReserva.findFirst.mockResolvedValueOnce({
        id_cancha_reserva: 99,
      });
      await expect(
        repo.crearReservaTransaccional({
          id_cancha: 1,
          id_usuario: 10,
          id_cancha_reserva_estado: 1,
          fecha_inicio: new Date(),
          fecha_fin: new Date(),
          descuento_porcentaje: 0,
          es_horario_pico: false,
          precio_congelado: 1000,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('MantenimientoController y ReservasCanchasController deben delegar a sus servicios', async () => {
      const mockMantService = {
        programarMantenimiento: jest
          .fn()
          .mockResolvedValue({ id_cancha_mantenimiento: 1 }),
        obtenerMantenimientos: jest.fn().mockResolvedValue([]),
      };
      const mantCtrl = new MantenimientoController(
        mockMantService as unknown as MantenimientoService,
      );
      expect(
        await mantCtrl.programarMantenimiento(1, {
          fecha_inicio: '2026-11-15T10:00:00Z',
          fecha_fin: '2026-11-15T12:00:00Z',
          motivo: 'Pintura',
        }),
      ).toEqual({ id_cancha_mantenimiento: 1 });
      expect(
        await mantCtrl.listarMantenimientos('1', '2', '2026-11-15'),
      ).toEqual([]);

      const mockResService = {
        crearReserva: jest.fn().mockResolvedValue({ id_cancha_reserva: 1 }),
        obtenerReservaPorId: jest
          .fn()
          .mockResolvedValue({ id_cancha_reserva: 1 }),
      };
      const resCtrl = new ReservasCanchasController(
        mockResService as unknown as ReservasCanchasService,
      );
      const user = { id_usuario: 10, rol: 'socio' } as AuthenticatedUser;
      expect(
        await resCtrl.crearReserva(
          {
            id_cancha: 1,
            fecha_inicio: '2026-11-15T18:00:00Z',
            fecha_fin: '2026-11-15T19:00:00Z',
          },
          user,
        ),
      ).toEqual({ id_cancha_reserva: 1 });
      expect(await resCtrl.obtenerReserva(1, user)).toEqual({
        id_cancha_reserva: 1,
      });

      const mockCanchasSvc = {
        crearCancha: jest.fn().mockResolvedValue({ id_cancha: 1 }),
        listarCanchas: jest.fn().mockResolvedValue([]),
        listarTiposCancha: jest.fn().mockResolvedValue([]),
        crearTipoCancha: jest.fn().mockResolvedValue({ id_cancha_tipo: 1 }),
        actualizarTipoCancha: jest
          .fn()
          .mockResolvedValue({ id_cancha_tipo: 1 }),
        eliminarTipoCancha: jest.fn().mockResolvedValue({ id_cancha_tipo: 1 }),
        obtenerDisponibilidadPorSede: jest.fn().mockResolvedValue([]),
        obtenerCancha: jest.fn().mockResolvedValue({ id_cancha: 1 }),
        actualizarCancha: jest.fn().mockResolvedValue({ id_cancha: 1 }),
        eliminarCancha: jest.fn().mockResolvedValue({ id_cancha: 1 }),
        obtenerDisponibilidad: jest.fn().mockResolvedValue([]),
      };
      const canchasCtrl = new CanchasController(
        mockCanchasSvc as unknown as CanchasService,
      );
      await canchasCtrl.crear({
        id_sede: 1,
        id_cancha_tipo: 1,
        nombre: 'C1',
        costo_base: 1000,
      });
      await canchasCtrl.listar('1');
      await canchasCtrl.listar(undefined);
      await canchasCtrl.listarTipos(true);
      await canchasCtrl.crearTipo({ descripcion: 'Tenis' });
      await canchasCtrl.actualizarTipo(1, { descripcion: 'Tenis Pro' });
      await canchasCtrl.eliminarTipo(1);
      await canchasCtrl.obtenerDisponibilidadPorSede(1, '2026-11-15', 2);
      await canchasCtrl.obtener(1);
      await canchasCtrl.actualizar(1, { nombre: 'C1 Edit' });
      await canchasCtrl.eliminar(1);
      await canchasCtrl.obtenerDisponibilidad(1, { fecha: '2026-11-15' });
      expect(mockCanchasSvc.crearCancha).toHaveBeenCalled();
    });
  });
});
