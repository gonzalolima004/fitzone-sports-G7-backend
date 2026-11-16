import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SedeRepository } from '../repositories/sede.repository';
import { CiudadRepository } from '../repositories/ciudad.repository';
import { CreateSedeDto } from '../dto/create-sede.dto';
import { UpdateSedeDto } from '../dto/update-sede.dto';
import { MOTIVOS_DE_CIERRE, SIN_ATENCION } from '../constants/sedes.constants';

/** Horario de una sede en una fecha, según su calendario y su horario semanal. */
export interface HorarioOperativo {
  abierto: boolean;
  hora_apertura: string;
  hora_cierre: string;
  motivo_cierre?: string;
  es_horario_especial?: boolean;
}

const cerrada = (motivo_cierre: string): HorarioOperativo => ({
  abierto: false,
  hora_apertura: SIN_ATENCION,
  hora_cierre: SIN_ATENCION,
  motivo_cierre,
});

@Injectable()
export class SedeService {
  constructor(
    private readonly sedeRepository: SedeRepository,
    private readonly ciudadRepository: CiudadRepository,
  ) {}

  async findAll() {
    return this.sedeRepository.findAllActive();
  }

  async findById(id_sede: number) {
    const sede = await this.sedeRepository.findById(id_sede);

    if (sede === null) {
      throw new NotFoundException('Sede no encontrada');
    }

    return sede;
  }

  async create(data: CreateSedeDto) {
    const ciudad = await this.ciudadRepository.findById(data.id_ciudad);

    if (ciudad === null) {
      throw new NotFoundException('La ciudad especificada no existe');
    }
    return this.sedeRepository.create(data);
  }

  async update(id_sede: number, data: UpdateSedeDto) {
    await this.findById(id_sede);

    if (data.id_ciudad !== undefined) {
      const ciudad = await this.ciudadRepository.findById(data.id_ciudad);

      if (ciudad === null) {
        throw new NotFoundException('La ciudad especificada no existe');
      }
    }

    return this.sedeRepository.update(id_sede, data);
  }

  async logicalDelete(id_sede: number) {
    await this.findById(id_sede);

    return this.sedeRepository.logicalDelete(id_sede);
  }

  /**
   * Horario operativo de la sede en una fecha. Primero manda la excepción del
   * calendario para ese día (cierre u horario especial) y después el horario
   * semanal. No hay horarios por defecto: si la sede no tiene horario cargado
   * para ese día, figura cerrada.
   */
  async getHorarioOperativo(
    id_sede: number,
    fechaStr: string,
  ): Promise<HorarioOperativo> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaStr ?? '')) {
      throw new BadRequestException('La fecha debe tener formato YYYY-MM-DD.');
    }
    const fechaValidada = new Date(`${fechaStr}T00:00:00.000Z`);
    if (
      Number.isNaN(fechaValidada.getTime()) ||
      fechaValidada.toISOString().slice(0, 10) !== fechaStr
    ) {
      throw new BadRequestException('La fecha no existe en el calendario.');
    }

    const { excepcion, horarioBase } =
      await this.sedeRepository.findHorarioOperativo(
        id_sede,
        fechaValidada.getUTCDay(),
        fechaValidada,
      );

    // 1. Excepción del calendario: cierre u horario especial de ese día.
    if (excepcion?.cerrado) {
      return cerrada(
        excepcion.motivo ||
          excepcion.calendario?.descripcion ||
          MOTIVOS_DE_CIERRE.CALENDARIO,
      );
    }
    // Una excepción abierta sin horas (cargada fuera de la API) no inventa
    // un horario: se usa el semanal de ese día.
    if (excepcion?.hora_apertura && excepcion.hora_cierre) {
      return {
        abierto: true,
        hora_apertura: excepcion.hora_apertura,
        hora_cierre: excepcion.hora_cierre,
        es_horario_especial: true,
      };
    }

    // 2. Horario semanal de la sede para ese día.
    if (horarioBase) {
      if (!horarioBase.abierto) {
        return cerrada(MOTIVOS_DE_CIERRE.DIA_SIN_ATENCION);
      }
      return {
        abierto: true,
        hora_apertura: horarioBase.hora_apertura,
        hora_cierre: horarioBase.hora_cierre,
        es_horario_especial: false,
      };
    }

    // 3. Sin datos para ese día. La existencia de la sede se consulta solo
    // en este caso, para no sumar una consulta a los casos habituales.
    await this.findById(id_sede);
    return cerrada(MOTIVOS_DE_CIERRE.SIN_HORARIO);
  }
}
