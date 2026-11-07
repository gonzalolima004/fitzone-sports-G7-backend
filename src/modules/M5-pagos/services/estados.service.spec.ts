import { EstadosService } from './estados.service';
import { PrismaService } from '../../../database/prisma-service/prisma.service';

describe('EstadosService', () => {
  let prisma: {
    pagoEstado: { findFirst: jest.Mock; create: jest.Mock };
    membresiaEstado: { findFirst: jest.Mock; create: jest.Mock };
    canchaReservaEstado: { findFirst: jest.Mock; create: jest.Mock };
  };
  let service: EstadosService;

  beforeEach(() => {
    prisma = {
      pagoEstado: { findFirst: jest.fn(), create: jest.fn() },
      membresiaEstado: { findFirst: jest.fn(), create: jest.fn() },
      canchaReservaEstado: { findFirst: jest.fn(), create: jest.fn() },
    };
    service = new EstadosService(prisma as unknown as PrismaService);
  });

  it('resuelve el ID por descripción (insensible a mayúsculas) y lo cachea', async () => {
    prisma.pagoEstado.findFirst.mockResolvedValue({
      id_pago_estado: 7,
      descripcion: 'Pendiente',
    });

    expect(await service.getPagoPendienteId()).toBe(7);
    expect(await service.getPagoPendienteId()).toBe(7);

    expect(prisma.pagoEstado.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.pagoEstado.findFirst).toHaveBeenCalledWith({
      where: { descripcion: { equals: 'Pendiente', mode: 'insensitive' } },
    });
  });

  it('crea el estado si no existe', async () => {
    prisma.membresiaEstado.findFirst.mockResolvedValue(null);
    prisma.membresiaEstado.create.mockResolvedValue({
      id_membresia_estado: 9,
    });

    expect(await service.getMembresiaSuspendidaId()).toBe(9);
    expect(prisma.membresiaEstado.create).toHaveBeenCalledWith({
      data: { descripcion: 'Suspendida' },
    });
  });

  it('resuelve estados de reserva de cancha', async () => {
    prisma.canchaReservaEstado.findFirst.mockResolvedValue({
      id_cancha_reserva_estado: 3,
    });
    expect(await service.getReservaConfirmadaId()).toBe(3);
  });
});
