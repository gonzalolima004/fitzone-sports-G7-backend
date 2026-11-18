import { Test, TestingModule } from '@nestjs/testing';
import {
  ClasesRealtimeService,
  ClaseCupoActualizadoEventDto,
  VacanteLiberadaEventDto,
} from '../services/clases-realtime.service';
import { SupabaseService } from '../../../common/supabase/supabase.service';

describe('ClasesRealtimeService', () => {
  let service: ClasesRealtimeService;
  let emitRealtimeEventMock: jest.Mock;

  beforeEach(async () => {
    emitRealtimeEventMock = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClasesRealtimeService,
        {
          provide: SupabaseService,
          useValue: {
            emitRealtimeEvent: emitRealtimeEventMock,
          },
        },
      ],
    }).compile();

    service = module.get<ClasesRealtimeService>(ClasesRealtimeService);
  });

  describe('notificarCupoActualizado', () => {
    it('debe emitir evento cupo_actualizado al canal de sede y de clase', async () => {
      const data: ClaseCupoActualizadoEventDto = {
        id_clase: 10,
        id_sede: 2,
        fecha: '2026-11-10',
        fecha_inicio: '2026-11-10T18:00:00.000Z',
        fecha_fin: '2026-11-10T19:00:00.000Z',
        cupos_ocupados: 19,
        cupos_disponibles: 1,
        capacidad_maxima: 20,
        en_espera: 0,
        estado: 'DISPONIBLE',
      };

      await service.notificarCupoActualizado(data);

      expect(emitRealtimeEventMock).toHaveBeenCalledTimes(2);
      expect(emitRealtimeEventMock).toHaveBeenCalledWith(
        'clases:sede:2',
        'cupo_actualizado',
        expect.objectContaining({
          id_clase: 10,
          id_sede: 2,
          cupos_disponibles: 1,
          capacidad_maxima: 20,
          estado: 'DISPONIBLE',
        }),
      );
      expect(emitRealtimeEventMock).toHaveBeenCalledWith(
        'clases:10',
        'cupo_actualizado',
        expect.objectContaining({
          id_clase: 10,
          id_sede: 2,
          cupos_disponibles: 1,
          capacidad_maxima: 20,
        }),
      );
    });

    it('no debe lanzar excepción si SupabaseService falla (tolerancia a fallos)', async () => {
      emitRealtimeEventMock.mockRejectedValueOnce(
        new Error('Fallo de conexión WebSocket Supabase'),
      );

      const data: ClaseCupoActualizadoEventDto = {
        id_clase: 10,
        id_sede: 2,
        fecha: '2026-11-10',
        fecha_inicio: '2026-11-10T18:00:00.000Z',
        fecha_fin: '2026-11-10T19:00:00.000Z',
        cupos_ocupados: 20,
        cupos_disponibles: 0,
        capacidad_maxima: 20,
        en_espera: 3,
        estado: 'COMPLETO',
      };

      await expect(
        service.notificarCupoActualizado(data),
      ).resolves.toBeUndefined();
    });
  });

  describe('notificarVacanteLiberada', () => {
    it('debe emitir a la sala de espera y al canal de sede', async () => {
      const data: VacanteLiberadaEventDto = {
        id_clase: 15,
        id_sede: 3,
        nombre_clase: 'CrossFit WOD',
        fecha_inicio: new Date('2026-11-11T14:00:00.000Z'),
        fecha_fin: new Date('2026-11-11T15:00:00.000Z'),
      };

      await service.notificarVacanteLiberada(data);

      expect(emitRealtimeEventMock).toHaveBeenCalledWith(
        'clases:espera:15',
        'vacante_liberada',
        expect.objectContaining({
          id_clase: 15,
          id_sede: 3,
          nombre_clase: 'CrossFit WOD',
          mensaje: expect.any(String) as string,
        }),
      );
      expect(emitRealtimeEventMock).toHaveBeenCalledWith(
        'clases:sede:3',
        'vacante_liberada',
        expect.objectContaining({
          id_clase: 15,
          id_sede: 3,
        }),
      );
    });

    it('debe notificar directamente al socio promovido si está definido', async () => {
      const data: VacanteLiberadaEventDto = {
        id_clase: 15,
        id_sede: 3,
        nombre_clase: 'CrossFit WOD',
        profesor: 'Carlos Giménez',
        sala: 'Box Principal',
        fecha_inicio: '2026-11-11T14:00:00.000Z',
        fecha_fin: '2026-11-11T15:00:00.000Z',
        id_usuario_promovido: 88,
      };

      await service.notificarVacanteLiberada(data);

      expect(emitRealtimeEventMock).toHaveBeenCalledWith(
        'usuarios:88:notificaciones',
        'promocion_lista_espera',
        expect.objectContaining({
          clase: 15,
          id_clase: 15,
          nombre_clase: 'CrossFit WOD',
          profesor: 'Carlos Giménez',
          sala: 'Box Principal',
          mensaje: expect.any(String) as string,
        }),
      );
    });

    it('no debe lanzar excepción si falla la emisión de vacante liberada', async () => {
      emitRealtimeEventMock.mockRejectedValue(new Error('Timeout Supabase'));

      const data: VacanteLiberadaEventDto = {
        id_clase: 15,
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
      };

      await expect(
        service.notificarVacanteLiberada(data),
      ).resolves.toBeUndefined();
    });
  });

  describe('notificarPromocionUsuario', () => {
    it('debe emitir al canal exclusivo del socio promocionado', async () => {
      await service.notificarPromocionUsuario(77, {
        id_clase: 5,
        clase: 5,
        id_sede: 1,
        nombre_clase: 'Spinning',
        profesor: 'Lucía',
        sala: 'Sala Ciclo',
        fecha_inicio: '2026-11-12T10:00:00.000Z',
        fecha_fin: '2026-11-12T11:00:00.000Z',
        mensaje: '¡Tu vacante fue confirmada!',
      });

      expect(emitRealtimeEventMock).toHaveBeenCalledWith(
        'usuarios:77:notificaciones',
        'promocion_lista_espera',
        expect.objectContaining({
          mensaje: '¡Tu vacante fue confirmada!',
          clase: 5,
          id_clase: 5,
          id_sede: 1,
          nombre_clase: 'Spinning',
        }),
      );
    });
  });
});
