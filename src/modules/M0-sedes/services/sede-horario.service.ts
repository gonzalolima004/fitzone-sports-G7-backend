import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SedeHorarioRepository } from '../repositories/sede-horario.repository';
import { CreateSedeHorarioDto } from '../dto/create-sede-horario.dto';
import { UpdateSedeHorarioDto } from '../dto/update-sede-horario.dto';
import { SedeHorarioResponseDto } from '../dto/sede-horario-response.dto';
import { sinCambios, validarRangoHorario } from '../utils/calendario.utils';
import { traducirErrorPrisma } from '../utils/errores-prisma';

const NO_ENCONTRADO = 'Horario no encontrado en esta sede';

/** Las columnas de hora no admiten nulos: un día sin atención guarda 00:00. */
const SIN_ATENCION = '00:00';

const DIAS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

@Injectable()
export class SedeHorarioService {
  constructor(private readonly sedeHorarioRepository: SedeHorarioRepository) {}

  async findAll(id_sede: number): Promise<SedeHorarioResponseDto[]> {
    return this.sedeHorarioRepository.findBySede(id_sede);
  }

  async findById(
    id_sede: number,
    id_sede_horario: number,
  ): Promise<SedeHorarioResponseDto> {
    const horario = await this.sedeHorarioRepository.findById(
      id_sede_horario,
      id_sede,
    );
    if (horario === null) {
      throw new NotFoundException(NO_ENCONTRADO);
    }
    return horario;
  }

  async create(
    id_sede: number,
    dto: CreateSedeHorarioDto,
  ): Promise<SedeHorarioResponseDto> {
    const abierto = dto.abierto ?? true;
    const horas = abierto
      ? horasDeApertura(dto.hora_apertura, dto.hora_cierre)
      : { hora_apertura: SIN_ATENCION, hora_cierre: SIN_ATENCION };

    try {
      return await this.sedeHorarioRepository.create({
        id_sede,
        dia_semana: dto.dia_semana,
        abierto,
        ...horas,
      });
    } catch (error) {
      traducirErrorPrisma(error, {
        duplicado: mensajeDiaDuplicado(dto.dia_semana),
        referencia: {
          tipo: 'no-encontrado',
          mensaje: 'La sede especificada no existe',
        },
      });
    }
  }

  async update(
    id_sede: number,
    id_sede_horario: number,
    dto: UpdateSedeHorarioDto,
  ): Promise<SedeHorarioResponseDto> {
    if (sinCambios(dto)) {
      throw new BadRequestException('No hay cambios para guardar.');
    }

    const data: Prisma.sede_horarioUncheckedUpdateInput = {};
    if (dto.dia_semana !== undefined) {
      data.dia_semana = dto.dia_semana;
    }

    const indicaHoras =
      dto.hora_apertura !== undefined || dto.hora_cierre !== undefined;
    if (dto.abierto === false) {
      Object.assign(data, {
        abierto: false,
        hora_apertura: SIN_ATENCION,
        hora_cierre: SIN_ATENCION,
      });
    } else if (dto.abierto === true || indicaHoras) {
      Object.assign(data, horasDeApertura(dto.hora_apertura, dto.hora_cierre));
      if (dto.abierto === true) {
        data.abierto = true;
      }
    }

    try {
      return await this.sedeHorarioRepository.update(
        id_sede_horario,
        id_sede,
        data,
      );
    } catch (error) {
      traducirErrorPrisma(error, {
        noEncontrado: NO_ENCONTRADO,
        duplicado:
          dto.dia_semana !== undefined
            ? mensajeDiaDuplicado(dto.dia_semana)
            : undefined,
      });
    }
  }

  async remove(
    id_sede: number,
    id_sede_horario: number,
  ): Promise<SedeHorarioResponseDto> {
    try {
      return await this.sedeHorarioRepository.delete(id_sede_horario, id_sede);
    } catch (error) {
      traducirErrorPrisma(error, { noEncontrado: NO_ENCONTRADO });
    }
  }
}

/** Exige las dos horas de un día con atención y que la apertura sea antes. */
function horasDeApertura(
  hora_apertura?: string,
  hora_cierre?: string,
): { hora_apertura: string; hora_cierre: string } {
  if (!hora_apertura || !hora_cierre) {
    throw new BadRequestException(
      'Para un día con atención indicá la hora de apertura y la de cierre.',
    );
  }
  validarRangoHorario(hora_apertura, hora_cierre);
  return { hora_apertura, hora_cierre };
}

function mensajeDiaDuplicado(dia_semana: number): string {
  return `La sede ya tiene un horario cargado para el ${DIAS[dia_semana]}. Modificalo en lugar de crear otro.`;
}
