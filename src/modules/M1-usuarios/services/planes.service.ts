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
    const plan = await this.membresiasRepository.createPlan(createPlanDto);
    return plainToInstance(PlanResponseDto, plan);
  }

  async findAll(): Promise<PlanResponseDto[]> {
    const planes = await this.membresiasRepository.findAllPlanes();
    return plainToInstance(PlanResponseDto, planes);
  }

  async findOne(id: number): Promise<PlanResponseDto> {
    const plan = await this.membresiasRepository.findOnePlan(id);
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
    const plan = await this.membresiasRepository.updatePlan(id, updatePlanDto);
    return plainToInstance(PlanResponseDto, plan);
  }

  async remove(id: number): Promise<PlanResponseDto> {
    const plan = await this.membresiasRepository.removePlan(id);
    return plainToInstance(PlanResponseDto, plan);
  }

  async obtenerEstados(): Promise<any[]> {
    return this.membresiasRepository.findAllEstados();
  }

  async obtenerEstadoPorId(id_membresia_estado: number): Promise<any> {
    return this.membresiasRepository.findOneEstado(id_membresia_estado);
  }
}
