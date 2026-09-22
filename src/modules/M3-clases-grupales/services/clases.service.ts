import { Injectable, NotFoundException } from '@nestjs/common';
import { ClasesRepository } from '../repositories/clases.repository';
import { CreateClaseDto } from '../dto/create-clase.dto';
import { UpdateClaseDto } from '../dto/update-clase.dto';

@Injectable()
export class ClasesService {
  constructor(private readonly clasesRepository: ClasesRepository) {}

  async crearClase(createClaseDto: CreateClaseDto) {
    // Las validaciones de datos (como capacidad_maxima > 0) ya se ejecutan
    // a nivel del DTO mediante class-validator.
    // Si necesitas validar la existencia de la sede, podría requerirse inyectar SedesService.
    return await this.clasesRepository.crearClase(createClaseDto);
  }

  async obtenerClasesPorSede(id_sede: number) {
    return await this.clasesRepository.obtenerClasesPorSede(id_sede);
  }

  async obtenerClasePorId(id_clase: number) {
    const clase = await this.clasesRepository.obtenerClasePorId(id_clase);
    if (!clase) {
      throw new NotFoundException(`La clase con ID ${id_clase} no existe.`);
    }
    return clase;
  }

  async actualizarClase(id_clase: number, updateClaseDto: UpdateClaseDto) {
    // Verificamos que la clase exista antes de intentar actualizarla
    await this.obtenerClasePorId(id_clase);

    return await this.clasesRepository.actualizarClase(
      id_clase,
      updateClaseDto,
    );
  }
}
