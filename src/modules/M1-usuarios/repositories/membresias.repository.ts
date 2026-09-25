import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { CrearPlanDto } from '../dto/crear-plan.dto';
import { ActualizarPlanDto } from '../dto/actualizar-plan.dto';

@Injectable()
export class MembresiasRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // OPERACIONES SOBRE MBR_PLAN (membresia_plan)
  // ==========================================

  /**
   * Crea un nuevo plan de membresía en el catálogo
   */
  create(data: CrearPlanDto) {
    return this.prisma.membresiaPlan.create({ data });
  }

  /**
   * Obtiene la lista de planes de membresía
   */
  findAll() {
    return this.prisma.membresiaPlan.findMany();
  }

  /**
   * Obtiene un plan de membresía por su ID
   */
  findOne(id: number) {
    return this.prisma.membresiaPlan.findUnique({
      where: { id_membresia_plan: id },
    });
  }

  /**
   * Actualiza un plan de membresía por su ID
   */
  update(id: number, updatePlanDto: ActualizarPlanDto) {
    return this.prisma.membresiaPlan.update({
      where: { id_membresia_plan: id },
      data: updatePlanDto,
    });
  }

  /**
   * Elimina un plan de membresía por su ID
   */
  remove(id: number) {
    return this.prisma.membresiaPlan.delete({
      where: { id_membresia_plan: id },
    });
  }

  /**
   * Obtiene la lista de estados posibles de membresía
   */
  async obtenerEstados() {
    return this.prisma.membresiaEstado.findMany({
      orderBy: { id_membresia_estado: 'asc' },
    });
  }

  /**
   * Busca un estado específico por su ID
   */
  async obtenerEstadoPorId(id_membresia_estado: number) {
    return this.prisma.membresiaEstado.findUnique({
      where: { id_membresia_estado },
    });
  }
}
