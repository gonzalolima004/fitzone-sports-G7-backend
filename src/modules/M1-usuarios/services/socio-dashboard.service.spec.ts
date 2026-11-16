/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { SocioDashboardService } from './socio-dashboard.service';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { TipoActividadHistorial } from '../dto/historial-query.dto';

describe('SocioDashboardService', () => {
  let service: SocioDashboardService;
  let prisma: {
    canchaReserva: { findMany: jest.Mock; count: jest.Mock };
    claseReserva: { findMany: jest.Mock; count: jest.Mock };
    membresia: { findFirst: jest.Mock };
  };

  const idUsuario = 10;

  beforeEach(async () => {
    prisma = {
      canchaReserva: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      claseReserva: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      membresia: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocioDashboardService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<SocioDashboardService>(SocioDashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('obtenerHistorial', () => {
    it('debería consultar solo reservas de cancha cuando el filtro es tipo: canchas', async () => {
      prisma.canchaReserva.findMany.mockResolvedValue([
        {
          id_cancha_reserva: 1,
          fecha_inicio: new Date('2026-11-20T10:00:00Z'),
          fecha_fin: new Date('2026-11-20T11:00:00Z'),
          precio_congelado: 5000,
          cancha: {
            nombre: 'Cancha 1',
            cancha_tipo: { descripcion: 'Fútbol 5' },
            sede: { id_sede: 1, nombre: 'Sede Norte', direccion: 'Calle 1' },
          },
          cancha_reserva_estado: { descripcion: 'Confirmada' },
        },
      ]);

      const result = await service.obtenerHistorial(idUsuario, {
        tipo: TipoActividadHistorial.CANCHAS,
        page: 1,
        limit: 10,
      });

      expect(prisma.canchaReserva.findMany).toHaveBeenCalled();
      const llamadasCancha: unknown[][] =
        prisma.canchaReserva.findMany.mock.calls;
      expect(llamadasCancha.length).toBe(1);
      const primerArgCancha = llamadasCancha[0][0] as {
        where?: { id_usuario?: number };
      };
      expect(primerArgCancha?.where?.id_usuario).toBe(idUsuario);
      expect(prisma.claseReserva.findMany).not.toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].tipo).toBe('cancha');
      expect(result.items[0].precio).toBe(5000);
      expect(result.meta.total).toBe(1);
    });

    it('debería consultar solo clases cuando el filtro es tipo: clases', async () => {
      prisma.claseReserva.findMany.mockResolvedValue([
        {
          id_clase_reserva: 5,
          fecha_inicio: new Date('2026-11-21T18:00:00Z'),
          fecha_fin: new Date('2026-11-21T19:00:00Z'),
          clase: {
            nombre: 'Spinning',
            profesor: 'Juan Carlos',
            sala: 'Sala B',
            sede: { id_sede: 2, nombre: 'Sede Sur', direccion: 'Av 2' },
          },
          clase_reserva_estado: { descripcion: 'Confirmada' },
        },
      ]);

      const result = await service.obtenerHistorial(idUsuario, {
        tipo: TipoActividadHistorial.CLASES,
        page: 1,
        limit: 10,
      });

      expect(prisma.canchaReserva.findMany).not.toHaveBeenCalled();
      expect(prisma.claseReserva.findMany).toHaveBeenCalled();
      const llamadasClase: unknown[][] =
        prisma.claseReserva.findMany.mock.calls;
      expect(llamadasClase.length).toBe(1);
      const primerArgClase = llamadasClase[0][0] as {
        where?: { id_usuario?: number };
      };
      expect(primerArgClase?.where?.id_usuario).toBe(idUsuario);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].tipo).toBe('clase');
      expect(result.items[0].subtitulo).toBe('Juan Carlos - Sala B');
    });

    it('debería unificar y ordenar cronológicamente de forma descendente cuando tipo es todas', async () => {
      prisma.canchaReserva.findMany.mockResolvedValue([
        {
          id_cancha_reserva: 1,
          fecha_inicio: new Date('2026-11-10T10:00:00Z'), // Antigua
          fecha_fin: new Date('2026-11-10T11:00:00Z'),
          precio_congelado: 3000,
          cancha: {
            nombre: 'Cancha Pádel',
            cancha_tipo: { descripcion: 'Pádel' },
            sede: { id_sede: 1, nombre: 'Sede Norte', direccion: 'Calle 1' },
          },
          cancha_reserva_estado: { descripcion: 'Confirmada' },
        },
      ]);

      prisma.claseReserva.findMany.mockResolvedValue([
        {
          id_clase_reserva: 2,
          fecha_inicio: new Date('2026-11-15T15:00:00Z'), // Más reciente
          fecha_fin: new Date('2026-11-15T16:00:00Z'),
          clase: {
            nombre: 'Crossfit',
            profesor: 'Laura',
            sala: 'Box',
            sede: { id_sede: 1, nombre: 'Sede Norte', direccion: 'Calle 1' },
          },
          clase_reserva_estado: { descripcion: 'Confirmada' },
        },
      ]);

      const result = await service.obtenerHistorial(idUsuario, {
        tipo: TipoActividadHistorial.TODAS,
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('clase-2'); // Primero la más reciente
      expect(result.items[1].id).toBe('cancha-1');
      expect(result.meta.total).toBe(2);
      expect(result.meta.total_paginas).toBe(1);
    });

    it('debería respetar la paginación con page y limit', async () => {
      const canchasMock = Array.from({ length: 5 }, (_, i) => ({
        id_cancha_reserva: i + 1,
        fecha_inicio: new Date(2026, 10, i + 1, 10, 0, 0),
        fecha_fin: new Date(2026, 10, i + 1, 11, 0, 0),
        precio_congelado: 2500,
        cancha: {
          nombre: `Cancha ${i + 1}`,
          cancha_tipo: { descripcion: 'Tenis' },
          sede: { id_sede: 1, nombre: 'Sede Central', direccion: 'Calle 100' },
        },
        cancha_reserva_estado: { descripcion: 'Confirmada' },
      }));

      prisma.canchaReserva.findMany.mockResolvedValue(canchasMock);

      const result = await service.obtenerHistorial(idUsuario, {
        tipo: TipoActividadHistorial.CANCHAS,
        page: 2,
        limit: 2,
      });

      expect(result.items).toHaveLength(2);
      expect(result.meta.total).toBe(5);
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(2);
      expect(result.meta.total_paginas).toBe(3);
    });
  });

  describe('obtenerDashboard', () => {
    it('debería calcular correctamente las métricas y retornar la información de membresía y próximas reservas', async () => {
      const fechaFutura = new Date();
      fechaFutura.setDate(fechaFutura.getDate() + 15);

      prisma.membresia.findFirst.mockResolvedValue({
        id_membresia: 99,
        fecha_inicio: new Date('2026-11-01'),
        fecha_fin: fechaFutura,
        renovacion_automatica: true,
        membresia_plan: { nombre: 'Plan Black' },
        membresia_estado: { descripcion: 'Activa' },
      });

      prisma.canchaReserva.count.mockResolvedValue(12);
      prisma.claseReserva.count.mockResolvedValue(8);

      const reservaProxima = new Date();
      reservaProxima.setDate(reservaProxima.getDate() + 2);

      prisma.canchaReserva.findMany.mockResolvedValue([
        {
          id_cancha_reserva: 10,
          fecha_inicio: reservaProxima,
          fecha_fin: new Date(reservaProxima.getTime() + 3600000),
          precio_congelado: 4000,
          cancha: {
            nombre: 'Cancha 3',
            cancha_tipo: { descripcion: 'Fútbol 7' },
            sede: { id_sede: 1, nombre: 'Sede Central', direccion: 'Av 1' },
          },
          cancha_reserva_estado: { descripcion: 'Confirmada' },
        },
      ]);
      prisma.claseReserva.findMany.mockResolvedValue([]);

      const result = await service.obtenerDashboard(idUsuario);

      expect(result.membresia).toBeDefined();
      expect(result.membresia?.plan).toBe('Plan Black');
      expect(result.membresia?.estado).toBe('Activa');
      expect(result.membresia?.dias_restantes).toBeGreaterThanOrEqual(14);
      expect(result.totales.total_canchas).toBe(12);
      expect(result.totales.total_clases).toBe(8);
      expect(result.totales.total_actividades).toBe(20);
      expect(result.totales.proximas_confirmadas).toBe(1);
      expect(result.proximas_actividades).toHaveLength(1);
      expect(result.proximas_actividades[0].id).toBe('cancha-10');
    });

    it('debería retornar membresia en null cuando el usuario no tiene ninguna registrada', async () => {
      prisma.membresia.findFirst.mockResolvedValue(null);
      prisma.canchaReserva.count.mockResolvedValue(0);
      prisma.claseReserva.count.mockResolvedValue(0);
      prisma.canchaReserva.findMany.mockResolvedValue([]);
      prisma.claseReserva.findMany.mockResolvedValue([]);

      const result = await service.obtenerDashboard(idUsuario);

      expect(result.membresia).toBeNull();
      expect(result.totales.total_actividades).toBe(0);
      expect(result.proximas_actividades).toEqual([]);
    });
  });
});
