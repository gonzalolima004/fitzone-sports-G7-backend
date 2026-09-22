import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CanchasRepository } from '../repositories/canchas.repository';
import { CrearCanchaDto } from '../dto/crear-cancha.dto';
import { ActualizarCanchaDto } from '../dto/actualizar-cancha.dto';

@Injectable()
export class CanchasService {
  constructor(private readonly canchasRepository: CanchasRepository) {}

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
}
