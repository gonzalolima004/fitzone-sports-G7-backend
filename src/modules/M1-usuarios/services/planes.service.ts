import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { MembresiasRepository } from '../repositories/membresias.repository';
import { CrearPlanDto } from '../dto/crear-plan.dto';
import { ActualizarPlanDto } from '../dto/actualizar-plan.dto';
import { PlanResponseDto } from '../dto/plan-response.dto';

@Injectable()
export class PlanesService {
  constructor(private readonly membresiasRepository: MembresiasRepository) {}

  async create(createPlanDto: CrearPlanDto): Promise<PlanResponseDto> {
    const plan = await this.membresiasRepository.create(createPlanDto);
    return plainToInstance(PlanResponseDto, plan);
  }

  async findAll(): Promise<PlanResponseDto[]> {
    const planes = await this.membresiasRepository.findAll();
    return plainToInstance(PlanResponseDto, planes);
  }

  async findOne(id: number): Promise<PlanResponseDto> {
    const plan = await this.membresiasRepository.findOne(id);
    if (!plan) {
      throw new NotFoundException(`Plan con ID ${id} no encontrado`);
    }
    return plainToInstance(PlanResponseDto, plan);
  }

  async update(
    id: number,
    updatePlanDto: ActualizarPlanDto,
  ): Promise<PlanResponseDto> {
    await this.findOne(id); // Verifica existencia previa
    const plan = await this.membresiasRepository.update(id, updatePlanDto);
    return plainToInstance(PlanResponseDto, plan);
  }

  async remove(id: number): Promise<PlanResponseDto> {
    const plan = await this.membresiasRepository.remove(id);
    return plainToInstance(PlanResponseDto, plan);
  }

  async obtenerEstados(): Promise<any[]> {
    return this.membresiasRepository.obtenerEstados();
  }

  async obtenerEstadoPorId(id_membresia_estado: number): Promise<any> {
    return this.membresiasRepository.obtenerEstadoPorId(id_membresia_estado);
  }
}
