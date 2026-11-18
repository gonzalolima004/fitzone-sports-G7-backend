import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CanchasService } from './canchas.service';
import { CanchasRepository } from '../repositories/canchas.repository';
import { ReservasCanchasRepository } from '../repositories/reservas-canchas.repository';
import { SedeService } from '../../M0-sedes/services/sede.service';
import { PrecioContextService } from './precio-context.service';
import { PrecioEstandarStrategy } from '../patterns/strategy/precio-estandar.strategy';
import { DescuentoSocioStrategy } from '../patterns/strategy/descuento-socio.strategy';
import { HorarioPicoStrategy } from '../patterns/strategy/horario-pico.strategy';
import { Prisma } from '@prisma/client';

describe('CanchasService - cotizarTurno', () => {
  let service: CanchasService;
  let canchasRepository: Partial<jest.Mocked<CanchasRepository>>;
  let reservasRepository: Partial<jest.Mocked<ReservasCanchasRepository>>;
  let sedeService: Partial<jest.Mocked<SedeService>>;
  let precioContext: PrecioContextService;

  const mockCancha = {
    id_cancha: 1,
    nombre: 'Cancha Central Pádel',
    costo_base: new Prisma.Decimal('12000'),
    activo: true,
    disponible: true,
    id_cancha_tipo: 1,
    id_sede: 1,
    sede: {
      id_sede: 1,
      nombre: 'Sede Rosario Centro',
      direccion: 'Cordoba 1234',
      aforo_maximo: 100,
      activo: true,
      id_ciudad: 10, // Ciudad Rosario
    },
    cancha_tipo: {
      id_cancha_tipo: 1,
      descripcion: 'Pádel',
      activo: true,
    },
  };

  const mockUsuarioSocioRosario = {
    id_usuario: 5,
    dni: '12345678',
    email: 'socio.rosario@fitzone.com',
    password: 'hash',
    nombre: 'Lucas',
    apellido: 'Martínez',
    telefono: null,
    foto_url: null,
    modificado: new Date(),
    creacion: new Date(),
    qr_url: null,
    id_sede: 1, // Sede Rosario
    id_usuario_estado: 1,
    sede: {
      id_sede: 1,
      id_ciudad: 10, // Misma ciudad (Rosario)
    },
    usuario_rol: [
      {
        id_usuario: 5,
        id_rol: 1,
        fecha_asignacion: new Date(),
        rol: { id_rol: 1, nombre: 'socio' },
      },
    ],
    membresia: [
      {
        id_membresia: 1,
        id_usuario: 5,
        id_membresia_plan: 1,
        id_membresia_estado: 1, // Activa
        fecha_inicio: new Date('2026-11-01T00:00:00.000Z'),
        fecha_fin: new Date('2026-11-30T00:00:00.000Z'),
        renovacion_automatica: false,
        membresia_estado: {
          id_membresia_estado: 1,
          descripcion: 'Activa',
        },
      },
    ],
  };

  beforeEach(() => {
    canchasRepository = {
      obtenerPorId: jest.fn(),
      obtenerDatosUsuarioParaCotizacion: jest.fn(),
    };
    reservasRepository = {};
    sedeService = {};

    precioContext = new PrecioContextService(
      new PrecioEstandarStrategy(),
      new DescuentoSocioStrategy(),
      new HorarioPicoStrategy(),
    );

    service = new CanchasService(
      canchasRepository as unknown as CanchasRepository,
      reservasRepository as unknown as ReservasCanchasRepository,
      sedeService as unknown as SedeService,
      precioContext,
    );
  });

  it('debe calcular la cotización con descuento del 15% y recargo pico del 20% si es socio activo en misma ciudad y horario pico', async () => {
    (canchasRepository.obtenerPorId as jest.Mock).mockResolvedValue(mockCancha);
    (
      canchasRepository.obtenerDatosUsuarioParaCotizacion as jest.Mock
    ).mockResolvedValue(mockUsuarioSocioRosario);

    const resultado = await service.cotizarTurno(
      {
        canchaId: 1,
        fecha: '2026-11-15',
        hora: '19:00',
      },
      5,
    );

    expect(resultado).toEqual({
      costo_base: 12000,
      descuento_porcentaje: 15,
      monto_descuento: 1800,
      es_horario_pico: true,
      monto_recargo_pico: 2400,
      precio_final: 12600,
      es_socio: true,
      aplica_descuento_socio: true,
      motivo_sin_descuento: null,
    });
  });

  it('debe calcular turno pico a las 20:00 hs como horario pico', async () => {
    (canchasRepository.obtenerPorId as jest.Mock).mockResolvedValue(mockCancha);
    (
      canchasRepository.obtenerDatosUsuarioParaCotizacion as jest.Mock
    ).mockResolvedValue(mockUsuarioSocioRosario);

    const resultado = await service.cotizarTurno(
      {
        canchaId: 1,
        fecha: '2026-11-15',
        hora: '20:00',
      },
      5,
    );

    expect(resultado.es_horario_pico).toBe(true);
    expect(resultado.monto_recargo_pico).toBe(2400);
    expect(resultado.precio_final).toBe(12600);
  });

  it('no debe aplicar recargo pico en horarios normales (ej: 10:00 hs)', async () => {
    (canchasRepository.obtenerPorId as jest.Mock).mockResolvedValue(mockCancha);
    (
      canchasRepository.obtenerDatosUsuarioParaCotizacion as jest.Mock
    ).mockResolvedValue(mockUsuarioSocioRosario);

    const resultado = await service.cotizarTurno(
      {
        canchaId: 1,
        fecha: '2026-11-15',
        hora: '10:00',
      },
      5,
    );

    expect(resultado).toEqual({
      costo_base: 12000,
      descuento_porcentaje: 15,
      monto_descuento: 1800,
      es_horario_pico: false,
      monto_recargo_pico: 0,
      precio_final: 10200, // 12000 - 1800 + 0
      es_socio: true,
      aplica_descuento_socio: true,
      motivo_sin_descuento: null,
    });
  });

  it('debe rechazar descuento con motivo OTRA_CIUDAD si el socio es de una sede en distinta ciudad', async () => {
    (canchasRepository.obtenerPorId as jest.Mock).mockResolvedValue(mockCancha);
    // Socio de Santa Fe Capital (id_ciudad: 20), mientras cancha es de Rosario (id_ciudad: 10)
    (
      canchasRepository.obtenerDatosUsuarioParaCotizacion as jest.Mock
    ).mockResolvedValue({
      ...mockUsuarioSocioRosario,
      id_sede: 2,
      sede: {
        id_sede: 2,
        id_ciudad: 20, // Otra ciudad
      },
    });

    const resultado = await service.cotizarTurno(
      {
        canchaId: 1,
        fecha: '2026-11-15',
        hora: '19:00',
      },
      5,
    );

    expect(resultado).toEqual({
      costo_base: 12000,
      descuento_porcentaje: 0,
      monto_descuento: 0,
      es_horario_pico: true,
      monto_recargo_pico: 2400,
      precio_final: 14400, // 12000 - 0 + 2400
      es_socio: true,
      aplica_descuento_socio: false,
      motivo_sin_descuento: 'OTRA_CIUDAD',
    });
  });

  it('debe rechazar descuento con motivo SIN_MEMBRESIA si la membresía está vencida para la fecha del turno', async () => {
    (canchasRepository.obtenerPorId as jest.Mock).mockResolvedValue(mockCancha);
    (
      canchasRepository.obtenerDatosUsuarioParaCotizacion as jest.Mock
    ).mockResolvedValue({
      ...mockUsuarioSocioRosario,
      membresia: [
        {
          id_membresia: 1,
          id_usuario: 5,
          id_membresia_plan: 1,
          id_membresia_estado: 1,
          fecha_inicio: new Date('2026-10-01T00:00:00.000Z'),
          fecha_fin: new Date('2026-10-31T00:00:00.000Z'), // Venció en octubre, turno es en noviembre
          renovacion_automatica: false,
          membresia_estado: {
            id_membresia_estado: 1,
            descripcion: 'Activa',
          },
        },
      ],
    });

    const resultado = await service.cotizarTurno(
      {
        canchaId: 1,
        fecha: '2026-11-15',
        hora: '10:00',
      },
      5,
    );

    expect(resultado).toEqual({
      costo_base: 12000,
      descuento_porcentaje: 0,
      monto_descuento: 0,
      es_horario_pico: false,
      monto_recargo_pico: 0,
      precio_final: 12000,
      es_socio: true,
      aplica_descuento_socio: false,
      motivo_sin_descuento: 'SIN_MEMBRESIA',
    });
  });

  it('debe rechazar descuento con motivo ROL_EXTERNO si el usuario no tiene rol socio', async () => {
    (canchasRepository.obtenerPorId as jest.Mock).mockResolvedValue(mockCancha);
    (
      canchasRepository.obtenerDatosUsuarioParaCotizacion as jest.Mock
    ).mockResolvedValue({
      ...mockUsuarioSocioRosario,
      usuario_rol: [
        {
          id_usuario: 5,
          id_rol: 4,
          fecha_asignacion: new Date(),
          rol: { id_rol: 4, nombre: 'externo' },
        },
      ],
    });

    const resultado = await service.cotizarTurno(
      {
        canchaId: 1,
        fecha: '2026-11-15',
        hora: '19:00',
      },
      5,
    );

    expect(resultado).toEqual({
      costo_base: 12000,
      descuento_porcentaje: 0,
      monto_descuento: 0,
      es_horario_pico: true,
      monto_recargo_pico: 2400,
      precio_final: 14400,
      es_socio: false,
      aplica_descuento_socio: false,
      motivo_sin_descuento: 'ROL_EXTERNO',
    });
  });

  it('debe lanzar NotFoundException si la cancha no existe', async () => {
    (canchasRepository.obtenerPorId as jest.Mock).mockResolvedValue(null);
    (
      canchasRepository.obtenerDatosUsuarioParaCotizacion as jest.Mock
    ).mockResolvedValue(mockUsuarioSocioRosario);

    await expect(
      service.cotizarTurno(
        {
          canchaId: 999,
          fecha: '2026-11-15',
          hora: '19:00',
        },
        5,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('debe lanzar NotFoundException si la cancha está inactiva', async () => {
    (canchasRepository.obtenerPorId as jest.Mock).mockResolvedValue({
      ...mockCancha,
      activo: false,
    });
    (
      canchasRepository.obtenerDatosUsuarioParaCotizacion as jest.Mock
    ).mockResolvedValue(mockUsuarioSocioRosario);

    await expect(
      service.cotizarTurno(
        {
          canchaId: 1,
          fecha: '2026-11-15',
          hora: '19:00',
        },
        5,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('debe lanzar BadRequestException si el formato de fecha es inválido', async () => {
    await expect(
      service.cotizarTurno(
        {
          canchaId: 1,
          fecha: '2026-02-31', // Fecha inexistente
          hora: '19:00',
        },
        5,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('debe aplicar descuento de socio si la membresía está Suspendida pero tiene pago aprobado y ciclo vigente', async () => {
    (canchasRepository.obtenerPorId as jest.Mock).mockResolvedValue(mockCancha);
    (
      canchasRepository.obtenerDatosUsuarioParaCotizacion as jest.Mock
    ).mockResolvedValue({
      ...mockUsuarioSocioRosario,
      membresia: [
        {
          id_membresia: 2,
          id_usuario: 5,
          id_membresia_plan: 1,
          id_membresia_estado: 3,
          fecha_inicio: new Date('2026-01-01T00:00:00.000Z'),
          fecha_fin: new Date('2026-12-31T00:00:00.000Z'), // Pagó el año completo
          renovacion_automatica: false,
          membresia_estado: {
            id_membresia_estado: 3,
            descripcion: 'Suspendida',
          },
          pagos: [{ id_pago: 101 }], // Tiene pago aprobado
        },
      ],
    });

    const resultado = await service.cotizarTurno(
      {
        canchaId: 1,
        fecha: '2026-11-15',
        hora: '10:00', // No pico
      },
      5,
    );

    expect(resultado).toEqual({
      costo_base: 12000,
      descuento_porcentaje: 15,
      monto_descuento: 1800,
      es_horario_pico: false,
      monto_recargo_pico: 0,
      precio_final: 10200,
      es_socio: true,
      aplica_descuento_socio: true,
      motivo_sin_descuento: null,
    });
  });

  it('debe rechazar descuento si la membresía está Suspendida pero no tiene pago aprobado', async () => {
    (canchasRepository.obtenerPorId as jest.Mock).mockResolvedValue(mockCancha);
    (
      canchasRepository.obtenerDatosUsuarioParaCotizacion as jest.Mock
    ).mockResolvedValue({
      ...mockUsuarioSocioRosario,
      membresia: [
        {
          id_membresia: 2,
          id_usuario: 5,
          id_membresia_plan: 1,
          id_membresia_estado: 3,
          fecha_inicio: new Date('2026-01-01T00:00:00.000Z'),
          fecha_fin: new Date('2026-12-31T00:00:00.000Z'),
          renovacion_automatica: false,
          membresia_estado: {
            id_membresia_estado: 3,
            descripcion: 'Suspendida',
          },
          pagos: [], // Sin pago aprobado
        },
      ],
    });

    const resultado = await service.cotizarTurno(
      {
        canchaId: 1,
        fecha: '2026-11-15',
        hora: '10:00',
      },
      5,
    );

    expect(resultado).toEqual({
      costo_base: 12000,
      descuento_porcentaje: 0,
      monto_descuento: 0,
      es_horario_pico: false,
      monto_recargo_pico: 0,
      precio_final: 12000,
      es_socio: true,
      aplica_descuento_socio: false,
      motivo_sin_descuento: 'SIN_MEMBRESIA',
    });
  });
});
