import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ListaEsperaRepository } from '../repositories/lista-espera.repository';
import { ClasesRepository } from '../repositories/clases.repository';
import { ReservasClasesRepository } from '../repositories/reservas-clases.repository';
import { ClasesRealtimeService } from './clases-realtime.service';
import { InscribirListaEsperaDto } from '../dto/inscribir-lista-espera.dto';
import {
  claseAplicaEnFecha,
  obtenerRangoDiaArgentina,
} from '../../../common/utils/date-time.util';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { whereBeneficiosVigentes } from '../../M1-usuarios/utils/membresia-beneficios';

@Injectable()
export class ListaEsperaService {
  constructor(
    private readonly listaEsperaRepository: ListaEsperaRepository,
    private readonly clasesRepository: ClasesRepository,
    private readonly reservasClasesRepository: ReservasClasesRepository,
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly clasesRealtime?: ClasesRealtimeService,
  ) {}

  async inscribir(data: InscribirListaEsperaDto, id_usuario: number) {
    const clase = await this.clasesRepository.obtenerClasePorId(data.id_clase);
    if (!clase) {
      throw new NotFoundException('La clase no existe.');
    }

    const fechaInscripcionStr = data.fecha_inicio.slice(0, 10);
    if (!claseAplicaEnFecha(clase, fechaInscripcionStr)) {
      throw new BadRequestException(
        'La clase no se dicta en el día o fecha seleccionada.',
      );
    }

    // Convertimos las fechas a Date si vienen como string
    const fechaInicio = new Date(data.fecha_inicio);
    const fechaFin = new Date(data.fecha_fin);
    const ahora = new Date();

    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      throw new BadRequestException(
        'Las fechas proporcionadas no son válidas.',
      );
    }

    if (fechaFin <= fechaInicio) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio.',
      );
    }

    if (fechaInicio <= ahora) {
      throw new BadRequestException(
        'No se puede inscribir en lista de espera para una clase que ya comenzó.',
      );
    }

    // 1. Verificación de no mora del socio (RN-03)
    if (this.prisma?.membresia?.findFirst) {
      const membresiaActiva = await this.prisma.membresia.findFirst({
        where: whereBeneficiosVigentes(id_usuario, ahora),
      });

      if (!membresiaActiva) {
        throw new ForbiddenException(
          'El socio presenta mora o no tiene una membresía activa vigente (RN-03). Por favor, regulariza tu membresía.',
        );
      }
    }

    // 2. Verificación de misma ciudad entre socio y sede de la clase
    if (this.prisma?.usuario?.findUnique && this.prisma?.clase?.findUnique) {
      const socio = await this.prisma.usuario.findUnique({
        where: { id_usuario },
        include: { sede: true },
      });

      const claseConSede = await this.prisma.clase.findUnique({
        where: { id_clase: data.id_clase },
        include: { sede: true },
      });

      if (
        socio?.sede?.id_ciudad &&
        claseConSede?.sede?.id_ciudad &&
        socio.sede.id_ciudad !== claseConSede.sede.id_ciudad
      ) {
        throw new BadRequestException(
          'No puedes inscribirte en lista de espera en sedes de una ciudad diferente a la de tu sede de origen.',
        );
      }
    }

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

    if (this.clasesRealtime) {
      const cuposDisponibles = Math.max(
        0,
        clase.capacidad_maxima - reservasConfirmadas,
      );
      const estado: 'DISPONIBLE' | 'COMPLETO' =
        cuposDisponibles > 0 ? 'DISPONIBLE' : 'COMPLETO';

      void this.clasesRealtime.notificarCupoActualizado({
        id_clase: data.id_clase,
        id_sede: clase.id_sede,
        fecha: fechaInicio.toISOString().slice(0, 10),
        fecha_inicio: fechaInicio.toISOString(),
        fecha_fin: fechaFin.toISOString(),
        cupos_ocupados: reservasConfirmadas,
        cupos_disponibles: cuposDisponibles,
        capacidad_maxima: clase.capacidad_maxima,
        en_espera: ordenEnCola,
        estado,
      });
    }

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
