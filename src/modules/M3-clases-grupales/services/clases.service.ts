import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { ClasesRepository } from '../repositories/clases.repository';
import { ReservasClasesRepository } from '../repositories/reservas-clases.repository';
import { ListaEsperaRepository } from '../repositories/lista-espera.repository';
import { CreateClaseDto } from '../dto/create-clase.dto';
import { UpdateClaseDto } from '../dto/update-clase.dto';
import { ClaseResponseDto } from '../dto/clase-response.dto';
import { ClaseAgendaResponseDto } from '../dto/clase-agenda-response.dto';
import { EliminarClaseResponseDto } from '../dto/eliminar-clase-response.dto';
import {
  crearFechaArgentina,
  normalizarHorarioHHmm,
  obtenerFechaHoyArgentina,
} from '../../../common/utils/date-time.util';

@Injectable()
export class ClasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clasesRepository: ClasesRepository,
    private readonly reservasRepository: ReservasClasesRepository,
    private readonly listaEsperaRepository: ListaEsperaRepository,
  ) {}

  private formatearClaseResponse(
    clase: {
      id_clase: number;
      id_sede: number;
      nombre: string;
      descripcion: string | null;
      capacidad_maxima: number;
      profesor?: string | null;
      sala?: string | null;
      horario_inicio?: string | null;
      horario_fin?: string | null;
      activo: boolean;
    },
    fechaBase?: string,
  ): ClaseResponseDto {
    const fechaRef = fechaBase || obtenerFechaHoyArgentina();
    const horarioInicio = normalizarHorarioHHmm(clase.horario_inicio, '09:00');
    const horarioFin = normalizarHorarioHHmm(clase.horario_fin, '10:00');

    const fechaInicioDate = crearFechaArgentina(fechaRef, horarioInicio);
    const fechaFinDate = crearFechaArgentina(fechaRef, horarioFin);

    return {
      id_clase: clase.id_clase,
      id_sede: clase.id_sede,
      nombre: clase.nombre,
      descripcion: clase.descripcion,
      capacidad_maxima: clase.capacidad_maxima,
      profesor: clase.profesor ?? null,
      sala: clase.sala ?? null,
      horario_inicio: horarioInicio,
      horario_fin: horarioFin,
      fecha_inicio: fechaInicioDate.toISOString(),
      fecha_fin: fechaFinDate.toISOString(),
      activo: clase.activo,
    };
  }

  async crearClase(createClaseDto: CreateClaseDto): Promise<ClaseResponseDto> {
    const nuevaClase = await this.clasesRepository.crearClase(createClaseDto);
    return this.formatearClaseResponse(nuevaClase);
  }

  async obtenerClasesPorSede(
    id_sede: number,
    fecha?: string,
  ): Promise<ClaseResponseDto[] | ClaseAgendaResponseDto[]> {
    const clases = await this.clasesRepository.obtenerClasesPorSede(id_sede);

    if (!fecha) {
      return clases.map((clase) => this.formatearClaseResponse(clase));
    }

    // Si se envía fecha (YYYY-MM-DD), calculamos la agenda del día con ocupación real:
    const agenda: ClaseAgendaResponseDto[] = await Promise.all(
      clases.map(async (clase) => {
        const horaInicioStr = normalizarHorarioHHmm(
          clase.horario_inicio,
          '09:00',
        );
        const horaFinStr = normalizarHorarioHHmm(clase.horario_fin, '10:00');

        const fechaInicio = crearFechaArgentina(fecha, horaInicioStr);
        const fechaFin = crearFechaArgentina(fecha, horaFinStr);

        const cuposOcupados =
          await this.reservasRepository.contarReservasConfirmadas(
            clase.id_clase,
            fechaInicio,
            fechaFin,
          );

        const enEspera =
          await this.listaEsperaRepository.contarInscriptosActivos(
            clase.id_clase,
            fechaInicio,
            fechaFin,
          );

        const cuposDisponibles = Math.max(
          0,
          clase.capacidad_maxima - cuposOcupados,
        );
        const estado: 'DISPONIBLE' | 'COMPLETO' =
          cuposDisponibles > 0 ? 'DISPONIBLE' : 'COMPLETO';

        return {
          id_clase: clase.id_clase,
          id_sede: clase.id_sede,
          nombre: clase.nombre,
          descripcion: clase.descripcion,
          profesor: clase.profesor ?? 'Profesor no asignado',
          sala: clase.sala ?? 'Sala Principal',
          horario_inicio: horaInicioStr,
          horario_fin: horaFinStr,
          fecha_inicio: fechaInicio.toISOString(),
          fecha_fin: fechaFin.toISOString(),
          capacidad_maxima: clase.capacidad_maxima,
          cupos_ocupados: cuposOcupados,
          cupos_disponibles: cuposDisponibles,
          en_espera: enEspera,
          estado,
        };
      }),
    );

    return agenda;
  }

  async obtenerClasePorId(id_clase: number): Promise<ClaseResponseDto> {
    const clase = await this.clasesRepository.obtenerClasePorId(id_clase);
    if (!clase) {
      throw new NotFoundException(`La clase con ID ${id_clase} no existe.`);
    }
    return this.formatearClaseResponse(clase);
  }

  async actualizarClase(
    id_clase: number,
    updateClaseDto: UpdateClaseDto,
  ): Promise<ClaseResponseDto> {
    // Verificamos que la clase exista antes de intentar actualizarla
    await this.obtenerClasePorId(id_clase);

    const claseActualizada = await this.clasesRepository.actualizarClase(
      id_clase,
      updateClaseDto,
    );

    return this.formatearClaseResponse(claseActualizada);
  }

  async reemplazarClase(
    id_clase: number,
    createClaseDto: CreateClaseDto,
  ): Promise<ClaseResponseDto> {
    // Verificamos que la clase exista antes de intentar reemplazarla
    await this.obtenerClasePorId(id_clase);

    const claseReemplazada = await this.clasesRepository.reemplazarClase(
      id_clase,
      createClaseDto,
    );

    return this.formatearClaseResponse(claseReemplazada);
  }

  async eliminarClase(id_clase: number): Promise<EliminarClaseResponseDto> {
    // 1. Verificar existencia de la clase
    await this.obtenerClasePorId(id_clase);

    const ahora = new Date();

    // 2. Transacción para cancelar reservas activas a futuro y realizar la baja lógica
    const reservasCanceladas = await this.prisma.$transaction(async (tx) => {
      const canceladas = await this.clasesRepository.cancelarReservasFuturas(
        id_clase,
        ahora,
        tx,
      );

      await this.clasesRepository.darDeBajaClase(id_clase, tx);

      return canceladas;
    });

    return {
      mensaje: 'Clase dada de baja exitosamente.',
      id_clase,
      activo: false,
      reservas_canceladas: reservasCanceladas,
    };
  }
}
