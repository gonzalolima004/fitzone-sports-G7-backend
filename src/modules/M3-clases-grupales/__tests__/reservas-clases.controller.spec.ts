import { Test, TestingModule } from '@nestjs/testing';
import { ReservasClasesController } from '../controllers/reservas-clases.controller';
import { ReservasClasesService } from '../services/reservas-clases.service';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { CrearReservaClaseDto } from '../dto/crear-reserva-clase.dto';

describe('ReservasClasesController', () => {
  let controller: ReservasClasesController;
  let mockReservasService: Partial<ReservasClasesService>;

  beforeEach(async () => {
    mockReservasService = {
      obtenerMisReservas: jest.fn(),
      crearReserva: jest.fn(),
      cancelarReserva: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservasClasesController],
      providers: [
        {
          provide: ReservasClasesService,
          useValue: mockReservasService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReservasClasesController>(ReservasClasesController);
  });

  it('GET /reservas-clases/mis-reservas debe llamar a service.obtenerMisReservas', async () => {
    const mockRespuesta = [
      {
        id_clase_reserva: 1,
        id_clase: 10,
        id_usuario: 5,
        fecha_inicio: '2026-10-12T21:00:00.000Z',
        fecha_fin: '2026-10-12T22:00:00.000Z',
        id_clase_reserva_estado: 1,
        estado: 'CONFIRMADA',
        nombre_clase: 'Spinning Funcional',
      },
    ];
    (mockReservasService.obtenerMisReservas as jest.Mock).mockResolvedValue(
      mockRespuesta,
    );

    const resultado = await controller.obtenerMisReservas(5, '2026-10-12');

    expect(mockReservasService.obtenerMisReservas).toHaveBeenCalledWith(
      5,
      '2026-10-12',
    );
    expect(resultado).toEqual(mockRespuesta);
  });

  it('POST /reservas-clases debe llamar a service.crearReserva', async () => {
    const dto: CrearReservaClaseDto = {
      id_clase: 10,
      fecha_inicio: '2026-10-12T21:00:00.000Z',
      fecha_fin: '2026-10-12T22:00:00.000Z',
    };
    const mockRespuesta = {
      id_clase_reserva: 1,
      id_clase: 10,
      id_usuario: 5,
      id_clase_reserva_estado: 1,
      fecha_inicio: new Date(dto.fecha_inicio),
      fecha_fin: new Date(dto.fecha_fin),
    };
    (mockReservasService.crearReserva as jest.Mock).mockResolvedValue(
      mockRespuesta,
    );

    const resultado = await controller.crearReserva(dto, 5);

    expect(mockReservasService.crearReserva).toHaveBeenCalledWith(dto, 5);
    expect(resultado).toEqual(mockRespuesta);
  });

  it('DELETE /reservas-clases/:id debe llamar a service.cancelarReserva', async () => {
    const mockRespuesta = {
      penalidadAplicada: false,
      mensaje: 'Reserva cancelada exitosamente sin penalidad.',
      reserva: { id_clase_reserva: 1, id_clase_reserva_estado: 4 },
      cupo_reasignado: true,
    };
    (mockReservasService.cancelarReserva as jest.Mock).mockResolvedValue(
      mockRespuesta,
    );

    const resultado = await controller.cancelarReserva(1, 5);

    expect(mockReservasService.cancelarReserva).toHaveBeenCalledWith(1, 5);
    expect(resultado).toEqual(mockRespuesta);
  });
});
