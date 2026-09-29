import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CanchasRepository } from '../repositories/canchas.repository';
import { CrearCanchaDto } from '../dto/crear-cancha.dto';
import { ActualizarCanchaDto } from '../dto/actualizar-cancha.dto';
import { ReservasCanchasRepository } from '../repositories/reservas-canchas.repository';
import {
  DisponibilidadSlotResponseDto,
  SlotEstado,
} from '../dto/disponibilidad-slot-response.dto';

@Injectable()
export class CanchasService {
  constructor(
    private readonly canchasRepository: CanchasRepository,
    private readonly reservasRepository: ReservasCanchasRepository,
  ) {}

  async crearCancha(dto: CrearCanchaDto) {
    // Validación 1: Verificar que la sede exista
    const sedeValida = await this.canchasRepository.existeSede(dto.id_sede);
    if (!sedeValida) {
      throw new BadRequestException(`La sede con ID ${dto.id_sede} no existe.`);
    }

    // Validación 2: Verificar que el tipo de cancha exista
    const tipoValido = await this.canchasRepository.existeTipoCancha(
      dto.id_cancha_tipo,
    );
    if (!tipoValido) {
      throw new BadRequestException(
        `El tipo de cancha con ID ${dto.id_cancha_tipo} no existe.`,
      );
    }

    return this.canchasRepository.crear(dto);
  }

  async listarCanchas() {
    return this.canchasRepository.obtenerTodasActivas();
  }

  async obtenerCancha(id: number) {
    const cancha = await this.canchasRepository.obtenerPorId(id);
    if (!cancha || !cancha.activo) {
      throw new NotFoundException(
        `La cancha con ID ${id} no existe o está inactiva.`,
      );
    }
    return cancha;
  }

  async actualizarCancha(id: number, dto: ActualizarCanchaDto) {
    // Validar existencia previa
    await this.obtenerCancha(id);
    return this.canchasRepository.actualizar(id, dto);
  }

  async eliminarCancha(id: number) {
    // Validar existencia previa
    await this.obtenerCancha(id);
    return this.canchasRepository.borradoLogico(id);
  }

  async obtenerDisponibilidad(
    id_cancha: number,
    fechaStr: string,
  ): Promise<DisponibilidadSlotResponseDto[]> {
    // 1. Validar existencia de la cancha
    await this.obtenerCancha(id_cancha);

    // 2. Configurar límites del día (08:00 a 23:00)
    const fechaBase = new Date(`${fechaStr}T00:00:00Z`);
    const inicioDia = new Date(fechaBase.setUTCHours(8, 0, 0, 0));
    const finDia = new Date(fechaBase.setUTCHours(23, 0, 0, 0));

    // 3. Obtener bloqueos (Reservas y Mantenimientos) en paralelo para mayor velocidad
    const [reservas, mantenimientos] = await Promise.all([
      this.reservasRepository.obtenerReservasPorFecha(
        id_cancha,
        inicioDia,
        finDia,
      ),
      this.reservasRepository.obtenerMantenimientosPorFecha(
        id_cancha,
        inicioDia,
        finDia,
      ),
    ]);

    // 4. Generar Slots en memoria (O(n))
    const slots: DisponibilidadSlotResponseDto[] = [];
    let horaActual = new Date(inicioDia);

    while (horaActual < finDia) {
      const horaSiguiente = new Date(horaActual);
      horaSiguiente.setUTCHours(horaActual.getUTCHours() + 1);

      // Evaluar colisiones
      const enMantenimiento = mantenimientos.some(
        (m) => m.fecha_inicio < horaSiguiente && m.fecha_fin > horaActual,
      );

      const reservado = reservas.some(
        (r) => r.fecha_inicio < horaSiguiente && r.fecha_fin > horaActual,
      );

      let estado = SlotEstado.DISPONIBLE;
      if (enMantenimiento) estado = SlotEstado.MANTENIMIENTO;
      else if (reservado) estado = SlotEstado.RESERVADO;

      slots.push({
        horaInicio: horaActual.toISOString().slice(11, 16),
        horaFin: horaSiguiente.toISOString().slice(11, 16),
        estado,
      });

      horaActual = horaSiguiente;
    }

    return slots;
  }
}
