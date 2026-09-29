import { Injectable, NotFoundException } from '@nestjs/common';
import { CiudadRepository } from '../repositories/ciudad.repository';
import { CreateCiudadDto } from '../dto/create-ciudad.dto';
import { UpdateCiudadDto } from '../dto/update-ciudad.dto';

@Injectable()
export class CiudadService {
  constructor(private readonly ciudadRepository: CiudadRepository) {}

  async findAll() {
    return this.ciudadRepository.findAllActive();
  }

  async findById(id_ciudad: number) {
    const ciudad = await this.ciudadRepository.findById(id_ciudad);

    if (ciudad === null) {
      throw new NotFoundException('Ciudad no encontrada');
    }

    return ciudad;
  }

  async create(data: CreateCiudadDto) {
    return this.ciudadRepository.create(data);
  }

  async update(id_ciudad: number, data: UpdateCiudadDto) {
    await this.findById(id_ciudad);

    return this.ciudadRepository.update(id_ciudad, data);
  }

  async logicalDelete(id_ciudad: number) {
    await this.findById(id_ciudad);

    return this.ciudadRepository.logicalDelete(id_ciudad);
  }
}
