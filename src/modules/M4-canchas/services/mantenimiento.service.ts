import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CanchasRepository } from '../repositories/canchas.repository';
import { CrearMantenimientoDto } from '../dto/crear-mantenimiento.dto';

export interface FiltrosConsultaMantenimiento {
  sedeId?: number;
  canchaId?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

@Injectable()
export class MantenimientoService {
  constructor(private readonly canchasRepository: CanchasRepository) {}

  async programarMantenimiento(id_cancha: number, dto: CrearMantenimientoDto) {
    // 1. Verificar existencia de la cancha
    const cancha = await this.canchasRepository.obtenerPorId(id_cancha);
    if (!cancha) {
      throw new NotFoundException('La cancha especificada no existe.');
    }

    // 2. Registrar el mantenimiento.
    // Como la grilla (US-05-02) ya lee esta tabla, bloqueará futuros turnos automáticamente,
    // y al no tocar la tabla cancha_reserva, las reservas ya tomadas quedan intactas (RF-12).
    const mantenimiento = await this.canchasRepository.crearMantenimiento({
      id_cancha,
      fecha_inicio: new Date(dto.fecha_inicio),
      fecha_fin: new Date(dto.fecha_fin),
      motivo: dto.motivo || 'Sin especificar',
    });

    return mantenimiento;
  }

  /**
   * Obtiene la lista de mantenimientos aplicando filtros opcionales.
   * Optimizado: realiza una única consulta en el repositorio sin consultas redundantes.
   */
  async obtenerMantenimientos(filtros: FiltrosConsultaMantenimiento) {
    let fechaInicioDate: Date | undefined;
    let fechaFinDate: Date | undefined;

    if (
      filtros.sedeId !== undefined &&
      (isNaN(filtros.sedeId) || filtros.sedeId <= 0)
    ) {
      throw new BadRequestException(
        'El ID de sede debe ser un número entero positivo.',
      );
    }

    if (
      filtros.canchaId !== undefined &&
      (isNaN(filtros.canchaId) || filtros.canchaId <= 0)
    ) {
      throw new BadRequestException(
        'El ID de cancha debe ser un número entero positivo.',
      );
    }

    if (filtros.fechaInicio) {
      fechaInicioDate = new Date(filtros.fechaInicio);
      if (isNaN(fechaInicioDate.getTime())) {
        throw new BadRequestException(
          'El parámetro fechaInicio no es una fecha válida.',
        );
      }
    }

    if (filtros.fechaFin) {
      // Si la fechaFin viene en formato YYYY-MM-DD sin hora, se extiende al final del día
      fechaFinDate =
        filtros.fechaFin.length === 10
          ? new Date(`${filtros.fechaFin}T23:59:59.999Z`)
          : new Date(filtros.fechaFin);

      if (isNaN(fechaFinDate.getTime())) {
        throw new BadRequestException(
          'El parámetro fechaFin no es una fecha válida.',
        );
      }
    }

    if (fechaInicioDate && fechaFinDate && fechaInicioDate > fechaFinDate) {
      throw new BadRequestException(
        'La fechaInicio no puede ser posterior a fechaFin.',
      );
    }

    return this.canchasRepository.obtenerMantenimientos({
      sedeId: filtros.sedeId,
      canchaId: filtros.canchaId,
      fechaInicio: fechaInicioDate,
      fechaFin: fechaFinDate,
    });
  }
}
