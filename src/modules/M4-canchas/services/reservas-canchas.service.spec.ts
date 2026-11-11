import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReservasCanchasService } from './reservas-canchas.service';
import { ReservasCanchasRepository } from '../repositories/reservas-canchas.repository';
import { CanchasRepository } from '../repositories/canchas.repository';
import { SedeService } from '../../M0-sedes/services/sede.service';
import { CanchasRealtimeService } from './canchas-realtime.service';
import { CanchasService } from './canchas.service';
import { Prisma } from '@prisma/client';

describe('ReservasCanchasService', () => {
  let service: ReservasCanchasService;
  let reservasRepo: Partial<jest.Mocked<ReservasCanchasRepository>>;
  let canchasRepo: Partial<jest.Mocked<CanchasRepository>>;
  let canchasService: Partial<jest.Mocked<CanchasService>>;
  let sedeService: Partial<jest.Mocked<SedeService>>;
  let canchasRealtime: Partial<jest.Mocked<CanchasRealtimeService>>;

  const mockCancha = {
    id_cancha: 1,
    nombre: 'Cancha Pádel 1',
    costo_base: new Prisma.Decimal('10000'),
    activo: true,
    disponible: true,
    id_cancha_tipo: 1,
    id_sede: 3,
    sede: { id_sede: 3, id_ciudad: 1 },
    cancha_tipo: { id_cancha_tipo: 1, descripcion: 'Pádel' },
  };

  beforeEach(() => {
    reservasRepo = {
      crearReservaTransaccional: jest.fn().mockResolvedValue({
        id_cancha_reserva: 101,
        id_cancha: 1,
        id_usuario: 5,
        id_cancha_reserva_estado: 99,
        fecha_inicio: new Date('2026-11-20T18:00:00.000Z'),
        fecha_fin: new Date('2026-11-20T19:00:00.000Z'),
        descuento_porcentaje: new Prisma.Decimal('15'),
        es_horario_pico: false,
        precio_congelado: new Prisma.Decimal('8500'),
      }),
      obtenerMantenimientosPorFecha: jest.fn().mockResolvedValue([]),
      obtenerPorId: jest.fn(),
      obtenerIdEstadoPorDescripcion: jest.fn().mockResolvedValue(99),
    };

    canchasRepo = {
      obtenerPorId: jest.fn().mockResolvedValue(mockCancha),
    };

    canchasService = {
      cotizarTurno: jest.fn().mockResolvedValue({
        costo_base: 10000,
        descuento_porcentaje: 15,
        monto_descuento: 1500,
        es_horario_pico: false,
        monto_recargo_pico: 0,
        precio_final: 8500,
        es_socio: true,
        aplica_descuento_socio: true,
        motivo_sin_descuento: null,
      }),
    };

    sedeService = {
      getHorarioOperativo: jest.fn().mockResolvedValue({
        abierto: true,
        hora_apertura: '08:00',
        hora_cierre: '23:00',
      }),
    };

    canchasRealtime = {
      notificarTurnoReservado: jest.fn().mockResolvedValue(undefined),
    };

    service = new ReservasCanchasService(
      reservasRepo as unknown as ReservasCanchasRepository,
      canchasRepo as unknown as CanchasRepository,
      sedeService as unknown as SedeService,
      canchasService as unknown as CanchasService,
      canchasRealtime as unknown as CanchasRealtimeService,
    );
  });

  describe('crearReserva', () => {
    it('debe crear la reserva y notificar vía Realtime Broadcast en el canal de la sede', async () => {
      const dto = {
        id_cancha: 1,
        fecha_inicio: '2026-11-20T18:00:00.000Z',
        fecha_fin: '2026-11-20T19:00:00.000Z',
      };
      const idUsuario = 5;

      const resultado = await service.crearReserva(dto, idUsuario);

      expect(resultado).toBeDefined();
      expect(canchasService.cotizarTurno).toHaveBeenCalledWith(
        {
          canchaId: 1,
          fecha: '2026-11-20',
          hora: '18:00',
        },
        5,
      );
      expect(reservasRepo.obtenerIdEstadoPorDescripcion).toHaveBeenCalledWith(
        'Pendiente de Pago',
      );
      expect(reservasRepo.crearReservaTransaccional).toHaveBeenCalledTimes(1);
      expect(reservasRepo.crearReservaTransaccional).toHaveBeenCalledWith(
        expect.objectContaining({
          id_cancha_reserva_estado: 99,
          precio_congelado: 8500,
          descuento_porcentaje: 15,
        }),
      );

      expect(canchasRealtime.notificarTurnoReservado).toHaveBeenCalledTimes(1);
      expect(canchasRealtime.notificarTurnoReservado).toHaveBeenCalledWith(
        3, // id_sede de la cancha
        {
          id_cancha: 1,
          fecha: '2026-11-20',
          hora_inicio: '18:00',
          hora_fin: '19:00',
        },
      );
    });

    it('debe lanzar NotFoundException si la cancha no existe', async () => {
      (canchasRepo.obtenerPorId as jest.Mock).mockResolvedValue(null);

      await expect(
        service.crearReserva(
          {
            id_cancha: 99,
            fecha_inicio: '2026-11-20T18:00:00.000Z',
            fecha_fin: '2026-11-20T19:00:00.000Z',
          },
          5,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(canchasRealtime.notificarTurnoReservado).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si la duración no es de 60 minutos', async () => {
      await expect(
        service.crearReserva(
          {
            id_cancha: 1,
            fecha_inicio: '2026-11-20T18:00:00.000Z',
            fecha_fin: '2026-11-20T19:30:00.000Z', // 90 min
          },
          5,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(canchasRealtime.notificarTurnoReservado).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si el turno no comienza en punto (minutos !== 00)', async () => {
      await expect(
        service.crearReserva(
          {
            id_cancha: 1,
            fecha_inicio: '2026-11-20T18:15:00.000Z',
            fecha_fin: '2026-11-20T19:15:00.000Z',
          },
          5,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Los turnos deben comenzar en punto (ej: 16:00, 17:00).',
        ),
      );

      expect(canchasRealtime.notificarTurnoReservado).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si el turno cruza la medianoche o abarca días operativos distintos', async () => {
      await expect(
        service.crearReserva(
          {
            id_cancha: 1,
            fecha_inicio: '2026-11-20T23:00:00.000Z',
            fecha_fin: '2026-11-21T00:00:00.000Z',
          },
          5,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'El turno debe comenzar y terminar en el mismo día operativo.',
        ),
      );

      expect(canchasRealtime.notificarTurnoReservado).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si la sede se encuentra cerrada por feriado o calendario', async () => {
      (sedeService.getHorarioOperativo as jest.Mock).mockResolvedValue({
        abierto: false,
        hora_apertura: '00:00',
        hora_cierre: '00:00',
        motivo_cierre: 'Sede cerrada por feriado nacional',
      });

      await expect(
        service.crearReserva(
          {
            id_cancha: 1,
            fecha_inicio: '2026-11-20T18:00:00.000Z',
            fecha_fin: '2026-11-20T19:00:00.000Z',
          },
          5,
        ),
      ).rejects.toThrow(
        new BadRequestException('Sede cerrada por feriado nacional'),
      );

      expect(canchasRealtime.notificarTurnoReservado).not.toHaveBeenCalled();
    });

    it('debe propagar ConflictException (409) cuando el repositorio detecta colisión o solapamiento horario (RN-02)', async () => {
      (reservasRepo.crearReservaTransaccional as jest.Mock).mockRejectedValue(
        new ConflictException(
          'La cancha acaba de ser reservada en este horario por otro usuario.',
        ),
      );

      await expect(
        service.crearReserva(
          {
            id_cancha: 1,
            fecha_inicio: '2026-11-20T18:00:00.000Z',
            fecha_fin: '2026-11-20T19:00:00.000Z',
          },
          5,
        ),
      ).rejects.toThrow(ConflictException);

      expect(canchasRealtime.notificarTurnoReservado).not.toHaveBeenCalled();
    });
  });

  describe('obtenerReservaPorId', () => {
    const mockReservaDetalle = {
      id_cancha_reserva: 101,
      id_cancha: 1,
      id_usuario: 5,
      id_cancha_reserva_estado: 1,
      fecha_inicio: new Date('2026-11-20T18:00:00.000Z'),
      fecha_fin: new Date('2026-11-20T19:00:00.000Z'),
      precio_congelado: new Prisma.Decimal('8500'),
      descuento_porcentaje: new Prisma.Decimal('15'),
      es_horario_pico: false,
      cancha: {
        id_cancha: 1,
        nombre: 'Cancha Pádel 1',
        costo_base: new Prisma.Decimal('10000'),
        id_sede: 3,
        id_cancha_tipo: 1,
        activo: true,
        disponible: true,
      },
    };

    it('debe retornar la reserva mapeando los campos Decimal a number si el usuario es el dueño', async () => {
      (reservasRepo.obtenerPorId as jest.Mock).mockResolvedValue(
        mockReservaDetalle,
      );

      const usuarioAuth = {
        id_usuario: 5,
        supabase_user_id: 'sub-5',
        email: 'socio@fitzone.com',
        rol: 'socio',
        roles: ['socio'],
      };

      const resultado = await service.obtenerReservaPorId(101, usuarioAuth);

      expect(reservasRepo.obtenerPorId).toHaveBeenCalledWith(101);
      expect(resultado.precio_congelado).toBe(8500);
      expect(resultado.descuento_porcentaje).toBe(15);
      expect(resultado.cancha?.costo_base).toBe(10000);
    });

    it('debe permitir a un usuario con rol staff consultar la reserva de otro usuario', async () => {
      (reservasRepo.obtenerPorId as jest.Mock).mockResolvedValue(
        mockReservaDetalle,
      );

      const staffAuth = {
        id_usuario: 99,
        supabase_user_id: 'sub-staff',
        email: 'gerente@fitzone.com',
        rol: 'gerente',
        roles: ['gerente'],
      };

      const resultado = await service.obtenerReservaPorId(101, staffAuth);

      expect(resultado.id_cancha_reserva).toBe(101);
    });

    it('debe lanzar ForbiddenException si un usuario regular intenta consultar la reserva de otro usuario', async () => {
      (reservasRepo.obtenerPorId as jest.Mock).mockResolvedValue(
        mockReservaDetalle,
      );

      const otroUsuario = {
        id_usuario: 88,
        supabase_user_id: 'sub-88',
        email: 'otro@fitzone.com',
        rol: 'socio',
        roles: ['socio'],
      };

      await expect(
        service.obtenerReservaPorId(101, otroUsuario),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar NotFoundException si la reserva no existe', async () => {
      (reservasRepo.obtenerPorId as jest.Mock).mockResolvedValue(null);

      await expect(service.obtenerReservaPorId(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
