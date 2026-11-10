import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../../common/supabase/supabase.service';

export interface ClaseCupoActualizadoEventDto {
  id_clase: number;
  id_sede: number;
  fecha: string; // YYYY-MM-DD
  fecha_inicio: string; // ISO 8601
  fecha_fin: string; // ISO 8601
  cupos_ocupados: number;
  cupos_disponibles: number;
  capacidad_maxima: number;
  en_espera?: number;
  estado: 'DISPONIBLE' | 'COMPLETO';
}

export interface VacanteLiberadaEventDto {
  id_clase: number;
  id_sede?: number;
  nombre_clase?: string;
  profesor?: string | null;
  sala?: string | null;
  fecha_inicio: string | Date;
  fecha_fin: string | Date;
  id_usuario_promovido?: number;
  mensaje?: string;
}

export interface PromocionListaEsperaEventDto {
  id_clase: number;
  clase: number;
  id_sede?: number;
  nombre_clase?: string;
  profesor?: string | null;
  sala?: string | null;
  fecha_inicio: string | Date;
  fecha_fin: string | Date;
  mensaje: string;
}

@Injectable()
export class ClasesRealtimeService {
  private readonly logger = new Logger(ClasesRealtimeService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Envuelve cualquier emisión a Supabase Realtime en un timeout estricto
   * para evitar promesas colgadas o bloqueos ante latencia en el WebSocket.
   */
  private async ejecutarConTimeout<T>(
    promesa: Promise<T>,
    timeoutMs = 3000,
  ): Promise<T> {
    return await Promise.race([
      promesa,
      new Promise<T>((_, reject) => {
        const timer = setTimeout(
          () =>
            reject(
              new Error(
                `Timeout (${timeoutMs}ms) en comunicación Realtime con Supabase`,
              ),
            ),
          timeoutMs,
        );
        if (typeof timer.unref === 'function') {
          timer.unref();
        }
      }),
    ]);
  }

  /**
   * Notifica en tiempo real vía Supabase Realtime Broadcast que los cupos de una clase
   * han cambiado (por reserva, cancelación o actualización de capacidad).
   * Emite en el canal de la sede (`clases:sede:${idSede}`) y en el canal puntual (`clases:${idClase}`).
   */
  async notificarCupoActualizado(
    data: ClaseCupoActualizadoEventDto,
  ): Promise<void> {
    const canalSede = `clases:sede:${data.id_sede}`;
    const canalClase = `clases:${data.id_clase}`;
    const evento = 'cupo_actualizado';

    const payload: Record<string, unknown> = {
      id_clase: data.id_clase,
      id_sede: data.id_sede,
      fecha: data.fecha,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
      cupos_ocupados: data.cupos_ocupados,
      cupos_disponibles: data.cupos_disponibles,
      capacidad_maxima: data.capacidad_maxima,
      en_espera: data.en_espera ?? 0,
      estado: data.estado,
    };

    try {
      this.logger.log(
        `Emitiendo broadcast [${evento}] en canal [${canalSede}] y [${canalClase}] para clase ${data.id_clase} (${data.cupos_disponibles}/${data.capacidad_maxima} disponibles)`,
      );

      await Promise.all([
        this.ejecutarConTimeout(
          this.supabaseService.emitRealtimeEvent(canalSede, evento, payload),
        ),
        this.ejecutarConTimeout(
          this.supabaseService.emitRealtimeEvent(canalClase, evento, payload),
        ),
      ]);

      this.logger.log(
        `Broadcast [${evento}] emitido exitosamente para clase ${data.id_clase}`,
      );
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error al emitir evento realtime [${evento}] para clase ${data.id_clase}: ${errorMsg}`,
      );
      // Tolerancia a fallos: no relanzar el error para preservar la integridad de la transacción de negocio
    }
  }

  /**
   * Notifica en tiempo real que se ha liberado una vacante en una clase donde había lista de espera.
   * Emite al canal de la sala de espera (`clases:espera:${idClase}`), canal de sede (`clases:sede:${idSede}`)
   * y directamente al usuario promovido (`usuarios:${idUsuario}:notificaciones`).
   */
  async notificarVacanteLiberada(data: VacanteLiberadaEventDto): Promise<void> {
    const canalEspera = `clases:espera:${data.id_clase}`;
    const evento = 'vacante_liberada';

    const payload: Record<string, unknown> = {
      id_clase: data.id_clase,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
      mensaje: data.mensaje || '¡Una vacante se ha liberado en esta clase!',
      ...(data.id_sede ? { id_sede: data.id_sede } : {}),
      ...(data.nombre_clase ? { nombre_clase: data.nombre_clase } : {}),
      ...(data.id_usuario_promovido
        ? { id_usuario_promovido: data.id_usuario_promovido }
        : {}),
    };

    try {
      this.logger.log(
        `Emitiendo broadcast [${evento}] en canal [${canalEspera}] para clase ${data.id_clase}`,
      );

      const promesas: Promise<void>[] = [
        this.ejecutarConTimeout(
          this.supabaseService.emitRealtimeEvent(canalEspera, evento, payload),
        ),
      ];

      if (data.id_sede) {
        promesas.push(
          this.ejecutarConTimeout(
            this.supabaseService.emitRealtimeEvent(
              `clases:sede:${data.id_sede}`,
              evento,
              payload,
            ),
          ),
        );
      }

      if (data.id_usuario_promovido) {
        promesas.push(
          this.notificarPromocionUsuario(data.id_usuario_promovido, {
            id_clase: data.id_clase,
            clase: data.id_clase,
            id_sede: data.id_sede,
            nombre_clase: data.nombre_clase,
            profesor: data.profesor,
            sala: data.sala,
            fecha_inicio: data.fecha_inicio,
            fecha_fin: data.fecha_fin,
            mensaje:
              data.mensaje ||
              '¡Se ha liberado un cupo y se te ha asignado la vacante!',
          }),
        );
      }

      await Promise.all(promesas);

      this.logger.log(
        `Broadcast [${evento}] emitido exitosamente para clase ${data.id_clase}`,
      );
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error al emitir evento realtime [${evento}] para clase ${data.id_clase}: ${errorMsg}`,
      );
    }
  }

  /**
   * Notifica de forma directa y personalizada a un socio que ha sido promovido de la lista de espera
   * a una reserva confirmada en la clase.
   */
  async notificarPromocionUsuario(
    idUsuario: number,
    data: PromocionListaEsperaEventDto,
  ): Promise<void> {
    const canalUsuario = `usuarios:${idUsuario}:notificaciones`;
    const evento = 'promocion_lista_espera';

    const payload: Record<string, unknown> = {
      mensaje: data.mensaje,
      clase: data.clase,
      id_clase: data.id_clase,
      ...(data.nombre_clase ? { nombre_clase: data.nombre_clase } : {}),
      ...(data.id_sede ? { id_sede: data.id_sede } : {}),
      ...(data.profesor ? { profesor: data.profesor } : {}),
      ...(data.sala ? { sala: data.sala } : {}),
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
    };

    try {
      this.logger.log(
        `Notificando al usuario promovido ID: ${idUsuario} en canal [${canalUsuario}]`,
      );

      await this.ejecutarConTimeout(
        this.supabaseService.emitRealtimeEvent(canalUsuario, evento, payload),
      );

      this.logger.log(
        `Notificación [${evento}] entregada en canal [${canalUsuario}]`,
      );
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error al notificar al usuario ${idUsuario} en canal [${canalUsuario}]: ${errorMsg}`,
      );
    }
  }
}
