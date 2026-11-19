import { ConfigService } from '@nestjs/config';
import { SupabaseService } from './supabase.service';

describe('SupabaseService', () => {
  it('debe lanzar error si faltan variables SUPABASE_URL o SUPABASE_ANON_KEY', () => {
    const emptyConfig = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    expect(() => new SupabaseService(emptyConfig)).toThrow(
      'Faltan variables de entorno requeridas para Supabase',
    );
  });

  it('debe inicializar el cliente, consultar getUser y gestionar emitRealtimeEvent en estados SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT y error de envío', async () => {
    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'SUPABASE_URL') return 'https://xyz.supabase.co';
        if (key === 'SUPABASE_ANON_KEY') return 'anon-key-123';
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new SupabaseService(mockConfig);
    expect(service.getClient()).toBeDefined();

    const client = service.getClient() as unknown as {
      auth: { getUser: jest.Mock };
      channel: jest.Mock;
      removeChannel: jest.Mock;
    };

    client.auth.getUser = jest
      .fn()
      .mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const resUser = await service.getUser('tok-123');
    expect(resUser.user?.id).toBe('u1');

    client.removeChannel = jest.fn().mockResolvedValue('ok');

    // 1. SUBSCRIBED exitoso
    client.channel = jest.fn().mockReturnValue({
      send: jest.fn().mockResolvedValue('ok'),
      subscribe: jest.fn((cb: (status: string, err?: Error) => void) => {
        cb('SUBSCRIBED');
      }),
    });
    await expect(
      service.emitRealtimeEvent('canal-1', 'evt', { a: 1 }),
    ).resolves.toBeUndefined();

    // 2. Error directo en callback de subscribe
    client.channel = jest.fn().mockReturnValue({
      send: jest.fn(),
      subscribe: jest.fn((cb: (status: string, err?: Error) => void) => {
        cb('CHANNEL_ERROR', new Error('Sub error'));
      }),
    });
    await expect(
      service.emitRealtimeEvent('canal-1', 'evt', {}),
    ).rejects.toThrow('Sub error');

    // 3. Estado TIMED_OUT sin objeto err
    client.channel = jest.fn().mockReturnValue({
      send: jest.fn(),
      subscribe: jest.fn((cb: (status: string, err?: Error) => void) => {
        cb('TIMED_OUT');
      }),
    });
    await expect(
      service.emitRealtimeEvent('canal-1', 'evt', {}),
    ).rejects.toThrow('TIMED_OUT');

    // 4. Error al ejecutar channel.send
    client.channel = jest.fn().mockReturnValue({
      send: jest.fn().mockRejectedValue(new Error('Send failed')),
      subscribe: jest.fn((cb: (status: string, err?: Error) => void) => {
        cb('SUBSCRIBED');
      }),
    });
    await expect(
      service.emitRealtimeEvent('canal-1', 'evt', {}),
    ).rejects.toThrow('Send failed');
  });
});
