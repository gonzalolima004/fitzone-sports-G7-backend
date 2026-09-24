import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ListaEsperaRepository } from '../repositories/lista-espera.repository';
import { ClasesRepository } from '../repositories/clases.repository';
import { ReservasClasesRepository } from '../repositories/reservas-clases.repository';
import { InscribirListaEsperaDto } from '../dto/inscribir-lista-espera.dto';

@Injectable()
export class ListaEsperaService {
  constructor(
    private readonly listaEsperaRepository: ListaEsperaRepository,
    private readonly clasesRepository: ClasesRepository,
    private readonly reservasClasesRepository: ReservasClasesRepository,
  ) {}

  async inscribir(data: InscribirListaEsperaDto, id_usuario: number) {
    const clase = await this.clasesRepository.obtenerClasePorId(data.id_clase);
    if (!clase) {
      throw new NotFoundException('La clase no existe.');
    }

    // Convertimos las fechas a Date si vienen como string
    const fechaInicio = new Date(data.fecha_inicio);
    const fechaFin = new Date(data.fecha_fin);

    // Verificamos si ya está inscripto
    const inscripcionExistente =
      await this.listaEsperaRepository.existeInscripcionActiva(
        data.id_clase,
        id_usuario,
        fechaInicio,
        fechaFin,
      );
    if (inscripcionExistente) {
      throw new BadRequestException(
        'Ya estás en la lista de espera para este horario.',
      );
    }

    // Validar si la clase está realmente llena
    const reservasConfirmadas =
      await this.reservasClasesRepository.contarReservasConfirmadas(
        data.id_clase,
        fechaInicio,
        fechaFin,
      );

    if (reservasConfirmadas < clase.capacidad_maxima) {
      throw new BadRequestException(
        'La clase aún tiene cupos disponibles. Puedes realizar una reserva normal.',
      );
    }

    const inscripcion = await this.listaEsperaRepository.crearInscripcion(
      data.id_clase,
      id_usuario,
      fechaInicio,
      fechaFin,
    );

    const ordenEnCola =
      await this.listaEsperaRepository.contarInscriptosActivos(
        data.id_clase,
        fechaInicio,
        fechaFin,
      );

    return {
      message: 'Inscripto correctamente a la lista de espera',
      orden_en_cola: ordenEnCola,
      inscripcion,
    };
  }
}
