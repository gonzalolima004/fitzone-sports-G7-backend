import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SedeRepository } from '../repositories/sede.repository';
import { CiudadRepository } from '../repositories/ciudad.repository';
import { CreateSedeDto } from '../dto/create-sede.dto';
import { UpdateSedeDto } from '../dto/update-sede.dto';

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
   * Determina el horario operativo de la sede cruzando Calendario y SedeHorario
   */
  async getHorarioOperativo(id_sede: number, fechaStr: string) {
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

    const diaSemana = fechaValidada.getUTCDay();
    /*
    // Validar que la sede exista
    await this.findById(id_sede);

    // Parsear fecha en formato UTC para evitar saltos de día por zona horaria
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fechaDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const diaSemana = fechaDate.getUTCDay(); // 0: Domingo, 1: Lunes, ..., 6: Sábado
  */
    const { excepcion, horarioBase } =
      await this.sedeRepository.findHorarioOperativo(
        id_sede,
        diaSemana,
        fechaValidada,
      );

    // Caso 1: Excepción en el Calendario (Feriado o Cierre extraordinario)
    if (excepcion) {
      if (excepcion.cerrado) {
        return {
          abierto: false,
          hora_apertura: '00:00',
          hora_cierre: '00:00',
          motivo_cierre:
            excepcion.motivo ||
            excepcion.calendario?.descripcion ||
            'Sede cerrada por feriado / calendario oficial',
        };
      }

      return {
        abierto: true,
        hora_apertura: excepcion.hora_apertura || '08:00',
        hora_cierre: excepcion.hora_cierre || '20:00',
        es_horario_especial: true,
      };
    }

    // Caso 2: Horario semanal regular de la sede (sede_horario)
    if (horarioBase) {
      if (!horarioBase.abierto) {
        return {
          abierto: false,
          hora_apertura: '00:00',
          hora_cierre: '00:00',
          motivo_cierre: 'La sede no abre los días domingo / este día',
        };
      }

      return {
        abierto: true,
        hora_apertura: horarioBase.hora_apertura,
        hora_cierre: horarioBase.hora_cierre,
      };
    }

    // Caso 3: Fallback por defecto si aún no se configuraron horarios en BD
    return {
      abierto: true,
      hora_apertura: '08:00',
      hora_cierre: '22:00',
    };
  }
}
