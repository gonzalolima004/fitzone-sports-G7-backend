import { BadRequestException } from '@nestjs/common';
import { SedeService } from './modules/M0-sedes/services/sede.service';
import { SedeRepository } from './modules/M0-sedes/repositories/sede.repository';
import { CiudadRepository } from './modules/M0-sedes/repositories/ciudad.repository';
import { CanchasService } from './modules/M4-canchas/services/canchas.service';
import { CanchasRepository } from './modules/M4-canchas/repositories/canchas.repository';
import { ReservasCanchasRepository } from './modules/M4-canchas/repositories/reservas-canchas.repository';
import { ReservasCanchasService } from './modules/M4-canchas/services/reservas-canchas.service';
import { PrecioContextService } from './modules/M4-canchas/services/precio-context.service';
import { PrismaService } from './database/prisma-service/prisma.service';

describe('Calendario operativo: límites e integración', () => {
  const sedeRepo = {
    findById: jest.fn().mockResolvedValue({ id_sede: 1 }),
    findHorarioOperativo: jest.fn(),
  };
  const sede = new SedeService(
    sedeRepo as unknown as SedeRepository,
    {} as CiudadRepository,
  );

  it.each(['', '2026-02-30', '2026-13-01', '2026-10-14T10:00:00Z'])(
    'rechaza fecha inválida %s',
    async (fecha) => {
      await expect(sede.getHorarioOperativo(1, fecha)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    },
  );
  it('prioriza cierre excepcional sobre horario semanal', async () => {
    sedeRepo.findHorarioOperativo.mockResolvedValue({
      excepcion: { cerrado: true, motivo: 'Feriado' },
      horarioBase: { abierto: true },
    });
    expect(await sede.getHorarioOperativo(1, '2026-10-14')).toMatchObject({
      abierto: false,
      motivo_cierre: 'Feriado',
    });
  });
  it('usa horario especial sobre el semanal', async () => {
    sedeRepo.findHorarioOperativo.mockResolvedValue({
      excepcion: {
        cerrado: false,
        hora_apertura: '10:30',
        hora_cierre: '13:30',
      },
      horarioBase: { abierto: false },
    });
    expect(await sede.getHorarioOperativo(1, '2026-10-14')).toMatchObject({
      abierto: true,
      hora_apertura: '10:30',
      hora_cierre: '13:30',
    });
  });
  it('solo ofrece turnos completos y en punto dentro de un horario con minutos', async () => {
    const canchas = {
      obtenerPorId: jest.fn().mockResolvedValue({ activo: true, id_sede: 1 }),
    };
    const reservas = {
      obtenerReservasPorFecha: jest.fn().mockResolvedValue([]),
      obtenerMantenimientosPorFecha: jest.fn().mockResolvedValue([]),
    };
    const servicio = new CanchasService(
      canchas as unknown as CanchasRepository,
      reservas as unknown as ReservasCanchasRepository,
      sede,
    );
    sedeRepo.findHorarioOperativo.mockResolvedValue({
      excepcion: {
        cerrado: false,
        hora_apertura: '08:30',
        hora_cierre: '11:30',
      },
      horarioBase: null,
    });
    const slots = await servicio.obtenerDisponibilidad(1, '2026-10-14');
    expect(slots.map((s) => [s.horaInicio, s.horaFin])).toEqual([
      ['09:00', '10:00'],
      ['10:00', '11:00'],
    ]);
    sedeRepo.findHorarioOperativo.mockResolvedValue({
      excepcion: { cerrado: true },
      horarioBase: null,
    });
    expect(await servicio.obtenerDisponibilidad(1, '2026-10-14')).toEqual([]);
  });
  it('rechaza un turno que cruza medianoche antes de escribir una reserva', async () => {
    const canchas = {
      obtenerPorId: jest.fn().mockResolvedValue({ activo: true, id_sede: 1 }),
    };
    const reservas = { crearReservaTransaccional: jest.fn() };
    const servicio = new ReservasCanchasService(
      reservas as unknown as ReservasCanchasRepository,
      canchas as unknown as CanchasRepository,
      {} as PrecioContextService,
      {} as PrismaService,
      sede,
    );
    await expect(
      servicio.crearReserva(
        {
          id_cancha: 1,
          fecha_inicio: '2026-10-14T23:00:00Z',
          fecha_fin: '2026-10-15T00:00:00Z',
        },
        1,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(reservas.crearReservaTransaccional).not.toHaveBeenCalled();
  });
});
