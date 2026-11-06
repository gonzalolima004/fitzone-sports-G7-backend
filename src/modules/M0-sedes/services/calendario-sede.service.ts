import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { calendario_sede } from '@prisma/client';
import {
  CalendarioSedeRepository,
  DatosExcepcion,
} from '../repositories/calendario-sede.repository';
import { CreateCalendarioSedeDto } from '../dto/create-calendario-sede.dto';
import { UpdateCalendarioSedeDto } from '../dto/update-calendario-sede.dto';
import { RangoFechasDto } from '../dto/rango-fechas.dto';
import { CalendarioSedeResponseDto } from '../dto/calendario-sede-response.dto';
import { aExcepcionRespuesta } from '../utils/calendario.mapper';
import {
  aFechaUtc,
  convertirRango,
  sinCambios,
  validarRangoHorario,
} from '../utils/calendario.utils';
import { traducirErrorPrisma } from '../utils/errores-prisma';

const NO_ENCONTRADA = 'Excepción no encontrada en esta sede';

@Injectable()
export class CalendarioSedeService {
  constructor(
    private readonly calendarioSedeRepository: CalendarioSedeRepository,
  ) {}

  async findAll(
    id_sede: number,
    filtros: RangoFechasDto,
  ): Promise<CalendarioSedeResponseDto[]> {
    const { desde, hasta } = convertirRango(filtros);
    const excepciones = await this.calendarioSedeRepository.findBySede(
      id_sede,
      desde,
      hasta,
    );
    return excepciones.map((excepcion) =>
      aExcepcionRespuesta(excepcion, excepcion.calendario),
    );
  }

  async findById(
    id_sede: number,
    id_calendario_sede: number,
  ): Promise<CalendarioSedeResponseDto> {
    const excepcion = await this.calendarioSedeRepository.findById(
      id_calendario_sede,
      id_sede,
    );
    if (excepcion === null) {
      throw new NotFoundException(NO_ENCONTRADA);
    }
    return aExcepcionRespuesta(excepcion, excepcion.calendario);
  }

  async create(
    id_sede: number,
    dto: CreateCalendarioSedeDto,
  ): Promise<CalendarioSedeResponseDto> {
    const fecha = aFechaUtc(dto.fecha);
    const datos: DatosExcepcion = {
      ...resolverHorario(dto, true),
      motivo: dto.motivo,
    };

    // Sin transacción a propósito: si el alta falla después del upsert, la
    // fecha queda en el calendario como día común (no cambia el horario de
    // ninguna sede) y nos ahorramos dos idas más a la base.
    const dia = await this.calendarioSedeRepository.obtenerOCrearDia(fecha);
    try {
      const excepcion = await this.calendarioSedeRepository.create(
        id_sede,
        dia.id_calendario,
        datos,
      );
      return aExcepcionRespuesta(excepcion, dia);
    } catch (error) {
      traducirErrorPrisma(error, {
        duplicado: `La sede ya tiene una excepción cargada el ${dto.fecha}.`,
        referencia: {
          tipo: 'no-encontrado',
          mensaje: 'La sede especificada no existe',
        },
      });
    }
  }

  async update(
    id_sede: number,
    id_calendario_sede: number,
    dto: UpdateCalendarioSedeDto,
  ): Promise<CalendarioSedeResponseDto> {
    if (sinCambios(dto)) {
      throw new BadRequestException('No hay cambios para guardar.');
    }

    const datos: DatosExcepcion = { ...resolverHorario(dto, false) };
    if (dto.motivo !== undefined) {
      datos.motivo = dto.motivo;
    }
    const diaNuevo =
      dto.fecha !== undefined
        ? await this.calendarioSedeRepository.obtenerOCrearDia(
            aFechaUtc(dto.fecha),
          )
        : undefined;
    if (diaNuevo) {
      datos.id_calendario = diaNuevo.id_calendario;
    }

    let excepcion: calendario_sede;
    try {
      excepcion = await this.calendarioSedeRepository.update(
        id_calendario_sede,
        id_sede,
        datos,
      );
    } catch (error) {
      traducirErrorPrisma(error, {
        noEncontrado: NO_ENCONTRADA,
        duplicado: `La sede ya tiene una excepción cargada el ${dto.fecha}.`,
      });
    }
    const dia =
      diaNuevo ??
      (await this.calendarioSedeRepository.obtenerDia(excepcion.id_calendario));
    return aExcepcionRespuesta(excepcion, dia);
  }

  async remove(
    id_sede: number,
    id_calendario_sede: number,
  ): Promise<CalendarioSedeResponseDto> {
    let excepcion: calendario_sede;
    try {
      excepcion = await this.calendarioSedeRepository.delete(
        id_calendario_sede,
        id_sede,
      );
    } catch (error) {
      traducirErrorPrisma(error, { noEncontrado: NO_ENCONTRADA });
    }
    const dia = await this.calendarioSedeRepository.obtenerDia(
      excepcion.id_calendario,
    );
    return aExcepcionRespuesta(excepcion, dia);
  }
}

/**
 * Normaliza el estado y las horas de una excepción:
 * - cerrado true, o nada en el alta: cierra todo el día y sin horas.
 * - cerrado false, o solo horas: abre con horario especial; exige las dos
 *   horas y que la apertura sea anterior al cierre.
 * En una modificación que no trae estado ni horas devuelve undefined.
 */
function resolverHorario(
  dto: { cerrado?: boolean; hora_apertura?: string; hora_cierre?: string },
  esAlta: boolean,
): DatosExcepcion | undefined {
  const indicaHoras =
    dto.hora_apertura !== undefined || dto.hora_cierre !== undefined;

  let cerrado = dto.cerrado;
  if (cerrado === undefined && indicaHoras) {
    cerrado = false;
  } else if (cerrado === undefined && esAlta) {
    cerrado = true;
  }

  if (cerrado === undefined) {
    return undefined;
  }
  if (cerrado) {
    return { cerrado: true, hora_apertura: null, hora_cierre: null };
  }
  if (!dto.hora_apertura || !dto.hora_cierre) {
    throw new BadRequestException(
      'Para abrir con horario especial indicá la hora de apertura y la de cierre.',
    );
  }
  validarRangoHorario(dto.hora_apertura, dto.hora_cierre);
  return {
    cerrado: false,
    hora_apertura: dto.hora_apertura,
    hora_cierre: dto.hora_cierre,
  };
}
