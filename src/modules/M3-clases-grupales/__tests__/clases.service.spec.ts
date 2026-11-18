import { BadRequestException, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ClasesService } from '../services/clases.service';
import { ClasesRepository } from '../repositories/clases.repository';
import { ReservasClasesRepository } from '../repositories/reservas-clases.repository';
import { ListaEsperaRepository } from '../repositories/lista-espera.repository';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { CreateClaseDto } from '../dto/create-clase.dto';
import { UpdateClaseDto } from '../dto/update-clase.dto';
import { ClaseResponseDto } from '../dto/clase-response.dto';
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
    dias_semana: [1, 3, 5],
    fecha: null,
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
      expect(resultado.horario_inicio).toBe('09:00');
      expect(resultado.horario_fin).toBe('10:00');
      expect(resultado.fecha_inicio).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(resultado.fecha_fin).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('debe lanzar BadRequestException si horario_fin es menor o igual a horario_inicio', async () => {
      const dto: CreateClaseDto = {
        id_sede: 1,
        nombre: 'Horario Inválido',
        capacidad_maxima: 10,
        horario_inicio: '18:00',
        horario_fin: '17:00',
      };

      await expect(service.crearClase(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar NotFoundException si la sede especificada no existe', async () => {
      const mockPrismaConSede = {
        sede: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };
      const serviceConSede = new ClasesService(
        mockPrismaConSede as unknown as PrismaService,
        mockClasesRepo as ClasesRepository,
        mockReservasRepo as ReservasClasesRepository,
        mockListaEsperaRepo as ListaEsperaRepository,
      );

      const dto: CreateClaseDto = {
        id_sede: 999,
        nombre: 'Clase en Sede Inexistente',
        capacidad_maxima: 10,
      };

      await expect(serviceConSede.crearClase(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar BadRequestException si el horario de inicio es anterior a la hora de apertura de la sede', async () => {
      const mockPrismaConHorario = {
        sede_horario: {
          findMany: jest.fn().mockResolvedValue([
            {
              dia_semana: 1,
              hora_apertura: '08:00',
              hora_cierre: '22:00',
              abierto: true,
            },
          ]),
        },
      };

      const serviceConHorario = new ClasesService(
        mockPrismaConHorario as unknown as PrismaService,
        mockClasesRepo as ClasesRepository,
        mockReservasRepo as ReservasClasesRepository,
        mockListaEsperaRepo as ListaEsperaRepository,
      );

      const dto: CreateClaseDto = {
        id_sede: 1,
        nombre: 'Spinning Madrugador',
        capacidad_maxima: 20,
        horario_inicio: '07:00',
        horario_fin: '08:30',
        dias_semana: [1],
      };

      await expect(serviceConHorario.crearClase(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(serviceConHorario.crearClase(dto)).rejects.toThrow(
        /está fuera del horario operativo de la sede para el día Lunes/i,
      );
    });

    it('debe lanzar BadRequestException si el horario de fin es posterior a la hora de cierre de la sede', async () => {
      const mockPrismaConHorario = {
        sede_horario: {
          findMany: jest.fn().mockResolvedValue([
            {
              dia_semana: 5,
              hora_apertura: '08:00',
              hora_cierre: '20:00',
              abierto: true,
            },
          ]),
        },
      };

      const serviceConHorario = new ClasesService(
        mockPrismaConHorario as unknown as PrismaService,
        mockClasesRepo as ClasesRepository,
        mockReservasRepo as ReservasClasesRepository,
        mockListaEsperaRepo as ListaEsperaRepository,
      );

      const dto: CreateClaseDto = {
        id_sede: 1,
        nombre: 'Yoga Nocturno',
        capacidad_maxima: 20,
        horario_inicio: '19:30',
        horario_fin: '20:30',
        dias_semana: [5],
      };

      await expect(serviceConHorario.crearClase(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(serviceConHorario.crearClase(dto)).rejects.toThrow(
        /está fuera del horario operativo de la sede para el día Viernes/i,
      );
    });

    it('debe lanzar BadRequestException si la sede se encuentra cerrada en los días configurados', async () => {
      const mockPrismaConHorario = {
        sede_horario: {
          findMany: jest.fn().mockResolvedValue([
            {
              dia_semana: 0,
              hora_apertura: '00:00',
              hora_cierre: '00:00',
              abierto: false,
            },
          ]),
        },
      };

      const serviceConHorario = new ClasesService(
        mockPrismaConHorario as unknown as PrismaService,
        mockClasesRepo as ClasesRepository,
        mockReservasRepo as ReservasClasesRepository,
        mockListaEsperaRepo as ListaEsperaRepository,
      );

      const dto: CreateClaseDto = {
        id_sede: 1,
        nombre: 'Crossfit Domingo',
        capacidad_maxima: 15,
        horario_inicio: '10:00',
        horario_fin: '11:00',
        dias_semana: [0],
      };

      await expect(serviceConHorario.crearClase(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(serviceConHorario.crearClase(dto)).rejects.toThrow(
        /La sede se encuentra cerrada los días Domingo/i,
      );
    });

    it('debe permitir crear la clase si el horario está estrictamente dentro del rango operativo', async () => {
      const mockPrismaConHorario = {
        sede_horario: {
          findMany: jest.fn().mockResolvedValue([
            {
              dia_semana: 1,
              hora_apertura: '08:00',
              hora_cierre: '22:00',
              abierto: true,
            },
          ]),
        },
      };

      const serviceConHorario = new ClasesService(
        mockPrismaConHorario as unknown as PrismaService,
        mockClasesRepo as ClasesRepository,
        mockReservasRepo as ReservasClasesRepository,
        mockListaEsperaRepo as ListaEsperaRepository,
      );

      const dto: CreateClaseDto = {
        id_sede: 1,
        nombre: 'Spinning Mediodía',
        capacidad_maxima: 20,
        horario_inicio: '12:00',
        horario_fin: '13:00',
        dias_semana: [1],
      };

      (mockClasesRepo.crearClase as jest.Mock).mockResolvedValue({
        id_clase: 55,
        ...dto,
        activo: true,
      });

      const res = await serviceConHorario.crearClase(dto);
      expect(res.id_clase).toBe(55);
      expect(res.horario_inicio).toBe('12:00');
      expect(res.horario_fin).toBe('13:00');
    });
  });

  describe('obtenerClasePorId', () => {
    it('debe retornar la clase si existe', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(
        mockClase,
      );

      const resultado = await service.obtenerClasePorId(1);
      expect(resultado).toMatchObject({
        id_clase: 1,
        nombre: 'Spinning Funcional',
        horario_inicio: '18:00',
        horario_fin: '19:00',
      });
      expect(resultado.fecha_inicio).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(resultado.fecha_fin).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('debe lanzar NotFoundException si la clase no existe', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(null);

      await expect(service.obtenerClasePorId(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('obtenerClasesPorSede sin fecha (catálogo base)', () => {
    it('debe retornar catálogo con fechas normalizadas en formato ISO 8601 y horarios HH:mm', async () => {
      (mockClasesRepo.obtenerClasesPorSede as jest.Mock).mockResolvedValue([
        mockClase,
      ]);

      const clases = (await service.obtenerClasesPorSede(
        1,
      )) as ClaseResponseDto[];

      expect(clases).toHaveLength(1);
      expect(clases[0].horario_inicio).toBe('18:00');
      expect(clases[0].horario_fin).toBe('19:00');
      expect(clases[0].fecha_inicio).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(clases[0].fecha_fin).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('debe propagar incluirInactivas = true al repositorio para vista de gerente', async () => {
      (mockClasesRepo.obtenerClasesPorSede as jest.Mock).mockResolvedValue([
        mockClase,
        { ...mockClase, id_clase: 2, activo: false },
      ]);

      const clases = await service.obtenerClasesPorSede(1, undefined, true);

      expect(mockClasesRepo.obtenerClasesPorSede).toHaveBeenCalledWith(1, true);
      expect(clases).toHaveLength(2);
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

    it('debe calcular DISPONIBLE con todos los cupos libres en clase completamente vacía', async () => {
      (mockClasesRepo.obtenerClasesPorSede as jest.Mock).mockResolvedValue([
        mockClase, // capacidad: 20
      ]);
      (
        mockReservasRepo.contarReservasConfirmadas as jest.Mock
      ).mockResolvedValue(0); // 0 ocupados
      (
        mockListaEsperaRepo.contarInscriptosActivos as jest.Mock
      ).mockResolvedValue(0);

      const agenda = (await service.obtenerClasesPorSede(
        1,
        '2026-10-12',
      )) as ClaseAgendaResponseDto[];

      expect(agenda).toHaveLength(1);
      expect(agenda[0].cupos_ocupados).toBe(0);
      expect(agenda[0].cupos_disponibles).toBe(20);
      expect(agenda[0].en_espera).toBe(0);
      expect(agenda[0].estado).toBe('DISPONIBLE');
    });

    it('debe calcular DISPONIBLE con 1 cupo disponible en clase casi llena', async () => {
      (mockClasesRepo.obtenerClasesPorSede as jest.Mock).mockResolvedValue([
        mockClase, // capacidad: 20
      ]);
      (
        mockReservasRepo.contarReservasConfirmadas as jest.Mock
      ).mockResolvedValue(19); // 19 ocupados
      (
        mockListaEsperaRepo.contarInscriptosActivos as jest.Mock
      ).mockResolvedValue(0);

      const agenda = (await service.obtenerClasesPorSede(
        1,
        '2026-10-12',
      )) as ClaseAgendaResponseDto[];

      expect(agenda).toHaveLength(1);
      expect(agenda[0].cupos_ocupados).toBe(19);
      expect(agenda[0].cupos_disponibles).toBe(1);
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

    it('debe reflejar la hora exacta en zona horaria ART (UTC-03:00) en el ISO generado', async () => {
      (mockClasesRepo.obtenerClasesPorSede as jest.Mock).mockResolvedValue([
        mockClase, // horario_inicio: '18:00', horario_fin: '19:00'
      ]);
      (
        mockReservasRepo.contarReservasConfirmadas as jest.Mock
      ).mockResolvedValue(0);
      (
        mockListaEsperaRepo.contarInscriptosActivos as jest.Mock
      ).mockResolvedValue(0);

      const agenda = (await service.obtenerClasesPorSede(
        1,
        '2026-10-12',
      )) as ClaseAgendaResponseDto[];

      expect(agenda[0].horario_inicio).toBe('18:00');
      expect(agenda[0].horario_fin).toBe('19:00');
      // 18:00 ART (-03:00) corresponde a 21:00 UTC (Z)
      expect(agenda[0].fecha_inicio).toBe('2026-10-12T21:00:00.000Z');
      expect(agenda[0].fecha_fin).toBe('2026-10-12T22:00:00.000Z');
      expect(agenda[0].dias_semana).toEqual([1, 3, 5]);
    });

    it('debe filtrar y excluir clases que no correspondan al día de la semana consultado', async () => {
      // mockClase se dicta lunes, miércoles y viernes (dias_semana: [1, 3, 5])
      (mockClasesRepo.obtenerClasesPorSede as jest.Mock).mockResolvedValue([
        mockClase,
      ]);

      // 2026-10-13 es Martes (2)
      const agenda = (await service.obtenerClasesPorSede(
        1,
        '2026-10-13',
      )) as ClaseAgendaResponseDto[];

      expect(agenda).toHaveLength(0);
    });

    it('debe filtrar e incluir clases con fecha puntual solo cuando coincida la fecha exacta', async () => {
      const clasePuntual = {
        ...mockClase,
        id_clase: 2,
        dias_semana: [],
        fecha: new Date('2026-10-25T00:00:00.000Z'),
      };
      (mockClasesRepo.obtenerClasesPorSede as jest.Mock).mockResolvedValue([
        clasePuntual,
      ]);
      (
        mockReservasRepo.contarReservasConfirmadas as jest.Mock
      ).mockResolvedValue(0);
      (
        mockListaEsperaRepo.contarInscriptosActivos as jest.Mock
      ).mockResolvedValue(0);

      // Fecha que coincide
      const agendaCoincide = (await service.obtenerClasesPorSede(
        1,
        '2026-10-25',
      )) as ClaseAgendaResponseDto[];
      expect(agendaCoincide).toHaveLength(1);
      expect(agendaCoincide[0].fecha).toBe('2026-10-25');

      // Fecha distinta
      const agendaDiferente = (await service.obtenerClasesPorSede(
        1,
        '2026-10-26',
      )) as ClaseAgendaResponseDto[];
      expect(agendaDiferente).toHaveLength(0);
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
      expect(resultado.horario_inicio).toBe('18:00');
      expect(resultado.horario_fin).toBe('19:00');
      expect(resultado.fecha_inicio).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('debe lanzar NotFoundException si no existe la clase a actualizar', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(null);

      await expect(
        service.actualizarClase(999, { nombre: 'Nuevo' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar BadRequestException si el horario actualizado es inconsistente', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(
        mockClase,
      );

      await expect(
        service.actualizarClase(1, { horario_fin: '17:00' }), // Inicio es 18:00
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si el horario actualizado excede el horario operativo de la sede', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(
        mockClase,
      );

      const mockPrismaConHorario = {
        sede_horario: {
          findMany: jest.fn().mockResolvedValue([
            {
              dia_semana: 1,
              hora_apertura: '08:00',
              hora_cierre: '20:00',
              abierto: true,
            },
            {
              dia_semana: 3,
              hora_apertura: '08:00',
              hora_cierre: '20:00',
              abierto: true,
            },
            {
              dia_semana: 5,
              hora_apertura: '08:00',
              hora_cierre: '20:00',
              abierto: true,
            },
          ]),
        },
      };

      const serviceConHorario = new ClasesService(
        mockPrismaConHorario as unknown as PrismaService,
        mockClasesRepo as ClasesRepository,
        mockReservasRepo as ReservasClasesRepository,
        mockListaEsperaRepo as ListaEsperaRepository,
      );

      await expect(
        serviceConHorario.actualizarClase(1, {
          horario_inicio: '19:30',
          horario_fin: '20:30',
        }),
      ).rejects.toThrow(BadRequestException);
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
      expect(resultado.horario_inicio).toBe('19:00');
      expect(resultado.horario_fin).toBe('20:00');
      expect(resultado.fecha_inicio).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(resultado.fecha_fin).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('debe lanzar BadRequestException en reemplazarClase si el horario excede el horario operativo', async () => {
      (mockClasesRepo.obtenerClasePorId as jest.Mock).mockResolvedValue(
        mockClase,
      );

      const mockPrismaConHorario = {
        sede_horario: {
          findMany: jest.fn().mockResolvedValue([
            {
              dia_semana: 1,
              hora_apertura: '08:00',
              hora_cierre: '20:00',
              abierto: true,
            },
          ]),
        },
      };

      const serviceConHorario = new ClasesService(
        mockPrismaConHorario as unknown as PrismaService,
        mockClasesRepo as ClasesRepository,
        mockReservasRepo as ReservasClasesRepository,
        mockListaEsperaRepo as ListaEsperaRepository,
      );

      const replaceDto: CreateClaseDto = {
        id_sede: 1,
        nombre: 'Spinning Tempranero Excesivo',
        capacidad_maxima: 20,
        horario_inicio: '06:00',
        horario_fin: '07:00',
        dias_semana: [1],
      };

      await expect(
        serviceConHorario.reemplazarClase(1, replaceDto),
      ).rejects.toThrow(BadRequestException);
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

  describe('Carga y guardado de descripción de clase (DTO y Servicio)', () => {
    it('debe transformar descripción con solo espacios en blanco o cadena vacía a null', async () => {
      const payloadVacio = {
        id_sede: 1,
        nombre: 'Spinning',
        capacidad_maxima: 20,
        descripcion: '',
      };
      const dtoVacio = plainToInstance(CreateClaseDto, payloadVacio);
      expect(dtoVacio.descripcion).toBeNull();
      const erroresVacio = await validate(dtoVacio);
      expect(erroresVacio).toHaveLength(0);

      const payloadEspacios = {
        id_sede: 1,
        nombre: 'Spinning',
        capacidad_maxima: 20,
        descripcion: '     ',
      };
      const dtoEspacios = plainToInstance(CreateClaseDto, payloadEspacios);
      expect(dtoEspacios.descripcion).toBeNull();
      const erroresEspacios = await validate(dtoEspacios);
      expect(erroresEspacios).toHaveLength(0);
    });

    it('debe recortar espacios externos de la descripción y admitir valores nulos', async () => {
      const payloadTexto = {
        id_sede: 1,
        nombre: 'Spinning',
        capacidad_maxima: 20,
        descripcion: '   Entrenamiento cardio de alta intensidad   ',
      };
      const dtoTexto = plainToInstance(CreateClaseDto, payloadTexto);
      expect(dtoTexto.descripcion).toBe(
        'Entrenamiento cardio de alta intensidad',
      );
      const erroresTexto = await validate(dtoTexto);
      expect(erroresTexto).toHaveLength(0);

      const payloadNull = {
        id_sede: 1,
        nombre: 'Spinning',
        capacidad_maxima: 20,
        descripcion: null,
      };
      const dtoNull = plainToInstance(CreateClaseDto, payloadNull);
      expect(dtoNull.descripcion).toBeNull();
      const erroresNull = await validate(dtoNull);
      expect(erroresNull).toHaveLength(0);
    });

    it('debe delegar la creación con descripción sanitizada al repositorio', async () => {
      const dto: CreateClaseDto = {
        id_sede: 1,
        nombre: 'Yoga Relax',
        capacidad_maxima: 15,
        descripcion: 'Clase relajante de respiración y estiramiento',
      };

      (mockClasesRepo.crearClase as jest.Mock).mockResolvedValue({
        id_clase: 88,
        ...dto,
        activo: true,
      });

      const resultado = await service.crearClase(dto);
      expect(resultado.descripcion).toBe(
        'Clase relajante de respiración y estiramiento',
      );
      expect(mockClasesRepo.crearClase).toHaveBeenCalledWith(dto);
    });
  });
});
