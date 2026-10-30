import { Prisma } from '@prisma/client';
import { ClasesRepository } from '../repositories/clases.repository';
import { ReservasClasesRepository } from '../repositories/reservas-clases.repository';
import { ListaEsperaRepository } from '../repositories/lista-espera.repository';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { CreateClaseDto } from '../dto/create-clase.dto';
import { UpdateClaseDto } from '../dto/update-clase.dto';

interface MockPrismaClient {
  clase: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  claseReserva: {
    count: jest.Mock;
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    updateMany: jest.Mock;
  };
  claseListaEspera: {
    create: jest.Mock;
    findFirst: jest.Mock;
    count: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
}

describe('M3 Repositorios (Clases, Reservas, ListaEspera)', () => {
  let mockPrisma: MockPrismaClient;

  beforeEach(() => {
    mockPrisma = {
      clase: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      claseReserva: {
        count: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      claseListaEspera: {
        create: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
  });

  describe('ClasesRepository', () => {
    let repo: ClasesRepository;

    beforeEach(() => {
      repo = new ClasesRepository(mockPrisma as unknown as PrismaService);
    });

    it('crearClase debe invocar prisma.clase.create', async () => {
      const data: CreateClaseDto = {
        id_sede: 1,
        nombre: 'Yoga',
        capacidad_maxima: 15,
      };
      mockPrisma.clase.create.mockResolvedValue({ id_clase: 1, ...data });

      const res = await repo.crearClase(data);

      expect(mockPrisma.clase.create).toHaveBeenCalledWith({ data });
      expect(res.id_clase).toBe(1);
    });

    it('crearClase debe convertir fecha string a Date si está presente', async () => {
      const data: CreateClaseDto = {
        id_sede: 1,
        nombre: 'Masterclass Yoga',
        capacidad_maxima: 20,
        fecha: '2026-10-25',
        dias_semana: [0],
      };
      mockPrisma.clase.create.mockResolvedValue({ id_clase: 10, ...data });

      await repo.crearClase(data);

      expect(mockPrisma.clase.create).toHaveBeenCalledWith({
        data: {
          id_sede: 1,
          nombre: 'Masterclass Yoga',
          capacidad_maxima: 20,
          dias_semana: [0],
          fecha: new Date('2026-10-25'),
        },
      });
    });

    it('obtenerClasesPorSede debe filtrar por id_sede y activo: true', async () => {
      mockPrisma.clase.findMany.mockResolvedValue([{ id_clase: 1 }]);

      const res = await repo.obtenerClasesPorSede(2);

      expect(mockPrisma.clase.findMany).toHaveBeenCalledWith({
        where: { id_sede: 2, activo: true },
      });
      expect(res).toHaveLength(1);
    });

    it('obtenerClasePorId debe buscar por id_clase', async () => {
      mockPrisma.clase.findUnique.mockResolvedValue({ id_clase: 5 });

      const res = await repo.obtenerClasePorId(5);

      expect(mockPrisma.clase.findUnique).toHaveBeenCalledWith({
        where: { id_clase: 5 },
      });
      expect(res?.id_clase).toBe(5);
    });

    it('actualizarClase debe llamar prisma.clase.update', async () => {
      const updateData: UpdateClaseDto = { nombre: 'Yoga Pro' };
      mockPrisma.clase.update.mockResolvedValue({ id_clase: 5, ...updateData });

      const res = await repo.actualizarClase(5, updateData);

      expect(mockPrisma.clase.update).toHaveBeenCalledWith({
        where: { id_clase: 5 },
        data: updateData,
      });
      expect(res.nombre).toBe('Yoga Pro');
    });

    it('reemplazarClase debe llamar prisma.clase.update', async () => {
      const replaceData: CreateClaseDto = {
        id_sede: 1,
        nombre: 'Total',
        capacidad_maxima: 20,
      };
      mockPrisma.clase.update.mockResolvedValue({
        id_clase: 5,
        ...replaceData,
      });

      const res = await repo.reemplazarClase(5, replaceData);

      expect(mockPrisma.clase.update).toHaveBeenCalledWith({
        where: { id_clase: 5 },
        data: replaceData,
      });
      expect(res.nombre).toBe('Total');
    });

    it('darDeBajaClase debe setear activo=false (soporta tx)', async () => {
      const updateMock = jest
        .fn()
        .mockResolvedValue({ id_clase: 5, activo: false });
      const mockTx = {
        clase: { update: updateMock },
      } as unknown as Prisma.TransactionClient;

      await repo.darDeBajaClase(5, mockTx);

      expect(updateMock).toHaveBeenCalledWith({
        where: { id_clase: 5 },
        data: { activo: false },
      });
    });

    it('cancelarReservasFuturas debe actualizar reservas a estado 4 (soporta tx)', async () => {
      const updateManyMock = jest.fn().mockResolvedValue({ count: 3 });
      const mockTx = {
        claseReserva: { updateMany: updateManyMock },
      } as unknown as Prisma.TransactionClient;
      const fecha = new Date();

      const canceladas = await repo.cancelarReservasFuturas(10, fecha, mockTx);

      expect(updateManyMock).toHaveBeenCalledWith({
        where: {
          id_clase: 10,
          fecha_inicio: { gte: fecha },
          id_clase_reserva_estado: { in: [1, 2] },
        },
        data: { id_clase_reserva_estado: 4 },
      });
      expect(canceladas).toBe(3);
    });
  });

  describe('ReservasClasesRepository', () => {
    let repo: ReservasClasesRepository;

    beforeEach(() => {
      repo = new ReservasClasesRepository(
        mockPrisma as unknown as PrismaService,
      );
    });

    it('contarReservasConfirmadas debe contar con estado 1 (soporta tx)', async () => {
      const d1 = new Date();
      const d2 = new Date();
      mockPrisma.claseReserva.count.mockResolvedValue(7);

      const count = await repo.contarReservasConfirmadas(1, d1, d2);

      expect(mockPrisma.claseReserva.count).toHaveBeenCalledWith({
        where: {
          id_clase: 1,
          fecha_inicio: d1,
          fecha_fin: d2,
          id_clase_reserva_estado: 1,
        },
      });
      expect(count).toBe(7);
    });

    it('crearReserva debe insertar la reserva en claseReserva', async () => {
      const dto = {
        id_clase: 1,
        fecha_inicio: '2026-10-12T21:00:00.000Z',
        fecha_fin: '2026-10-12T22:00:00.000Z',
      };
      mockPrisma.claseReserva.create.mockResolvedValue({
        id_clase_reserva: 100,
      });

      const res = await repo.crearReserva(dto, 50, 1);

      expect(mockPrisma.claseReserva.create).toHaveBeenCalledWith({
        data: {
          id_clase: 1,
          id_usuario: 50,
          id_clase_reserva_estado: 1,
          fecha_inicio: new Date(dto.fecha_inicio),
          fecha_fin: new Date(dto.fecha_fin),
        },
      });
      expect(res.id_clase_reserva).toBe(100);
    });

    it('obtenerReservaPorId debe buscar por id_clase_reserva', async () => {
      mockPrisma.claseReserva.findUnique.mockResolvedValue({
        id_clase_reserva: 10,
      });

      const res = await repo.obtenerReservaPorId(10);

      expect(mockPrisma.claseReserva.findUnique).toHaveBeenCalledWith({
        where: { id_clase_reserva: 10 },
      });
      expect(res?.id_clase_reserva).toBe(10);
    });

    it('actualizarEstadoReserva debe actualizar id_clase_reserva_estado', async () => {
      mockPrisma.claseReserva.update.mockResolvedValue({
        id_clase_reserva: 10,
        id_clase_reserva_estado: 4,
      });

      const res = await repo.actualizarEstadoReserva(10, 4);

      expect(mockPrisma.claseReserva.update).toHaveBeenCalledWith({
        where: { id_clase_reserva: 10 },
        data: { id_clase_reserva_estado: 4 },
      });
      expect(res.id_clase_reserva_estado).toBe(4);
    });

    it('obtenerPrimerEnEspera debe buscar por estado 2 y ordenar asc', async () => {
      const d1 = new Date();
      const d2 = new Date();
      mockPrisma.claseReserva.findFirst.mockResolvedValue({
        id_clase_reserva: 5,
      });

      const res = await repo.obtenerPrimerEnEspera(1, d1, d2);

      expect(mockPrisma.claseReserva.findFirst).toHaveBeenCalledWith({
        where: {
          id_clase: 1,
          fecha_inicio: {
            gte: new Date(d1.getTime() - 60000),
            lte: new Date(d1.getTime() + 60000),
          },
          fecha_fin: {
            gte: new Date(d2.getTime() - 60000),
            lte: new Date(d2.getTime() + 60000),
          },
          id_clase_reserva_estado: 2,
        },
        orderBy: { id_clase_reserva: 'asc' },
      });
      expect(res?.id_clase_reserva).toBe(5);
    });

    it('obtenerReservasPorUsuario debe consultar reservas con y sin rango de fechas', async () => {
      mockPrisma.claseReserva.findMany.mockResolvedValue([]);

      await repo.obtenerReservasPorUsuario(50);
      expect(mockPrisma.claseReserva.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id_usuario: 50, id_clase_reserva_estado: 1 },
        }),
      );

      const d1 = new Date('2026-10-12T00:00:00.000Z');
      const d2 = new Date('2026-10-12T23:59:59.999Z');
      await repo.obtenerReservasPorUsuario(50, d1, d2);
      expect(mockPrisma.claseReserva.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id_usuario: 50,
            id_clase_reserva_estado: 1,
            fecha_inicio: { gte: d1, lte: d2 },
          },
        }),
      );
    });
  });

  describe('ListaEsperaRepository', () => {
    let repo: ListaEsperaRepository;

    beforeEach(() => {
      repo = new ListaEsperaRepository(mockPrisma as unknown as PrismaService);
    });

    it('crearInscripcion debe crear registro con estado 1', async () => {
      const d1 = new Date();
      const d2 = new Date();
      mockPrisma.claseListaEspera.create.mockResolvedValue({
        id_clase_lista_espera: 1,
      });

      const res = await repo.crearInscripcion(1, 50, d1, d2);

      expect(mockPrisma.claseListaEspera.create).toHaveBeenCalledWith({
        data: {
          id_clase: 1,
          id_usuario: 50,
          fecha_inicio: d1,
          fecha_fin: d2,
          id_clase_lista_espera_estado: 1,
        },
      });
      expect(res.id_clase_lista_espera).toBe(1);
    });

    it('existeInscripcionActiva debe consultar por usuario, clase y estado 1', async () => {
      const d1 = new Date();
      const d2 = new Date();
      mockPrisma.claseListaEspera.findFirst.mockResolvedValue({
        id_clase_lista_espera: 2,
      });

      const res = await repo.existeInscripcionActiva(1, 50, d1, d2);

      expect(mockPrisma.claseListaEspera.findFirst).toHaveBeenCalledWith({
        where: {
          id_clase: 1,
          id_usuario: 50,
          fecha_inicio: d1,
          fecha_fin: d2,
          id_clase_lista_espera_estado: 1,
        },
      });
      expect(res?.id_clase_lista_espera).toBe(2);
    });

    it('contarInscriptosActivos debe contar registros con estado 1', async () => {
      const d1 = new Date();
      const d2 = new Date();
      mockPrisma.claseListaEspera.count.mockResolvedValue(4);

      const count = await repo.contarInscriptosActivos(1, d1, d2);

      expect(mockPrisma.claseListaEspera.count).toHaveBeenCalledWith({
        where: {
          id_clase: 1,
          fecha_inicio: d1,
          fecha_fin: d2,
          id_clase_lista_espera_estado: 1,
        },
      });
      expect(count).toBe(4);
    });

    it('obtenerPrimerInscriptoActivo debe consultar el primer registro en espera con rango de tolerancia orden asc', async () => {
      const d1 = new Date();
      const d2 = new Date();
      mockPrisma.claseListaEspera.findFirst.mockResolvedValue({
        id_clase_lista_espera: 1,
      });

      const res = await repo.obtenerPrimerInscriptoActivo(1, d1, d2);

      expect(mockPrisma.claseListaEspera.findFirst).toHaveBeenCalledWith({
        where: {
          id_clase: 1,
          fecha_inicio: {
            gte: new Date(d1.getTime() - 60000),
            lte: new Date(d1.getTime() + 60000),
          },
          fecha_fin: {
            gte: new Date(d2.getTime() - 60000),
            lte: new Date(d2.getTime() + 60000),
          },
          id_clase_lista_espera_estado: 1,
        },
        orderBy: { id_clase_lista_espera: 'asc' },
      });
      expect(res?.id_clase_lista_espera).toBe(1);
    });

    it('obtenerPrimerInscriptoActivo debe soportar coincidencia exacta si toleranciaMs es 0', async () => {
      const d1 = new Date();
      const d2 = new Date();
      mockPrisma.claseListaEspera.findFirst.mockResolvedValue({
        id_clase_lista_espera: 1,
      });

      await repo.obtenerPrimerInscriptoActivo(1, d1, d2, undefined, 0);

      expect(mockPrisma.claseListaEspera.findFirst).toHaveBeenCalledWith({
        where: {
          id_clase: 1,
          fecha_inicio: d1,
          fecha_fin: d2,
          id_clase_lista_espera_estado: 1,
        },
        orderBy: { id_clase_lista_espera: 'asc' },
      });
    });

    it('actualizarEstadoInscripcion debe invocar prisma.claseListaEspera.update', async () => {
      mockPrisma.claseListaEspera.update.mockResolvedValue({
        id_clase_lista_espera: 1,
        id_clase_lista_espera_estado: 2,
      });

      const res = await repo.actualizarEstadoInscripcion(1, 2);

      expect(mockPrisma.claseListaEspera.update).toHaveBeenCalledWith({
        where: { id_clase_lista_espera: 1 },
        data: { id_clase_lista_espera_estado: 2 },
      });
      expect(res.id_clase_lista_espera_estado).toBe(2);
    });

    it('obtenerInscripcionesPorUsuario debe filtrar con y sin fechas', async () => {
      mockPrisma.claseListaEspera.findMany.mockResolvedValue([]);

      await repo.obtenerInscripcionesPorUsuario(50);
      expect(mockPrisma.claseListaEspera.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id_usuario: 50, id_clase_lista_espera_estado: 1 },
        }),
      );

      const d1 = new Date();
      const d2 = new Date();
      await repo.obtenerInscripcionesPorUsuario(50, d1, d2);
      expect(mockPrisma.claseListaEspera.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id_usuario: 50,
            id_clase_lista_espera_estado: 1,
            fecha_inicio: { gte: d1, lte: d2 },
          },
        }),
      );
    });

    it('obtenerPosicionEnCola debe contar las solicitudes anteriores o iguales a id', async () => {
      const d1 = new Date();
      const d2 = new Date();
      mockPrisma.claseListaEspera.count.mockResolvedValue(2);

      const posicion = await repo.obtenerPosicionEnCola(1, d1, d2, 10);

      expect(mockPrisma.claseListaEspera.count).toHaveBeenCalledWith({
        where: {
          id_clase: 1,
          fecha_inicio: d1,
          fecha_fin: d2,
          id_clase_lista_espera_estado: 1,
          id_clase_lista_espera: { lte: 10 },
        },
      });
      expect(posicion).toBe(2);
    });
  });
});
