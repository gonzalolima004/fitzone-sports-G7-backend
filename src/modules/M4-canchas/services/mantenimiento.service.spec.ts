import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MantenimientoService } from './mantenimiento.service';
import { CanchasRepository } from '../repositories/canchas.repository';
import { Prisma } from '@prisma/client';

describe('MantenimientoService', () => {
  let service: MantenimientoService;
  let mockCanchasRepo: Partial<jest.Mocked<CanchasRepository>>;

  const mockMantenimiento = {
    id_cancha_mantenimiento: 1,
    id_cancha: 10,
    fecha_inicio: new Date('2026-10-25T08:00:00.000Z'),
    fecha_fin: new Date('2026-10-25T12:00:00.000Z'),
    motivo: 'Mantenimiento preventivo',
    cancha: {
      id_cancha: 10,
      nombre: 'Cancha Pádel 1',
      costo_base: new Prisma.Decimal('5000'),
      activo: true,
      disponible: true,
      id_cancha_tipo: 1,
      id_sede: 2,
      sede: {
        id_sede: 2,
        nombre: 'Sede Central',
        direccion: 'Av. 123',
        id_ciudad: 1,
        horario_apertura: '08:00',
        horario_cierre: '22:00',
        activo: true,
      },
      cancha_tipo: {
        id_cancha_tipo: 1,
        descripcion: 'Pádel',
      },
    },
  };

  beforeEach(() => {
    mockCanchasRepo = {
      obtenerPorId: jest.fn(),
      crearMantenimiento: jest.fn(),
      obtenerMantenimientos: jest.fn(),
    };

    service = new MantenimientoService(
      mockCanchasRepo as unknown as CanchasRepository,
    );
  });

  describe('programarMantenimiento', () => {
    it('debe lanzar NotFoundException si la cancha no existe', async () => {
      (mockCanchasRepo.obtenerPorId as jest.Mock).mockResolvedValue(null);

      await expect(
        service.programarMantenimiento(999, {
          fecha_inicio: '2026-10-25T08:00:00Z',
          fecha_fin: '2026-10-25T12:00:00Z',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe registrar el mantenimiento correctamente si la cancha existe', async () => {
      (mockCanchasRepo.obtenerPorId as jest.Mock).mockResolvedValue({
        id_cancha: 10,
      });
      (mockCanchasRepo.crearMantenimiento as jest.Mock).mockResolvedValue(
        mockMantenimiento,
      );

      const result = await service.programarMantenimiento(10, {
        fecha_inicio: '2026-10-25T08:00:00Z',
        fecha_fin: '2026-10-25T12:00:00Z',
        motivo: 'Arreglo de red',
      });

      expect(mockCanchasRepo.crearMantenimiento).toHaveBeenCalledWith({
        id_cancha: 10,
        fecha_inicio: new Date('2026-10-25T08:00:00Z'),
        fecha_fin: new Date('2026-10-25T12:00:00Z'),
        motivo: 'Arreglo de red',
      });
      expect(result).toEqual(mockMantenimiento);
    });
  });

  describe('obtenerMantenimientos', () => {
    it('debe consultar y devolver mantenimientos sin filtros', async () => {
      (mockCanchasRepo.obtenerMantenimientos as jest.Mock).mockResolvedValue([
        mockMantenimiento,
      ]);

      const result = await service.obtenerMantenimientos({});

      expect(mockCanchasRepo.obtenerMantenimientos).toHaveBeenCalledWith({
        sedeId: undefined,
        canchaId: undefined,
        fechaInicio: undefined,
        fechaFin: undefined,
      });
      // Verificamos que NO se hagan consultas redundantes
      expect(mockCanchasRepo.obtenerPorId).not.toHaveBeenCalled();
      expect(result).toEqual([mockMantenimiento]);
    });

    it('debe consultar con filtros de sedeId y canchaId', async () => {
      (mockCanchasRepo.obtenerMantenimientos as jest.Mock).mockResolvedValue([
        mockMantenimiento,
      ]);

      const result = await service.obtenerMantenimientos({
        sedeId: 2,
        canchaId: 10,
      });

      expect(mockCanchasRepo.obtenerMantenimientos).toHaveBeenCalledWith({
        sedeId: 2,
        canchaId: 10,
        fechaInicio: undefined,
        fechaFin: undefined,
      });
      expect(result).toEqual([mockMantenimiento]);
    });

    it('debe parsear fechas en formato YYYY-MM-DD y extender fechaFin al fin del día', async () => {
      (mockCanchasRepo.obtenerMantenimientos as jest.Mock).mockResolvedValue([
        mockMantenimiento,
      ]);

      await service.obtenerMantenimientos({
        fechaInicio: '2026-10-25',
        fechaFin: '2026-10-25',
      });

      expect(mockCanchasRepo.obtenerMantenimientos).toHaveBeenCalledWith({
        sedeId: undefined,
        canchaId: undefined,
        fechaInicio: new Date('2026-10-25T00:00:00.000Z'),
        fechaFin: new Date('2026-10-25T23:59:59.999Z'),
      });
    });

    it('debe lanzar BadRequestException si sedeId no es válido', async () => {
      await expect(
        service.obtenerMantenimientos({ sedeId: -1 }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.obtenerMantenimientos({ sedeId: NaN }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si canchaId no es válido', async () => {
      await expect(
        service.obtenerMantenimientos({ canchaId: 0 }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.obtenerMantenimientos({ canchaId: NaN }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si fechaInicio es inválida', async () => {
      await expect(
        service.obtenerMantenimientos({ fechaInicio: 'fecha-invalida' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si fechaFin es inválida', async () => {
      await expect(
        service.obtenerMantenimientos({ fechaFin: 'fecha-invalida' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si fechaInicio es posterior a fechaFin', async () => {
      await expect(
        service.obtenerMantenimientos({
          fechaInicio: '2026-10-26T10:00:00Z',
          fechaFin: '2026-10-25T10:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
