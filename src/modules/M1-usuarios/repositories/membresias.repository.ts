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
  async create(data: CrearPlanDto) {
    return await this.prisma.membresiaPlan.create({ data });
  }

  /**
   * Obtiene la lista de planes de membresía
   */
  async findAll() {
    return await this.prisma.membresiaPlan.findMany();
  }

  /**
   * Obtiene un plan de membresía por su ID
   */
  async findOne(id: number) {
    return await this.prisma.membresiaPlan.findUnique({
      where: { id_membresia_plan: id },
    });
  }

  /**
   * Actualiza un plan de membresía por su ID
   */
  async update(id: number, updatePlanDto: ActualizarPlanDto) {
    return await this.prisma.membresiaPlan.update({
      where: { id_membresia_plan: id },
      data: updatePlanDto,
    });
  }

  /**
   * Elimina un plan de membresía por su ID
   */
  //NOTA: No hay es activo ni estado en membresía plan todavía
  /*async softDelete(id: number) {
    return await this.prisma.membresiaPlan.update({
      where: { id_membresia_plan: id },
      data: {es_activo: false} //NOTA: Solo por el momento
    });
  }*/

  //NOTA: No es un soft delete, es un delete real.
  //Se hace así por el momento ya que no hay membresias activas.
  async remove(id: number) {
    return await this.prisma.membresiaPlan.delete({
      where: { id_membresia_plan: id },
    });
  }

  /**
   * Obtiene la lista de estados de membresía
   */
  async obtenerEstados() {
    return await this.prisma.membresiaEstado.findMany({
      orderBy: { id_membresia_estado: 'asc' },
    });
  }

  /**
   * Busca un estado específico por su ID
   */
  async obtenerEstadoPorId(id_membresia_estado: number) {
    return await this.prisma.membresiaEstado.findUnique({
      where: { id_membresia_estado },
    });
  }
}
