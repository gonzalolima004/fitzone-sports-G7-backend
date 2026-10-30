import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ListaEsperaService } from '../services/lista-espera.service';
import { ListaEsperaRepository } from '../repositories/lista-espera.repository';
import { ClasesRepository } from '../repositories/clases.repository';
import { ReservasClasesRepository } from '../repositories/reservas-clases.repository';
import { InscribirListaEsperaDto } from '../dto/inscribir-lista-espera.dto';

describe('ListaEsperaService', () => {
  let service: ListaEsperaService;
  let mockListaEsperaRepo: Partial<ListaEsperaRepository>;
  let mockClasesRepo: Partial<ClasesRepository>;
  let mockReservasClasesRepo: Partial<ReservasClasesRepository>;

  const mockClase = {
    id_clase: 1,
    id_sede: 1,
    nombre: 'Spinning Funcional',
    capacidad_maxima: 20,
    activo: true,
  };

  beforeEach(() => {
    mockListaEsperaRepo = {
      existeInscripcionActiva: jest.fn(),
      crearInscripcion: jest.fn(),
      contarInscriptosActivos: jest.fn(),
      obtenerInscripcionesPorUsuario: jest.fn(),
      obtenerPosicionEnCola: jest.fn(),
    };

    mockClasesRepo = {
      obtenerClasePorId: jest.fn(),
    };

    mockReservasClasesRepo = {
      contarReservasConfirmadas: jest.fn(),
    };

    service = new ListaEsperaService(
      mockListaEsperaRepo as ListaEsperaRepository,
      mockClasesRepo as ClasesRepository,
      mockReservasClasesRepo as ReservasClasesRepository,
    );
  });

  describe('inscribir', () => {
    const idUsuario = 50;

    it('debe lanzar NotFoundException si la clase no existe', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(null);

      const dto: InscribirListaEsperaDto = {
        id_clase: 999,
        fecha_inicio: new Date(Date.now() + 3600000).toISOString(),
        fecha_fin: new Date(Date.now() + 7200000).toISOString(),
      };

      await expect(service.inscribir(dto, idUsuario)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar BadRequestException si la clase no se dicta en el día de la solicitud', async () => {
      const fechaInicio = new Date(Date.now() + 3600000);
      const fechaFin = new Date(Date.now() + 7200000);
      const fechaStr = fechaInicio.toISOString().slice(0, 10);
      const diaSemana = new Date(
        Date.UTC(
          Number(fechaStr.slice(0, 4)),
          Number(fechaStr.slice(5, 7)) - 1,
          Number(fechaStr.slice(8, 10)),
          12,
          0,
          0,
        ),
      ).getUTCDay();
      const diasDistintos = [(diaSemana + 1) % 7, (diaSemana + 2) % 7];

      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue({
        ...mockClase,
        dias_semana: diasDistintos,
        fecha: null,
      });

      const dto: InscribirListaEsperaDto = {
        id_clase: 1,
        fecha_inicio: fechaInicio.toISOString(),
        fecha_fin: fechaFin.toISOString(),
      };

      await expect(service.inscribir(dto, idUsuario)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar BadRequestException si las fechas son inválidas', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(
        mockClase,
      );

      const dto: InscribirListaEsperaDto = {
        id_clase: 1,
        fecha_inicio: 'invalida',
        fecha_fin: 'otra-invalida',
      };

      await expect(service.inscribir(dto, idUsuario)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar BadRequestException si fecha_fin es anterior o igual a fecha_inicio', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(
        mockClase,
      );

      const ahora = Date.now();
      const dto: InscribirListaEsperaDto = {
        id_clase: 1,
        fecha_inicio: new Date(ahora + 7200000).toISOString(),
        fecha_fin: new Date(ahora + 3600000).toISOString(),
      };

      await expect(service.inscribir(dto, idUsuario)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar BadRequestException si la clase ya comenzó o finalizó', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(
        mockClase,
      );

      const ahora = Date.now();
      const dto: InscribirListaEsperaDto = {
        id_clase: 1,
        fecha_inicio: new Date(ahora - 7200000).toISOString(),
        fecha_fin: new Date(ahora - 3600000).toISOString(),
      };

      await expect(service.inscribir(dto, idUsuario)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar BadRequestException si el usuario ya está inscripto en espera para ese horario', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(
        mockClase,
      );
      (
        mockListaEsperaRepo.existeInscripcionActiva as jest.Mock
      ).mockResolvedValue({
        id_clase_lista_espera: 10,
      });

      const ahora = Date.now();
      const dto: InscribirListaEsperaDto = {
        id_clase: 1,
        fecha_inicio: new Date(ahora + 3600000).toISOString(),
        fecha_fin: new Date(ahora + 7200000).toISOString(),
      };

      await expect(service.inscribir(dto, idUsuario)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar BadRequestException si la clase aún tiene cupos disponibles', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(
        mockClase, // capacidad: 20
      );
      (
        mockListaEsperaRepo.existeInscripcionActiva as jest.Mock
      ).mockResolvedValue(null);
      (
        mockReservasClasesRepo.contarReservasConfirmadas as jest.Mock
      ).mockResolvedValue(15); // Hay 5 cupos libres

      const ahora = Date.now();
      const dto: InscribirListaEsperaDto = {
        id_clase: 1,
        fecha_inicio: new Date(ahora + 3600000).toISOString(),
        fecha_fin: new Date(ahora + 7200000).toISOString(),
      };

      await expect(service.inscribir(dto, idUsuario)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe inscribir con éxito cuando la clase está llena y calcular orden en cola', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(
        mockClase, // capacidad: 20
      );
      (
        mockListaEsperaRepo.existeInscripcionActiva as jest.Mock
      ).mockResolvedValue(null);
      (
        mockReservasClasesRepo.contarReservasConfirmadas as jest.Mock
      ).mockResolvedValue(20); // Llena

      const ahora = Date.now();
      const dto: InscribirListaEsperaDto = {
        id_clase: 1,
        fecha_inicio: new Date(ahora + 3600000).toISOString(),
        fecha_fin: new Date(ahora + 7200000).toISOString(),
      };

      const inscripcionCreada = {
        id_clase_lista_espera: 5,
        id_clase: 1,
        id_usuario: idUsuario,
        fecha_inicio: new Date(dto.fecha_inicio),
        fecha_fin: new Date(dto.fecha_fin),
        id_clase_lista_espera_estado: 1,
      };

      (mockListaEsperaRepo.crearInscripcion as jest.Mock).mockResolvedValue(
        inscripcionCreada,
      );
      (
        mockListaEsperaRepo.contarInscriptosActivos as jest.Mock
      ).mockResolvedValue(3);

      const resultado = await service.inscribir(dto, idUsuario);

      expect(resultado).toEqual({
        message: 'Inscripto correctamente a la lista de espera',
        orden_en_cola: 3,
        inscripcion: inscripcionCreada,
      });
      expect(mockListaEsperaRepo.crearInscripcion).toHaveBeenCalled();
    });
  });

  describe('obtenerMisInscripciones', () => {
    it('debe devolver inscripciones formateadas con orden_en_cola e ISO strings', async () => {
      const fechaInicio = new Date('2026-10-12T21:00:00.000Z');
      const fechaFin = new Date('2026-10-12T22:00:00.000Z');

      (
        mockListaEsperaRepo.obtenerInscripcionesPorUsuario as jest.Mock
      ).mockResolvedValue([
        {
          id_clase_lista_espera: 25,
          id_clase: 1,
          id_usuario: 50,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          id_clase_lista_espera_estado: 1,
          clase_lista_espera_estado: {
            descripcion: 'En espera',
          },
          clase: {
            nombre: 'Spinning Funcional',
          },
        },
      ]);
      (
        mockListaEsperaRepo.obtenerPosicionEnCola as jest.Mock
      ).mockResolvedValue(1);

      const resultado = await service.obtenerMisInscripciones(50, '2026-10-12');

      expect(resultado).toHaveLength(1);
      expect(resultado[0]).toEqual({
        id_clase_lista_espera: 25,
        id_clase: 1,
        id_usuario: 50,
        fecha_inicio: '2026-10-12T21:00:00.000Z',
        fecha_fin: '2026-10-12T22:00:00.000Z',
        orden_en_cola: 1,
        id_clase_lista_espera_estado: 1,
        estado: 'EN ESPERA',
        nombre_clase: 'Spinning Funcional',
      });
      expect(mockListaEsperaRepo.obtenerPosicionEnCola).toHaveBeenCalledWith(
        1,
        fechaInicio,
        fechaFin,
        25,
      );
    });
  });
});
