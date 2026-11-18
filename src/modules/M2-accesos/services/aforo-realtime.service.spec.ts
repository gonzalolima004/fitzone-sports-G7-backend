import { Test, TestingModule } from '@nestjs/testing';
import { AforoRealtimeService } from './aforo-realtime.service';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import { AforoStatusResponseDto } from '../dto/aforo-status-response.dto';

describe('AforoRealtimeService', () => {
  let service: AforoRealtimeService;
  let channelMock: jest.Mock;
  let supabaseServiceMock: Partial<SupabaseService>;

  beforeEach(async () => {
    const mockChannel = {
      subscribe: jest.fn((callback: (status: string) => void) => {
        callback('SUBSCRIBED');
      }),
      send: jest.fn().mockResolvedValue('ok'),
    };

    channelMock = jest.fn().mockReturnValue(mockChannel);

    const mockSupabaseClient = {
      channel: channelMock,
      removeChannel: jest.fn().mockResolvedValue('ok'),
    };

    supabaseServiceMock = {
      getClient: () =>
        mockSupabaseClient as unknown as ReturnType<
          SupabaseService['getClient']
        >,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AforoRealtimeService,
        {
          provide: SupabaseService,
          useValue: supabaseServiceMock,
        },
      ],
    }).compile();

    service = module.get<AforoRealtimeService>(AforoRealtimeService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe emitir el evento de aforo correctamente mediante el canal broadcast de Supabase', () => {
    // Arrange
    const idSede = 1;
    const dtoEstadoAforo = new AforoStatusResponseDto({
      idSede: 1,
      aforoActual: 25,
      aforoMaximo: 100,
    });

    // Act
    service.emitirAforo(idSede, dtoEstadoAforo);

    // Assert
    expect(channelMock).toHaveBeenCalledWith('aforo:sede:1');
  });
});
