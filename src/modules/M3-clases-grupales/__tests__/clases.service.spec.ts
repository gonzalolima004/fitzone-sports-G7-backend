import { NotFoundException } from '@nestjs/common';
import { ClasesService } from '../services/clases.service';
import { ClasesRepository } from '../repositories/clases.repository';
import { ReservasClasesRepository } from '../repositories/reservas-clases.repository';
import { ListaEsperaRepository } from '../repositories/lista-espera.repository';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { CreateClaseDto } from '../dto/create-clase.dto';
import { UpdateClaseDto } from '../dto/update-clase.dto';
import { ClaseAgendaResponseDto } from '../dto/clase-agenda-response.dto';

describe('ClasesService - CRUD y Lógica de Negocio', () => {
  let service: ClasesService;
  let mockPrisma: Partial<PrismaService>;
  let mockClasesRepo: Partial<ClasesRepository>;
  let mockReservasRepo: Partial<ReservasClasesRepository>;
  let mockListaEsperaRepo: Partial<ListaEsperaRepository>;

  const mockClase = {
    id_clase: 1,
    id_sede: 1,
    nombre: 'Spinning Funcional',
    descripcion: 'Clase de alta intensidad',
    capacidad_maxima: 20,
    profesor: 'Martín González',
    sala: 'Sala 1',
    horario_inicio: '18:00',
    horario_fin: '19:00',
    activo: true,
  };

  beforeEach(() => {
    mockClasesRepo = {
      crearClase: jest.fn(),
      obtenerClasesPorSede: jest.fn(),
      obtenerClasePorId: jest.fn(),
      actualizarClase: jest.fn(),
      reemplazarClase: jest.fn(),
      darDeBajaClase: jest.fn(),
      cancelarReservasFuturas: jest.fn(),
    };

    mockReservasRepo = {
      contarReservasConfirmadas: jest.fn(),
    };

    mockListaEsperaRepo = {
      contarInscriptosActivos: jest.fn(),
    };

    mockPrisma = {
      $transaction: jest
        .fn()
        .mockImplementation((callback: (tx: unknown) => Promise<unknown>) =>
          callback(mockPrisma),
        ),
    };

    service = new ClasesService(
      mockPrisma as PrismaService,
      mockClasesRepo as ClasesRepository,
      mockReservasRepo as ReservasClasesRepository,
      mockListaEsperaRepo as ListaEsperaRepository,
    );
  });

  describe('crearClase', () => {
    it('debe delegar la creación de la clase al repositorio', async () => {
      const dto: CreateClaseDto = {
        id_sede: 1,
        nombre: 'Yoga',
        capacidad_maxima: 15,
      };

      (mockClasesRepo.crearClase as jest.Mock).mockResolvedValue({
        id_clase: 10,
        ...dto,
        activo: true,
      });

      const resultado = await service.crearClase(dto);

      expect(resultado).toBeDefined();
      expect(mockClasesRepo.crearClase).toHaveBeenCalledWith(dto);
    });
  });

  describe('obtenerClasePorId', () => {
    it('debe retornar la clase si existe', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(
        mockClase,
      );

      const resultado = await service.obtenerClasePorId(1);
      expect(resultado).toEqual(mockClase);
    });

    it('debe lanzar NotFoundException si la clase no existe', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(null);

      await expect(service.obtenerClasePorId(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('obtenerClasesPorSede con fecha (agenda y estados)', () => {
    it('debe calcular DISPONIBLE cuando hay cupos libres', async () => {
      (mockClasesRepo.obtenerClasesPorSede as jest.Mock).mockResolvedValue([
        mockClase,
      ]);
      (
        mockReservasRepo.contarReservasConfirmadas as jest.Mock
      ).mockResolvedValue(5);
      (
        mockListaEsperaRepo.contarInscriptosActivos as jest.Mock
      ).mockResolvedValue(0);

      const agenda = (await service.obtenerClasesPorSede(
        1,
        '2026-10-12',
      )) as ClaseAgendaResponseDto[];

      expect(agenda).toHaveLength(1);
      expect(agenda[0].cupos_ocupados).toBe(5);
      expect(agenda[0].cupos_disponibles).toBe(15);
      expect(agenda[0].en_espera).toBe(0);
      expect(agenda[0].estado).toBe('DISPONIBLE');
    });

    it('debe calcular COMPLETO cuando los cupos ocupados alcanzan la capacidad máxima', async () => {
      (mockClasesRepo.obtenerClasesPorSede as jest.Mock).mockResolvedValue([
        mockClase,
      ]);
      (
        mockReservasRepo.contarReservasConfirmadas as jest.Mock
      ).mockResolvedValue(20);
      (
        mockListaEsperaRepo.contarInscriptosActivos as jest.Mock
      ).mockResolvedValue(3);

      const agenda = (await service.obtenerClasesPorSede(
        1,
        '2026-10-12',
      )) as ClaseAgendaResponseDto[];

      expect(agenda).toHaveLength(1);
      expect(agenda[0].cupos_ocupados).toBe(20);
      expect(agenda[0].cupos_disponibles).toBe(0);
      expect(agenda[0].en_espera).toBe(3);
      expect(agenda[0].estado).toBe('COMPLETO');
    });
  });

  describe('actualizarClase (PATCH)', () => {
    it('debe verificar existencia y llamar a actualizar en el repositorio', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(
        mockClase,
      );
      const updateDto: UpdateClaseDto = { nombre: 'Spinning Pro' };
      (mockClasesRepo.actualizarClase as jest.Mock).mockResolvedValue({
        ...mockClase,
        ...updateDto,
      });

      const resultado = await service.actualizarClase(1, updateDto);

      expect(mockClasesRepo.actualizarClase).toHaveBeenCalledWith(1, updateDto);
      expect(resultado.nombre).toBe('Spinning Pro');
    });

    it('debe lanzar NotFoundException si no existe la clase a actualizar', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(null);

      await expect(
        service.actualizarClase(999, { nombre: 'Nuevo' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reemplazarClase (PUT)', () => {
    it('debe verificar existencia y llamar a reemplazar en el repositorio', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(
        mockClase,
      );
      const replaceDto: CreateClaseDto = {
        id_sede: 1,
        nombre: 'Spinning Renovado',
        capacidad_maxima: 25,
        horario_inicio: '19:00',
        horario_fin: '20:00',
      };
      (mockClasesRepo.reemplazarClase as jest.Mock).mockResolvedValue({
        id_clase: 1,
        ...replaceDto,
        activo: true,
      });

      const resultado = await service.reemplazarClase(1, replaceDto);

      expect(mockClasesRepo.reemplazarClase).toHaveBeenCalledWith(
        1,
        replaceDto,
      );
      expect(resultado.capacidad_maxima).toBe(25);
    });

    it('debe lanzar NotFoundException si no existe la clase a reemplazar', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(null);

      await expect(
        service.reemplazarClase(999, {
          id_sede: 1,
          nombre: 'Inexistente',
          capacidad_maxima: 10,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('eliminarClase (DELETE - Baja Lógica)', () => {
    it('debe verificar existencia, cancelar reservas futuras y marcar activo=false', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(
        mockClase,
      );
      (mockClasesRepo.cancelarReservasFuturas as jest.Mock).mockResolvedValue(
        2,
      );
      (mockClasesRepo.darDeBajaClase as jest.Mock).mockResolvedValue({
        ...mockClase,
        activo: false,
      });

      const resultado = await service.eliminarClase(1);

      expect(resultado).toEqual({
        mensaje: 'Clase dada de baja exitosamente.',
        id_clase: 1,
        activo: false,
        reservas_canceladas: 2,
      });
      expect(mockClasesRepo.cancelarReservasFuturas).toHaveBeenCalled();
      expect(mockClasesRepo.darDeBajaClase).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si la clase a eliminar no existe', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(null);

      await expect(service.eliminarClase(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
