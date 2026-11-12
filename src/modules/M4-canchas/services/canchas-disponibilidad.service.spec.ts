import { CanchasDisponibilidadService } from './canchas-disponibilidad.service';
import { CanchasRepository } from '../repositories/canchas.repository';
import { ReservasCanchasRepository } from '../repositories/reservas-canchas.repository';
import { SedeService } from '../../M0-sedes/services/sede.service';
import { SlotEstado } from '../dto/disponibilidad-slot-response.dto';
import {
  Cancha,
  CanchaMantenimiento,
  CanchaReserva,
  Prisma,
} from '@prisma/client';

describe('CanchasDisponibilidadService', () => {
  let service: CanchasDisponibilidadService;
  let canchasRepository: Partial<jest.Mocked<CanchasRepository>>;
  let reservasRepository: Partial<jest.Mocked<ReservasCanchasRepository>>;
  let sedeService: Partial<jest.Mocked<SedeService>>;

  const mockCancha = {
    id_cancha: 1,
    nombre: 'Cancha Pádel 1',
    costo_base: new Prisma.Decimal('10000'),
    activo: true,
    disponible: true,
    id_cancha_tipo: 1,
    id_sede: 10,
    sede: {
      id_sede: 10,
      nombre: 'Sede Central',
      direccion: 'Av. Corrientes 1234',
      id_ciudad: 1,
      aforo_maximo: 100,
      activo: true,
    },
    cancha_tipo: {
      id_cancha_tipo: 1,
      descripcion: 'Pádel',
      activo: true,
    },
  };

  beforeEach(() => {
    canchasRepository = {
      obtenerPorId: jest.fn().mockResolvedValue(mockCancha),
      obtenerCanchasParaGrilla: jest.fn(),
    };

    reservasRepository = {
      obtenerReservasPorFecha: jest.fn().mockResolvedValue([]),
      obtenerMantenimientosPorFecha: jest.fn().mockResolvedValue([]),
      obtenerReservasPorCanchasYFecha: jest.fn().mockResolvedValue([]),
      obtenerMantenimientosPorCanchasYFecha: jest.fn().mockResolvedValue([]),
    };

    sedeService = {
      getHorarioOperativo: jest.fn().mockResolvedValue({
        abierto: true,
        hora_apertura: '08:00',
        hora_cierre: '12:00',
      }),
    };

    service = new CanchasDisponibilidadService(
      canchasRepository as unknown as CanchasRepository,
      reservasRepository as unknown as ReservasCanchasRepository,
      sedeService as unknown as SedeService,
    );
  });

  describe('obtenerDisponibilidad', () => {
    it('debe generar slots exactos de 60 minutos entre hora_apertura y hora_cierre', async () => {
      const fecha = '2026-11-20';

      const slots = await service.obtenerDisponibilidad(1, fecha);

      expect(canchasRepository.obtenerPorId).toHaveBeenCalledWith(1);
      expect(sedeService.getHorarioOperativo).toHaveBeenCalledWith(10, fecha);
      expect(reservasRepository.obtenerReservasPorFecha).toHaveBeenCalledTimes(
        1,
      );
      expect(
        reservasRepository.obtenerMantenimientosPorFecha,
      ).toHaveBeenCalledTimes(1);

      expect(slots).toEqual([
        {
          horaInicio: '08:00',
          horaFin: '09:00',
          estado: SlotEstado.DISPONIBLE,
        },
        {
          horaInicio: '09:00',
          horaFin: '10:00',
          estado: SlotEstado.DISPONIBLE,
        },
        {
          horaInicio: '10:00',
          horaFin: '11:00',
          estado: SlotEstado.DISPONIBLE,
        },
        {
          horaInicio: '11:00',
          horaFin: '12:00',
          estado: SlotEstado.DISPONIBLE,
        },
      ]);
    });

    it('debe redondear al inicio de la siguiente hora en punto si la apertura es fraccionada (ej: 08:30 a 09:00)', async () => {
      (sedeService.getHorarioOperativo as jest.Mock).mockResolvedValue({
        abierto: true,
        hora_apertura: '08:30',
        hora_cierre: '12:00',
      });

      const slots = await service.obtenerDisponibilidad(1, '2026-11-20');

      expect(slots).toEqual([
        {
          horaInicio: '09:00',
          horaFin: '10:00',
          estado: SlotEstado.DISPONIBLE,
        },
        {
          horaInicio: '10:00',
          horaFin: '11:00',
          estado: SlotEstado.DISPONIBLE,
        },
        {
          horaInicio: '11:00',
          horaFin: '12:00',
          estado: SlotEstado.DISPONIBLE,
        },
      ]);
    });

    it('debe retornar un arreglo vacío si la sede se encuentra cerrada', async () => {
      (sedeService.getHorarioOperativo as jest.Mock).mockResolvedValue({
        abierto: false,
        hora_apertura: '00:00',
        hora_cierre: '00:00',
        motivo_cierre: 'Feriado nacional',
      });

      const slots = await service.obtenerDisponibilidad(1, '2026-11-20');

      expect(slots).toEqual([]);
      expect(reservasRepository.obtenerReservasPorFecha).not.toHaveBeenCalled();
      expect(
        reservasRepository.obtenerMantenimientosPorFecha,
      ).not.toHaveBeenCalled();
    });

    it('debe marcar los slots correspondientes como RESERVADO o MANTENIMIENTO cuando colisionan con bloqueos', async () => {
      const mockReserva: CanchaReserva = {
        id_cancha_reserva: 101,
        id_cancha: 1,
        id_usuario: 5,
        id_cancha_reserva_estado: 1,
        fecha_inicio: new Date('2026-11-20T09:00:00.000Z'),
        fecha_fin: new Date('2026-11-20T10:00:00.000Z'),
        precio_congelado: new Prisma.Decimal('10000'),
        descuento_porcentaje: new Prisma.Decimal('0'),
        es_horario_pico: false,
      };

      const mockMantenimiento: CanchaMantenimiento = {
        id_cancha_mantenimiento: 201,
        id_cancha: 1,
        fecha_inicio: new Date('2026-11-20T10:00:00.000Z'),
        fecha_fin: new Date('2026-11-20T11:00:00.000Z'),
        motivo: 'Limpieza profunda de alfombra',
      };

      (
        reservasRepository.obtenerReservasPorFecha as jest.Mock
      ).mockResolvedValue([mockReserva]);
      (
        reservasRepository.obtenerMantenimientosPorFecha as jest.Mock
      ).mockResolvedValue([mockMantenimiento]);

      const slots = await service.obtenerDisponibilidad(1, '2026-11-20');

      expect(slots).toEqual([
        {
          horaInicio: '08:00',
          horaFin: '09:00',
          estado: SlotEstado.DISPONIBLE,
        },
        { horaInicio: '09:00', horaFin: '10:00', estado: SlotEstado.RESERVADO },
        {
          horaInicio: '10:00',
          horaFin: '11:00',
          estado: SlotEstado.MANTENIMIENTO,
        },
        {
          horaInicio: '11:00',
          horaFin: '12:00',
          estado: SlotEstado.DISPONIBLE,
        },
      ]);
    });
  });

  describe('obtenerDisponibilidadPorSede', () => {
    it('debe generar correctamente la estructura agrupada por cancha en base a los datos simulados', async () => {
      const canchasSede: Cancha[] = [
        {
          id_cancha: 1,
          nombre: 'Cancha Pádel 1',
          costo_base: new Prisma.Decimal('10000'),
          activo: true,
          disponible: true,
          id_cancha_tipo: 1,
          id_sede: 10,
        },
        {
          id_cancha: 2,
          nombre: 'Cancha Tenis 1',
          costo_base: new Prisma.Decimal('15000'),
          activo: true,
          disponible: true,
          id_cancha_tipo: 2,
          id_sede: 10,
        },
      ];

      (
        canchasRepository.obtenerCanchasParaGrilla as jest.Mock
      ).mockResolvedValue(canchasSede);

      (sedeService.getHorarioOperativo as jest.Mock).mockResolvedValue({
        abierto: true,
        hora_apertura: '18:00',
        hora_cierre: '20:00',
      });

      const reservaCancha1: CanchaReserva = {
        id_cancha_reserva: 301,
        id_cancha: 1,
        id_usuario: 8,
        id_cancha_reserva_estado: 1,
        fecha_inicio: new Date('2026-11-20T18:00:00.000Z'),
        fecha_fin: new Date('2026-11-20T19:00:00.000Z'),
        precio_congelado: new Prisma.Decimal('10000'),
        descuento_porcentaje: new Prisma.Decimal('0'),
        es_horario_pico: false,
      };

      const mantenimientoCancha2: CanchaMantenimiento = {
        id_cancha_mantenimiento: 401,
        id_cancha: 2,
        fecha_inicio: new Date('2026-11-20T19:00:00.000Z'),
        fecha_fin: new Date('2026-11-20T20:00:00.000Z'),
        motivo: 'Reparación de red',
      };

      (
        reservasRepository.obtenerReservasPorCanchasYFecha as jest.Mock
      ).mockResolvedValue([reservaCancha1]);
      (
        reservasRepository.obtenerMantenimientosPorCanchasYFecha as jest.Mock
      ).mockResolvedValue([mantenimientoCancha2]);

      const resultado = await service.obtenerDisponibilidadPorSede(
        10,
        '2026-11-20',
      );

      expect(canchasRepository.obtenerCanchasParaGrilla).toHaveBeenCalledWith(
        10,
        undefined,
      );
      expect(resultado).toEqual({
        horario: {
          abierto: true,
          hora_apertura: '18:00',
          hora_cierre: '20:00',
          motivo_cierre: undefined,
        },
        canchas: [
          {
            id_cancha: 1,
            nombre_cancha: 'Cancha Pádel 1',
            costo_base: 10000,
            slots: [
              {
                horaInicio: '18:00',
                horaFin: '19:00',
                estado: SlotEstado.RESERVADO,
              },
              {
                horaInicio: '19:00',
                horaFin: '20:00',
                estado: SlotEstado.DISPONIBLE,
              },
            ],
          },
          {
            id_cancha: 2,
            nombre_cancha: 'Cancha Tenis 1',
            costo_base: 15000,
            slots: [
              {
                horaInicio: '18:00',
                horaFin: '19:00',
                estado: SlotEstado.DISPONIBLE,
              },
              {
                horaInicio: '19:00',
                horaFin: '20:00',
                estado: SlotEstado.MANTENIMIENTO,
              },
            ],
          },
        ],
      });
    });

    it('debe retornar lista de canchas con slots vacíos cuando la sede está cerrada', async () => {
      const canchasSede: Cancha[] = [
        {
          id_cancha: 1,
          nombre: 'Cancha Pádel 1',
          costo_base: new Prisma.Decimal('10000'),
          activo: true,
          disponible: true,
          id_cancha_tipo: 1,
          id_sede: 10,
        },
      ];

      (
        canchasRepository.obtenerCanchasParaGrilla as jest.Mock
      ).mockResolvedValue(canchasSede);

      (sedeService.getHorarioOperativo as jest.Mock).mockResolvedValue({
        abierto: false,
        hora_apertura: '00:00',
        hora_cierre: '00:00',
        motivo_cierre: 'Cerrado por reformas',
      });

      const resultado = await service.obtenerDisponibilidadPorSede(
        10,
        '2026-11-20',
      );

      expect(resultado).toEqual({
        horario: {
          abierto: false,
          hora_apertura: '00:00',
          hora_cierre: '00:00',
          motivo_cierre: 'Cerrado por reformas',
        },
        canchas: [
          {
            id_cancha: 1,
            nombre_cancha: 'Cancha Pádel 1',
            costo_base: 10000,
            slots: [],
          },
        ],
      });
      expect(
        reservasRepository.obtenerReservasPorCanchasYFecha,
      ).not.toHaveBeenCalled();
      expect(
        reservasRepository.obtenerMantenimientosPorCanchasYFecha,
      ).not.toHaveBeenCalled();
    });
  });
});
