import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CalendarioRepository } from '../repositories/calendario.repository';
import { CreateCalendarioDto } from '../dto/create-calendario.dto';
import { UpdateCalendarioDto } from '../dto/update-calendario.dto';
import { RangoFechasDto } from '../dto/rango-fechas.dto';
import { CalendarioResponseDto } from '../dto/calendario-response.dto';
import { aCalendarioRespuesta } from '../utils/calendario.mapper';
import {
  aFechaUtc,
  convertirRango,
  sinCambios,
} from '../utils/calendario.utils';
import { traducirErrorPrisma } from '../utils/errores-prisma';

const NO_ENCONTRADA = 'Fecha de calendario no encontrada';

@Injectable()
export class CalendarioService {
  constructor(private readonly calendarioRepository: CalendarioRepository) {}

  async findAll(filtros: RangoFechasDto): Promise<CalendarioResponseDto[]> {
    const { desde, hasta } = convertirRango(filtros);
    const fechas = await this.calendarioRepository.findAll(desde, hasta);
    return fechas.map(aCalendarioRespuesta);
  }

  async findById(id_calendario: number): Promise<CalendarioResponseDto> {
    const fecha = await this.calendarioRepository.findById(id_calendario);
    if (fecha === null) {
      throw new NotFoundException(NO_ENCONTRADA);
    }
    return aCalendarioRespuesta(fecha);
  }

  async create(dto: CreateCalendarioDto): Promise<CalendarioResponseDto> {
    const data: Prisma.calendarioCreateInput = {
      fecha: aFechaUtc(dto.fecha),
      descripcion: dto.descripcion,
      es_feriado: dto.es_feriado,
      // Un feriado no es día hábil salvo que se indique lo contrario.
      es_dia_habil: dto.es_dia_habil ?? (dto.es_feriado ? false : undefined),
    };

    try {
      return aCalendarioRespuesta(await this.calendarioRepository.create(data));
    } catch (error) {
      traducirErrorPrisma(error, {
        duplicado: `La fecha ${dto.fecha} ya está cargada en el calendario.`,
      });
    }
  }

  async update(
    id_calendario: number,
    dto: UpdateCalendarioDto,
  ): Promise<CalendarioResponseDto> {
    if (sinCambios(dto)) {
      throw new BadRequestException('No hay cambios para guardar.');
    }

    const data: Prisma.calendarioUpdateInput = {};
    if (dto.fecha !== undefined) data.fecha = aFechaUtc(dto.fecha);
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.es_feriado !== undefined) data.es_feriado = dto.es_feriado;
    if (dto.es_dia_habil !== undefined) {
      data.es_dia_habil = dto.es_dia_habil;
    } else if (dto.es_feriado === true) {
      data.es_dia_habil = false;
    }

    try {
      return aCalendarioRespuesta(
        await this.calendarioRepository.update(id_calendario, data),
      );
    } catch (error) {
      traducirErrorPrisma(error, {
        noEncontrado: NO_ENCONTRADA,
        duplicado: `La fecha ${dto.fecha} ya está cargada en el calendario.`,
      });
    }
  }

  async remove(id_calendario: number): Promise<CalendarioResponseDto> {
    try {
      return aCalendarioRespuesta(
        await this.calendarioRepository.delete(id_calendario),
      );
    } catch (error) {
      traducirErrorPrisma(error, {
        noEncontrado: NO_ENCONTRADA,
        referencia: {
          tipo: 'conflicto',
          mensaje:
            'La fecha tiene excepciones cargadas en una o más sedes. Eliminá esas excepciones antes de borrar la fecha.',
        },
      });
    }
  }
}
