import {
  BadRequestException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ReservasClasesService } from '../services/reservas-clases.service';
import { ReservasClasesRepository } from '../repositories/reservas-clases.repository';
import { ListaEsperaRepository } from '../repositories/lista-espera.repository';
import { ListaEsperaSubject } from '../patterns/observer/lista-espera.subject';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { CrearReservaClaseDto } from '../dto/crear-reserva-clase.dto';

interface MockPrismaService {
  membresia: {
    findFirst: jest.Mock;
  };
  claseReserva: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  clase: {
    findUnique: jest.Mock;
  };
  $transaction: jest.Mock;
}

describe('ReservasClasesService', () => {
  let service: ReservasClasesService;
  let mockPrisma: MockPrismaService;
  let mockReservasRepo: Partial<ReservasClasesRepository>;
  let mockListaEsperaRepo: Partial<ListaEsperaRepository>;
  let mockListaEsperaSubject: Partial<ListaEsperaSubject>;

  beforeEach(() => {
    mockReservasRepo = {
      contarReservasConfirmadas: jest.fn(),
      crearReserva: jest.fn(),
      obtenerReservaPorId: jest.fn(),
      actualizarEstadoReserva: jest.fn(),
      obtenerPrimerEnEspera: jest.fn(),
      obtenerReservasPorUsuario: jest.fn(),
    };

    mockListaEsperaRepo = {
      obtenerPrimerInscriptoActivo: jest.fn(),
      actualizarEstadoInscripcion: jest.fn(),
    };

    mockListaEsperaSubject = {
      notify: jest.fn().mockResolvedValue(undefined),
    };

    mockPrisma = {
      membresia: {
        findFirst: jest.fn(),
      },
      claseReserva: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      clase: {
        findUnique: jest.fn(),
      },
      $transaction: jest
        .fn()
        .mockImplementation((callback: (tx: unknown) => Promise<unknown>) =>
          callback(mockPrisma),
        ),
    };

    service = new ReservasClasesService(
      mockPrisma as unknown as PrismaService,
      mockReservasRepo as ReservasClasesRepository,
      mockListaEsperaSubject as ListaEsperaSubject,
      mockListaEsperaRepo as ListaEsperaRepository,
    );
  });

  describe('crearReserva', () => {
    const idUsuario = 100;

    it('debe rechazar fechas inválidas', async () => {
      const dto: CrearReservaClaseDto = {
        id_clase: 1,
        fecha_inicio: 'fecha-invalida',
        fecha_fin: 'otra-invalida',
      };

      await expect(service.crearReserva(dto, idUsuario)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe rechazar si la fecha_fin es anterior o igual a fecha_inicio', async () => {
      const ahora = new Date();
      const fechaInicio = new Date(
        ahora.getTime() + 10 * 3600000,
      ).toISOString();
      const fechaFin = new Date(ahora.getTime() + 9 * 3600000).toISOString();

      const dto: CrearReservaClaseDto = {
        id_clase: 1,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      };

      await expect(service.crearReserva(dto, idUsuario)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe rechazar reservas con más de 48 horas de anticipación', async () => {
      const ahora = new Date();
      const fechaInicio = new Date(
        ahora.getTime() + 50 * 3600000,
      ).toISOString();
      const fechaFin = new Date(ahora.getTime() + 51 * 3600000).toISOString();

      const dto: CrearReservaClaseDto = {
        id_clase: 1,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      };

      await expect(service.crearReserva(dto, idUsuario)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe rechazar reservas de clases en el pasado', async () => {
      const ahora = new Date();
      const fechaInicio = new Date(ahora.getTime() - 2 * 3600000).toISOString();
      const fechaFin = new Date(ahora.getTime() - 1 * 3600000).toISOString();

      const dto: CrearReservaClaseDto = {
        id_clase: 1,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      };

      await expect(service.crearReserva(dto, idUsuario)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe rechazar si el socio no tiene membresía activa o presenta mora (RN-03)', async () => {
      const ahora = new Date();
      const fechaInicio = new Date(ahora.getTime() + 5 * 3600000).toISOString();
      const fechaFin = new Date(ahora.getTime() + 6 * 3600000).toISOString();

      const dto: CrearReservaClaseDto = {
        id_clase: 1,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      };

      mockPrisma.membresia.findFirst.mockResolvedValue(null);

      await expect(service.crearReserva(dto, idUsuario)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe rechazar si el socio ya tiene otra reserva superpuesta en ese horario', async () => {
      const ahora = new Date();
      const fechaInicio = new Date(ahora.getTime() + 5 * 3600000).toISOString();
      const fechaFin = new Date(ahora.getTime() + 6 * 3600000).toISOString();

      const dto: CrearReservaClaseDto = {
        id_clase: 1,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      };

      mockPrisma.membresia.findFirst.mockResolvedValue({ id_membresia: 1 });
      mockPrisma.claseReserva.findFirst.mockResolvedValue({
        id_clase_reserva: 99,
      });

      await expect(service.crearReserva(dto, idUsuario)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe rechazar si la clase no existe en base de datos', async () => {
      const ahora = new Date();
      const fechaInicio = new Date(ahora.getTime() + 5 * 3600000).toISOString();
      const fechaFin = new Date(ahora.getTime() + 6 * 3600000).toISOString();

      const dto: CrearReservaClaseDto = {
        id_clase: 999,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      };

      mockPrisma.membresia.findFirst.mockResolvedValue({ id_membresia: 1 });
      mockPrisma.claseReserva.findFirst.mockResolvedValue(null);
      mockPrisma.clase.findUnique.mockResolvedValue(null);

      await expect(service.crearReserva(dto, idUsuario)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe rechazar si la clase ya alcanzó su capacidad máxima', async () => {
      const ahora = new Date();
      const fechaInicio = new Date(ahora.getTime() + 5 * 3600000).toISOString();
      const fechaFin = new Date(ahora.getTime() + 6 * 3600000).toISOString();

      const dto: CrearReservaClaseDto = {
        id_clase: 1,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      };

      mockPrisma.membresia.findFirst.mockResolvedValue({ id_membresia: 1 });
      mockPrisma.claseReserva.findFirst.mockResolvedValue(null);
      mockPrisma.clase.findUnique.mockResolvedValue({
        id_clase: 1,
        capacidad_maxima: 20,
      });
      (
        mockReservasRepo.contarReservasConfirmadas as jest.Mock
      ).mockResolvedValue(20);

      await expect(service.crearReserva(dto, idUsuario)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe crear exitosamente la reserva confirmada cuando se cumplen todas las reglas', async () => {
      const ahora = new Date();
      const fechaInicio = new Date(ahora.getTime() + 5 * 3600000).toISOString();
      const fechaFin = new Date(ahora.getTime() + 6 * 3600000).toISOString();

      const dto: CrearReservaClaseDto = {
        id_clase: 1,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      };

      const reservaCreada = {
        id_clase_reserva: 10,
        id_clase: 1,
        id_usuario: idUsuario,
        id_clase_reserva_estado: 1,
        fecha_inicio: new Date(fechaInicio),
        fecha_fin: new Date(fechaFin),
      };

      mockPrisma.membresia.findFirst.mockResolvedValue({ id_membresia: 1 });
      mockPrisma.claseReserva.findFirst.mockResolvedValue(null);
      mockPrisma.clase.findUnique.mockResolvedValue({
        id_clase: 1,
        capacidad_maxima: 20,
      });
      (
        mockReservasRepo.contarReservasConfirmadas as jest.Mock
      ).mockResolvedValue(10);
      (mockReservasRepo.crearReserva as jest.Mock).mockResolvedValue(
        reservaCreada,
      );

      const resultado = await service.crearReserva(dto, idUsuario);

      expect(resultado).toEqual(reservaCreada);
      expect(mockReservasRepo.crearReserva).toHaveBeenCalledWith(
        dto,
        idUsuario,
        1,
        expect.anything(),
      );
    });
  });

  describe('cancelarReserva', () => {
    const idUsuario = 100;

    it('debe lanzar NotFoundException si la reserva no existe', async () => {
      mockPrisma.claseReserva.findUnique.mockResolvedValue(null);

      await expect(service.cancelarReserva(999, idUsuario)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar ForbiddenException si la reserva pertenece a otro usuario', async () => {
      mockPrisma.claseReserva.findUnique.mockResolvedValue({
        id_clase_reserva: 1,
        id_usuario: 999, // Otro socio
        id_clase_reserva_estado: 1,
        fecha_inicio: new Date(Date.now() + 5 * 3600000),
      });

      await expect(service.cancelarReserva(1, idUsuario)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe lanzar BadRequestException si la reserva no está en estado confirmada (1)', async () => {
      mockPrisma.claseReserva.findUnique.mockResolvedValue({
        id_clase_reserva: 1,
        id_usuario: idUsuario,
        id_clase_reserva_estado: 4, // Ya cancelada
        fecha_inicio: new Date(Date.now() + 5 * 3600000),
      });

      await expect(service.cancelarReserva(1, idUsuario)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar BadRequestException si la clase ya comenzó o finalizó', async () => {
      mockPrisma.claseReserva.findUnique.mockResolvedValue({
        id_clase_reserva: 1,
        id_usuario: idUsuario,
        id_clase_reserva_estado: 1,
        fecha_inicio: new Date(Date.now() - 3600000), // En el pasado
      });

      await expect(service.cancelarReserva(1, idUsuario)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe cancelar sin penalidad si faltan 2 horas o más para el inicio', async () => {
      const fechaInicio = new Date(Date.now() + 4 * 3600000);
      const fechaFin = new Date(Date.now() + 5 * 3600000);

      mockPrisma.claseReserva.findUnique.mockResolvedValue({
        id_clase_reserva: 1,
        id_clase: 10,
        id_usuario: idUsuario,
        id_clase_reserva_estado: 1,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });

      (mockReservasRepo.actualizarEstadoReserva as jest.Mock).mockResolvedValue(
        {
          id_clase_reserva: 1,
          id_clase_reserva_estado: 4,
        },
      );
      (
        mockListaEsperaRepo.obtenerPrimerInscriptoActivo as jest.Mock
      ).mockResolvedValue(null);
      (mockReservasRepo.obtenerPrimerEnEspera as jest.Mock).mockResolvedValue(
        null,
      );

      const resultado = await service.cancelarReserva(1, idUsuario);

      expect(resultado.penalidadAplicada).toBe(false);
      expect(resultado.cupo_reasignado).toBe(false);
      expect(resultado.mensaje).toContain('sin penalidad');
    });

    it('debe cancelar con penalidad si faltan menos de 2 horas para el inicio', async () => {
      const fechaInicio = new Date(Date.now() + 1 * 3600000); // Faltan 60 min (< 2h)
      const fechaFin = new Date(Date.now() + 2 * 3600000);

      mockPrisma.claseReserva.findUnique.mockResolvedValue({
        id_clase_reserva: 1,
        id_clase: 10,
        id_usuario: idUsuario,
        id_clase_reserva_estado: 1,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });

      (mockReservasRepo.actualizarEstadoReserva as jest.Mock).mockResolvedValue(
        {
          id_clase_reserva: 1,
          id_clase_reserva_estado: 4,
        },
      );
      (
        mockListaEsperaRepo.obtenerPrimerInscriptoActivo as jest.Mock
      ).mockResolvedValue(null);
      (mockReservasRepo.obtenerPrimerEnEspera as jest.Mock).mockResolvedValue(
        null,
      );

      const resultado = await service.cancelarReserva(1, idUsuario);

      expect(resultado.penalidadAplicada).toBe(true);
      expect(resultado.mensaje).toContain('con penalidad');
    });

    it('debe reasignar vacante promoviendo al primer socio de clase_lista_espera y notificar', async () => {
      const fechaInicio = new Date(Date.now() + 4 * 3600000);
      const fechaFin = new Date(Date.now() + 5 * 3600000);

      mockPrisma.claseReserva.findUnique.mockResolvedValue({
        id_clase_reserva: 1,
        id_clase: 10,
        id_usuario: idUsuario,
        id_clase_reserva_estado: 1,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });

      (mockReservasRepo.actualizarEstadoReserva as jest.Mock).mockResolvedValue(
        {
          id_clase_reserva: 1,
          id_clase_reserva_estado: 4,
        },
      );

      // Socio esperando en lista de espera
      (
        mockListaEsperaRepo.obtenerPrimerInscriptoActivo as jest.Mock
      ).mockResolvedValue({
        id_clase_lista_espera: 50,
        id_clase: 10,
        id_usuario: 200,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });

      const resultado = await service.cancelarReserva(1, idUsuario);

      expect(resultado.cupo_reasignado).toBe(true);
      expect(mockReservasRepo.crearReserva).toHaveBeenCalledWith(
        {
          id_clase: 10,
          fecha_inicio: fechaInicio.toISOString(),
          fecha_fin: fechaFin.toISOString(),
        },
        200,
        1,
        expect.anything(),
      );
      expect(
        mockListaEsperaRepo.actualizarEstadoInscripcion,
      ).toHaveBeenCalledWith(50, 2, expect.anything());
      expect(mockListaEsperaSubject.notify).toHaveBeenCalledWith({
        id_clase: 10,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        id_usuario_promovido: 200,
      });
    });

    it('debe soportar fallback de promoción desde clase_reserva con estado 2', async () => {
      const fechaInicio = new Date(Date.now() + 4 * 3600000);
      const fechaFin = new Date(Date.now() + 5 * 3600000);

      mockPrisma.claseReserva.findUnique.mockResolvedValue({
        id_clase_reserva: 1,
        id_clase: 10,
        id_usuario: idUsuario,
        id_clase_reserva_estado: 1,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });

      (mockReservasRepo.actualizarEstadoReserva as jest.Mock).mockResolvedValue(
        {
          id_clase_reserva: 1,
          id_clase_reserva_estado: 4,
        },
      );

      (
        mockListaEsperaRepo.obtenerPrimerInscriptoActivo as jest.Mock
      ).mockResolvedValue(null);

      (mockReservasRepo.obtenerPrimerEnEspera as jest.Mock).mockResolvedValue({
        id_clase_reserva: 77,
        id_usuario: 300,
      });

      const resultado = await service.cancelarReserva(1, idUsuario);

      expect(resultado.cupo_reasignado).toBe(true);
      expect(mockReservasRepo.actualizarEstadoReserva).toHaveBeenCalledWith(
        77,
        1,
        expect.anything(),
      );
      expect(mockListaEsperaSubject.notify).toHaveBeenCalledWith({
        id_clase: 10,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        id_usuario_promovido: 300,
      });
    });
  });

  describe('obtenerMisReservas', () => {
    it('debe devolver la lista de reservas mapeada a strings ISO y estado legible', async () => {
      const fechaInicio = new Date('2026-10-12T21:00:00.000Z');
      const fechaFin = new Date('2026-10-12T22:00:00.000Z');

      (
        mockReservasRepo.obtenerReservasPorUsuario as jest.Mock
      ).mockResolvedValue([
        {
          id_clase_reserva: 1,
          id_clase: 10,
          id_usuario: 100,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          id_clase_reserva_estado: 1,
          clase_reserva_estado: {
            descripcion: 'Confirmada',
          },
          clase: {
            nombre: 'Spinning Pro',
          },
        },
      ]);

      const resultado = await service.obtenerMisReservas(100, '2026-10-12');

      expect(resultado).toHaveLength(1);
      expect(resultado[0]).toEqual({
        id_clase_reserva: 1,
        id_clase: 10,
        id_usuario: 100,
        fecha_inicio: '2026-10-12T21:00:00.000Z',
        fecha_fin: '2026-10-12T22:00:00.000Z',
        id_clase_reserva_estado: 1,
        estado: 'CONFIRMADA',
        nombre_clase: 'Spinning Pro',
      });
      expect(mockReservasRepo.obtenerReservasPorUsuario).toHaveBeenCalledWith(
        100,
        expect.any(Date),
        expect.any(Date),
      );
    });
  });
});
