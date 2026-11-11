import { Test, TestingModule } from '@nestjs/testing';
import {
  CanchasRealtimeService,
  TurnoReservadoEventDto,
} from './canchas-realtime.service';
import { SupabaseService } from '../../../common/supabase/supabase.service';

describe('CanchasRealtimeService', () => {
  let service: CanchasRealtimeService;
  let supabaseServiceMock: {
    emitRealtimeEvent: jest.Mock;
  };

  beforeEach(async () => {
    supabaseServiceMock = {
      emitRealtimeEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CanchasRealtimeService,
        {
          provide: SupabaseService,
          useValue: supabaseServiceMock,
        },
      ],
    }).compile();

    service = module.get<CanchasRealtimeService>(CanchasRealtimeService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe emitir el evento en el canal correcto con los datos del turno reservado', async () => {
    const idSede = 5;
    const data: TurnoReservadoEventDto = {
      id_cancha: 12,
      fecha: '2026-11-20',
      hora_inicio: '18:00',
      hora_fin: '19:00',
    };

    await service.notificarTurnoReservado(idSede, data);

    expect(supabaseServiceMock.emitRealtimeEvent).toHaveBeenCalledTimes(1);
    expect(supabaseServiceMock.emitRealtimeEvent).toHaveBeenCalledWith(
      'canchas:sede:5',
      'turno_reservado',
      {
        id_cancha: 12,
        fecha: '2026-11-20',
        hora_inicio: '18:00',
        hora_fin: '19:00',
      },
    );
  });

  it('no debe lanzar excepción si SupabaseService.emitRealtimeEvent falla (tolerancia a fallos)', async () => {
    supabaseServiceMock.emitRealtimeEvent.mockRejectedValueOnce(
      new Error('Fallo de red en Supabase Realtime'),
    );

    const idSede = 2;
    const data: TurnoReservadoEventDto = {
      id_cancha: 4,
      fecha: '2026-11-21',
      hora_inicio: '10:00',
      hora_fin: '11:00',
    };

    // No debe lanzar excepción
    await expect(
      service.notificarTurnoReservado(idSede, data),
    ).resolves.not.toThrow();

    expect(supabaseServiceMock.emitRealtimeEvent).toHaveBeenCalledTimes(1);
  });
});
