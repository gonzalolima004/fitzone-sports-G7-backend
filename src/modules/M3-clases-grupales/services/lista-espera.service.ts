import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ListaEsperaRepository } from '../repositories/lista-espera.repository';
import { ClasesRepository } from '../repositories/clases.repository';
import { ReservasClasesRepository } from '../repositories/reservas-clases.repository';
import { InscribirListaEsperaDto } from '../dto/inscribir-lista-espera.dto';
import { obtenerRangoDiaArgentina } from '../../../common/utils/date-time.util';

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

  async obtenerMisInscripciones(id_usuario: number, fecha?: string) {
    let inicioDia: Date | undefined;
    let finDia: Date | undefined;

    if (fecha) {
      const rango = obtenerRangoDiaArgentina(fecha);
      inicioDia = rango.inicioDia;
      finDia = rango.finDia;
    }

    const inscripciones =
      await this.listaEsperaRepository.obtenerInscripcionesPorUsuario(
        id_usuario,
        inicioDia,
        finDia,
      );

    const resultado = await Promise.all(
      inscripciones.map(async (inscripcion) => {
        const ordenEnCola =
          await this.listaEsperaRepository.obtenerPosicionEnCola(
            inscripcion.id_clase,
            inscripcion.fecha_inicio,
            inscripcion.fecha_fin,
            inscripcion.id_clase_lista_espera,
          );

        return {
          id_clase_lista_espera: inscripcion.id_clase_lista_espera,
          id_clase: inscripcion.id_clase,
          id_usuario: inscripcion.id_usuario,
          fecha_inicio: inscripcion.fecha_inicio.toISOString(),
          fecha_fin: inscripcion.fecha_fin.toISOString(),
          orden_en_cola: ordenEnCola,
          id_clase_lista_espera_estado:
            inscripcion.id_clase_lista_espera_estado,
          estado:
            inscripcion.clase_lista_espera_estado?.descripcion?.toUpperCase() ||
            'EN_ESPERA',
          nombre_clase: inscripcion.clase?.nombre,
        };
      }),
    );

    return resultado;
  }
}
