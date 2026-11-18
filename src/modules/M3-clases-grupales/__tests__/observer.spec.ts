import { ListaEsperaSubject } from '../patterns/observer/lista-espera.subject';
import { NotificacionRealtimeObserver } from '../patterns/observer/notificacion-realtime.observer';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import {
  ListaEsperaObserver,
  VacanteLiberadaEvento,
} from '../patterns/observer/lista-espera-observer.interface';
import { ClasesRealtimeService } from '../services/clases-realtime.service';

describe('Patrón Observer (Lista de Espera)', () => {
  describe('ListaEsperaSubject', () => {
    let subject: ListaEsperaSubject;

    beforeEach(() => {
      subject = new ListaEsperaSubject();
    });

    it('debe registrar observadores de forma idempotente (attach)', async () => {
      const updateFn = jest.fn().mockResolvedValue(undefined);
      const mockObserver: ListaEsperaObserver = {
        update: updateFn,
      };

      subject.attach(mockObserver);
      subject.attach(mockObserver); // Duplicado

      const evento: VacanteLiberadaEvento = {
        id_clase: 1,
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
        id_usuario_promovido: 10,
      };

      await subject.notify(evento);

      expect(updateFn).toHaveBeenCalledTimes(1);
    });

    it('debe desuscribir observadores correctamente (detach)', async () => {
      const updateFn = jest.fn().mockResolvedValue(undefined);
      const mockObserver: ListaEsperaObserver = {
        update: updateFn,
      };

      subject.attach(mockObserver);
      subject.detach(mockObserver);

      const evento: VacanteLiberadaEvento = {
        id_clase: 1,
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
      };

      await subject.notify(evento);

      expect(updateFn).not.toHaveBeenCalled();
    });

    it('debe notificar a múltiples observadores registrados', async () => {
      const updateFn1 = jest.fn().mockResolvedValue(undefined);
      const updateFn2 = jest.fn().mockResolvedValue(undefined);
      const observer1: ListaEsperaObserver = {
        update: updateFn1,
      };
      const observer2: ListaEsperaObserver = {
        update: updateFn2,
      };

      subject.attach(observer1);
      subject.attach(observer2);

      const evento: VacanteLiberadaEvento = {
        id_clase: 2,
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
      };

      await subject.notify(evento);

      expect(updateFn1).toHaveBeenCalledWith(evento);
      expect(updateFn2).toHaveBeenCalledWith(evento);
    });
  });

  describe('NotificacionRealtimeObserver', () => {
    let observer: NotificacionRealtimeObserver;
    let emitRealtimeEventMock: jest.Mock;
    let attachMock: jest.Mock;

    beforeEach(() => {
      emitRealtimeEventMock = jest.fn().mockResolvedValue(undefined);
      attachMock = jest.fn();

      const mockSupabaseService = {
        emitRealtimeEvent: emitRealtimeEventMock,
      } as unknown as SupabaseService;

      const mockSubject = {
        attach: attachMock,
      } as unknown as ListaEsperaSubject;

      observer = new NotificacionRealtimeObserver(
        mockSupabaseService,
        mockSubject,
      );
    });

    it('onModuleInit debe auto-adjuntarse al sujeto', () => {
      observer.onModuleInit();

      expect(attachMock).toHaveBeenCalledWith(observer);
    });

    it('update debe emitir evento al canal de la clase y al usuario promovido', async () => {
      const evento: VacanteLiberadaEvento = {
        id_clase: 10,
        fecha_inicio: new Date('2026-10-12T21:00:00.000Z'),
        fecha_fin: new Date('2026-10-12T22:00:00.000Z'),
        id_usuario_promovido: 99,
      };

      await observer.update(evento);

      expect(emitRealtimeEventMock).toHaveBeenCalledWith(
        'clases:espera:10',
        'vacante_liberada',
        expect.objectContaining({
          id_clase: 10,
          mensaje: expect.any(String) as string,
        }),
      );

      expect(emitRealtimeEventMock).toHaveBeenCalledWith(
        'usuarios:99:notificaciones',
        'promocion_lista_espera',
        expect.objectContaining({
          clase: 10,
          mensaje: expect.any(String) as string,
        }),
      );
    });

    it('update debe emitir también al canal de la sede si id_sede está presente', async () => {
      const evento: VacanteLiberadaEvento = {
        id_clase: 10,
        id_sede: 4,
        nombre_clase: 'Pilates',
        fecha_inicio: new Date('2026-10-12T21:00:00.000Z'),
        fecha_fin: new Date('2026-10-12T22:00:00.000Z'),
      };

      await observer.update(evento);

      expect(emitRealtimeEventMock).toHaveBeenCalledWith(
        'clases:espera:10',
        'vacante_liberada',
        expect.objectContaining({ id_clase: 10 }),
      );
      expect(emitRealtimeEventMock).toHaveBeenCalledWith(
        'clases:sede:4',
        'vacante_liberada',
        expect.objectContaining({ id_clase: 10, id_sede: 4 }),
      );
    });

    it('update no debe emitir al canal de usuario si no hay id_usuario_promovido', async () => {
      const evento: VacanteLiberadaEvento = {
        id_clase: 10,
        fecha_inicio: new Date('2026-10-12T21:00:00.000Z'),
        fecha_fin: new Date('2026-10-12T22:00:00.000Z'),
      };

      await observer.update(evento);

      expect(emitRealtimeEventMock).toHaveBeenCalledTimes(1);
      expect(emitRealtimeEventMock).toHaveBeenCalledWith(
        'clases:espera:10',
        'vacante_liberada',
        expect.anything(),
      );
    });

    it('update no debe propagar error si emitRealtimeEvent falla (tolerancia a fallos)', async () => {
      emitRealtimeEventMock.mockRejectedValue(new Error('Supabase caído'));

      const evento: VacanteLiberadaEvento = {
        id_clase: 10,
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
        id_usuario_promovido: 5,
      };

      await expect(observer.update(evento)).resolves.toBeUndefined();
    });

    it('update debe delegar en ClasesRealtimeService si está inyectado', async () => {
      const mockNotificarVacanteLiberada = jest
        .fn()
        .mockResolvedValue(undefined);
      const mockClasesRealtime = {
        notificarVacanteLiberada: mockNotificarVacanteLiberada,
      } as unknown as ClasesRealtimeService;

      const observerConRealtime = new NotificacionRealtimeObserver(
        {
          emitRealtimeEvent: emitRealtimeEventMock,
        } as unknown as SupabaseService,
        { attach: attachMock } as unknown as ListaEsperaSubject,
        mockClasesRealtime,
      );

      const evento: VacanteLiberadaEvento = {
        id_clase: 20,
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
      };

      await observerConRealtime.update(evento);

      expect(mockNotificarVacanteLiberada).toHaveBeenCalledWith(evento);
      expect(emitRealtimeEventMock).not.toHaveBeenCalled();
    });
  });
});
