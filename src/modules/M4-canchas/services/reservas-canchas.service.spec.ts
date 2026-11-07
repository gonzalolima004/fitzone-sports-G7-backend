import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReservasCanchasService } from './reservas-canchas.service';
import { ReservasCanchasRepository } from '../repositories/reservas-canchas.repository';
import { CanchasRepository } from '../repositories/canchas.repository';
import { PrecioContextService } from './precio-context.service';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { SedeService } from '../../M0-sedes/services/sede.service';
import { CanchasRealtimeService } from './canchas-realtime.service';
import { Prisma } from '@prisma/client';

describe('ReservasCanchasService', () => {
  let service: ReservasCanchasService;
  let reservasRepo: Partial<jest.Mocked<ReservasCanchasRepository>>;
  let canchasRepo: Partial<jest.Mocked<CanchasRepository>>;
  let precioContext: Partial<jest.Mocked<PrecioContextService>>;
  let prismaMock: {
    canchaMantenimiento: { findFirst: jest.Mock };
    membresia: { findFirst: jest.Mock };
  };
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
      obtenerDatosUsuarioParaCotizacion: jest.fn().mockResolvedValue({
        id_usuario: 5,
        id_sede: 3,
        sede: { id_sede: 3, id_ciudad: 1 },
        usuario_rol: [{ rol: { id_rol: 2, nombre: 'socio' } }],
        membresia: [
          {
            id_usuario: 5,
            id_membresia_plan: 1,
            id_membresia_estado: 1,
            fecha_inicio: new Date('2026-01-01'),
            fecha_fin: new Date('2026-12-31'),
            membresia_estado: {
              id_membresia_estado: 1,
              descripcion: 'Activa',
            },
          },
        ],
      }),
    };

    precioContext = {
      calcularPrecioFinal: jest.fn().mockReturnValue({
        costo_base: 10000,
        descuento_porcentaje: 15,
        es_horario_pico: false,
        precio_congelado: 8500,
      }),
    };

    prismaMock = {
      canchaMantenimiento: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      membresia: {
        findFirst: jest.fn().mockResolvedValue({
          id_membresia: 1,
          id_usuario: 5,
          id_membresia_estado: 1,
          fecha_fin: new Date('2026-12-31'),
        }),
      },
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
      precioContext as unknown as PrecioContextService,
      prismaMock as unknown as PrismaService,
      sedeService as unknown as SedeService,
      canchasRealtime as unknown as CanchasRealtimeService,
    );
  });

  it('debe crear la reserva y notificar vía Realtime Broadcast en el canal de la sede', async () => {
    const dto = {
      id_cancha: 1,
      fecha_inicio: '2026-11-20T18:00:00.000Z',
      fecha_fin: '2026-11-20T19:00:00.000Z',
    };
    const idUsuario = 5;

    const resultado = await service.crearReserva(dto, idUsuario);

    expect(resultado).toBeDefined();
    expect(reservasRepo.obtenerIdEstadoPorDescripcion).toHaveBeenCalledWith(
      'Pendiente de Pago',
    );
    expect(reservasRepo.crearReservaTransaccional).toHaveBeenCalledTimes(1);
    expect(reservasRepo.crearReservaTransaccional).toHaveBeenCalledWith(
      expect.objectContaining({
        id_cancha_reserva_estado: 99,
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
});
