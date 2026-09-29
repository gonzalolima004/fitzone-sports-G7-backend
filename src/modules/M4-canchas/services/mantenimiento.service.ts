import { Injectable, NotFoundException } from '@nestjs/common';
import { CanchasRepository } from '../repositories/canchas.repository';
import { CrearMantenimientoDto } from '../dto/crear-mantenimiento.dto';

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
}
