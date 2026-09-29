import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { CrearPlanDto } from '../dto/crear-plan.dto';
import { ActualizarPlanDto } from '../dto/actualizar-plan.dto';

/**
 * Objeto de inclusión estándar para consultas de Membresías de usuario.
 * Carga las relaciones con el plan contratado, su estado actual y el usuario/socio.
 */
export const MEMBRESIA_INCLUDE = {
  plan: true,
  estado: true,
  usuario: {
    select: {
      id_usuario: true,
      nombre: true,
      apellido: true,
      dni: true,
      email: true,
    },
  },
} as const;

@Injectable()
export class MembresiasRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // PLANES Y ESTADOS DE MEMBRESÍA (US-02-03)
  // ==========================================

  /**
   * Crea un nuevo plan de membresía en el catálogo
   */
  async createPlan(data: CrearPlanDto) {
    return await this.prisma.membresiaPlan.create({ data });
  }

  /**
   * Obtiene la lista de planes de membresía
   */
  async findAllPlanes() {
    return await this.prisma.membresiaPlan.findMany();
  }

  /**
   * Obtiene un plan de membresía por su ID
   */
  async findOnePlan(id: number) {
    return await this.prisma.membresiaPlan.findUnique({
      where: { id_membresia_plan: id },
    });
  }

  /**
   * Actualiza un plan de membresía por su ID
   */
  async updatePlan(id: number, updatePlanDto: ActualizarPlanDto) {
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
  async removePlan(id: number) {
    return await this.prisma.membresiaPlan.delete({
      where: { id_membresia_plan: id },
    });
  }

  /**
   * Obtiene la lista de estados de membresía
   */
  async findAllEstados() {
    return await this.prisma.membresiaEstado.findMany({
      orderBy: { id_membresia_estado: 'asc' },
    });
  }

  /**
   * Busca un estado específico por su ID
   */
  async findOneEstado(id_membresia_estado: number) {
    return await this.prisma.membresiaEstado.findUnique({
      where: { id_membresia_estado },
    });
  }

  // ==========================================
  // MEMBRESÍAS DE USUARIO (US-02-04)
  // ==========================================

  async create(data: {
    id_usuario: number;
    id_membresia_plan: number;
    id_membresia_estado?: number;
    fecha_inicio: Date;
    fecha_fin: Date;
    renovacion_automatica?: boolean;
  }) {
    const {
      id_usuario,
      id_membresia_plan,
      id_membresia_estado = 1,
      fecha_inicio,
      fecha_fin,
      renovacion_automatica = false,
    } = data;
    return await this.prisma.membresia.create({
      data: {
        fecha_inicio,
        fecha_fin,
        renovacion_automatica,
        usuario: { connect: { id_usuario } },
        membresia_plan: { connect: { id_membresia_plan } },
        membresia_estado: { connect: { id_membresia_estado } },
      },
      include: MEMBRESIA_INCLUDE,
    });
  }

  async findById(id_membresia: number) {
    return await this.prisma.membresia.findUnique({
      where: { id_membresia },
      include: MEMBRESIA_INCLUDE,
    });
  }
  //Encontrar la membresía activa de un usuario.
  async findActiveByUsuarioId(id_usuario: number) {
    const ID_ESTADO_ACTIVO = 1;
    return await this.prisma.membresia.findFirst({
      where: {
        id_usuario,
        id_membresia_estado: ID_ESTADO_ACTIVO,
        fecha_fin: { gte: new Date() },
      },
      orderBy: { fecha_fin: 'desc' },
      include: MEMBRESIA_INCLUDE,
    });
  }
  //Encontrar todas las membresías de un usuario.
  async findByUsuarioId(id_usuario: number) {
    return await this.prisma.membresia.findMany({
      where: { id_usuario },
      orderBy: { fecha_fin: 'desc' },
      include: MEMBRESIA_INCLUDE,
    });
  }

  async findAll(
    filtros: {
      id_usuario?: number;
      id_membresia_estado?: number;
      id_membresia_plan?: number;
    } = {},
  ) {
    return await this.prisma.membresia.findMany({
      where: {
        ...(filtros.id_usuario ? { id_usuario: filtros.id_usuario } : {}),
        ...(filtros.id_membresia_estado
          ? { id_membresia_estado: filtros.id_membresia_estado }
          : {}),
        ...(filtros.id_membresia_plan
          ? { id_membresia_plan: filtros.id_membresia_plan }
          : {}),
      },
      orderBy: { id_membresia: 'desc' },
      include: MEMBRESIA_INCLUDE,
    });
  }

  async updateEstado(id_membresia: number, id_membresia_estado: number) {
    return await this.prisma.membresia.update({
      where: { id_membresia },
      data: {
        membresia_estado: { connect: { id_membresia_estado } },
      },
      include: MEMBRESIA_INCLUDE,
    });
  }

  //Desactiva las membresías anteriores de un usuario.
  async deactivatePrevious(id_usuario: number) {
    const ID_ESTADO_ACTIVO = 1; //NOTA: Verificar si es correcto
    const ID_ESTADO_SUSPENDIDO = 3; //NOTA: Verificar si es correcto
    await this.prisma.membresia.updateMany({
      where: {
        id_usuario,
        id_membresia_estado: ID_ESTADO_ACTIVO,
      },
      data: {
        id_membresia_estado: ID_ESTADO_SUSPENDIDO,
      },
    });
  }
}
