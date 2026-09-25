import { Injectable, NotFoundException } from '@nestjs/common';
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
}
