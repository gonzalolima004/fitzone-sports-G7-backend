import { Test, TestingModule } from '@nestjs/testing';
import { ListaEsperaController } from '../controllers/lista-espera.controller';
import { ListaEsperaService } from '../services/lista-espera.service';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { InscribirListaEsperaDto } from '../dto/inscribir-lista-espera.dto';

describe('ListaEsperaController', () => {
  let controller: ListaEsperaController;
  let mockListaEsperaService: Partial<ListaEsperaService>;

  beforeEach(async () => {
    mockListaEsperaService = {
      obtenerMisInscripciones: jest.fn(),
      inscribir: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListaEsperaController],
      providers: [
        {
          provide: ListaEsperaService,
          useValue: mockListaEsperaService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ListaEsperaController>(ListaEsperaController);
  });

  it('GET /lista-espera/mis-inscripciones debe llamar a service.obtenerMisInscripciones', async () => {
    const mockRespuesta = [
      {
        id_clase_lista_espera: 10,
        id_clase: 1,
        id_usuario: 5,
        fecha_inicio: '2026-10-12T21:00:00.000Z',
        fecha_fin: '2026-10-12T22:00:00.000Z',
        orden_en_cola: 1,
        id_clase_lista_espera_estado: 1,
        estado: 'EN ESPERA',
        nombre_clase: 'Spinning Funcional',
      },
    ];
    (
      mockListaEsperaService.obtenerMisInscripciones as jest.Mock
    ).mockResolvedValue(mockRespuesta);

    const resultado = await controller.obtenerMisInscripciones(5, '2026-10-12');

    expect(mockListaEsperaService.obtenerMisInscripciones).toHaveBeenCalledWith(
      5,
      '2026-10-12',
    );
    expect(resultado).toEqual(mockRespuesta);
  });

  it('POST /lista-espera/inscribir debe llamar a service.inscribir', async () => {
    const dto: InscribirListaEsperaDto = {
      id_clase: 1,
      fecha_inicio: '2026-10-12T21:00:00.000Z',
      fecha_fin: '2026-10-12T22:00:00.000Z',
    };
    const mockRespuesta = {
      message: 'Inscripto correctamente a la lista de espera',
      orden_en_cola: 2,
      inscripcion: {
        id_clase_lista_espera: 12,
        id_clase: 1,
        id_usuario: 5,
      },
    };
    (mockListaEsperaService.inscribir as jest.Mock).mockResolvedValue(
      mockRespuesta,
    );

    const resultado = await controller.inscribir(dto, 5);

    expect(mockListaEsperaService.inscribir).toHaveBeenCalledWith(dto, 5);
    expect(resultado).toEqual(mockRespuesta);
  });
});
