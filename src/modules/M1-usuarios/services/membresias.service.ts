import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembresiasRepository } from '../repositories/membresias.repository';
import { UsuariosRepository } from '../repositories/usuarios.repository';
import { CreateMembresiaDto } from '../dto/crear-membresia.dto';
import { ActualizarMembresiaEstadoDto } from '../dto/actualizar-membresia-estado.dto';
import { plainToInstance } from 'class-transformer';
import { MembresiaResponseDto } from '../dto/membresia-response.dto';

@Injectable()
export class MembresiasService {
  constructor(
    private readonly membresiasRepository: MembresiasRepository,
    private readonly usuariosRepository: UsuariosRepository,
  ) {}

  async create(dto: CreateMembresiaDto): Promise<MembresiaResponseDto> {
    //1. Verificar que el usuario exista
    const usuario = await this.usuariosRepository.findById(dto.id_usuario);
    if (!usuario) {
      throw new NotFoundException(
        `Usuario con ID ${dto.id_usuario} no encontrado`,
      );
    }

    // 2. Verificar que el plan exista
    const plan = await this.membresiasRepository.findOnePlan(
      dto.id_membresia_plan,
    );
    if (!plan) {
      throw new NotFoundException(
        `Plan de membresía con ID ${dto.id_membresia_plan} no encontrado`,
      );
    }

    // 3. Calculo dinamico de fechas.
    const fechaInicio = dto.fecha_inicio
      ? new Date(dto.fecha_inicio)
      : new Date();

    const fechaFin = dto.fecha_fin
      ? new Date(dto.fecha_fin)
      : new Date(
          fechaInicio.getTime() + plan.duracion_dias * 24 * 60 * 60 * 1000,
        );

    // 4. Desactivar membresías activas anteriores del usuario (Regla: 1 activa a la vez)
    await this.membresiasRepository.deactivatePrevious(dto.id_usuario);

    // 5. Crear la membresía convirtiendo las cadenas de texto a Date
    const membresia = await this.membresiasRepository.create({
      id_usuario: dto.id_usuario,
      id_membresia_plan: dto.id_membresia_plan,
      id_membresia_estado: dto.id_membresia_estado ?? 1, // 1: Activa por defecto
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      renovacion_automatica: dto.renovacion_automatica ?? false,
    });

    return plainToInstance(MembresiaResponseDto, membresia);
  }

  /**
   * Obtiene el listado general de membresías con filtros opcionales.
   */
  async findAll(
    filtros: {
      id_usuario?: number;
      id_membresia_estado?: number;
      id_membresia_plan?: number;
    } = {},
  ): Promise<MembresiaResponseDto[]> {
    const membresias = await this.membresiasRepository.findAll(filtros);
    return plainToInstance(MembresiaResponseDto, membresias);
  }

  /**
   * Obtiene una membresía específica por su ID.
   */
  async findById(id: number): Promise<MembresiaResponseDto> {
    const membresia = await this.membresiasRepository.findById(id);
    if (!membresia) {
      throw new NotFoundException(`Membresía con ID ${id} no encontrada`);
    }
    return plainToInstance(MembresiaResponseDto, membresia);
  }

  async findActiveByUsuarioId(
    id_usuario: number,
  ): Promise<MembresiaResponseDto | null> {
    const usuario = await this.usuariosRepository.findById(id_usuario);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id_usuario} no encontrado`);
    }
    const membresiaActiva =
      await this.membresiasRepository.findActiveByUsuarioId(id_usuario);
    if (!membresiaActiva) return null;
    return plainToInstance(MembresiaResponseDto, membresiaActiva);
  }

  /**
   * Obtiene el historial completo de membresías de un usuario.
   */
  async findByUsuarioId(id_usuario: number): Promise<MembresiaResponseDto[]> {
    const usuario = await this.usuariosRepository.findById(id_usuario);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id_usuario} no encontrado`);
    }
    const membresias =
      await this.membresiasRepository.findByUsuarioId(id_usuario);
    return plainToInstance(MembresiaResponseDto, membresias);
  }

  /**
   * Cambia el estado de una membresía (ej. Activa, Vencida, Suspendida).
   */
  async updateEstado(
    id_membresia: number,
    dto: ActualizarMembresiaEstadoDto,
  ): Promise<MembresiaResponseDto> {
    const membresia = await this.membresiasRepository.findById(id_membresia);

    if (!dto.id_membresia_estado) {
      throw new BadRequestException(`El ID del estado es obligatorio`);
    }

    if (!membresia) {
      throw new NotFoundException(
        `Membresía con ID ${id_membresia} no encontrada`,
      );
    }

    const estado = await this.membresiasRepository.findOneEstado(
      dto.id_membresia_estado,
    );
    if (!estado) {
      throw new NotFoundException(
        `Estado con ID ${dto.id_membresia_estado} no encontrado`,
      );
    }

    const membresiaActualizada = await this.membresiasRepository.updateEstado(
      id_membresia,
      dto.id_membresia_estado,
    );
    return plainToInstance(MembresiaResponseDto, membresiaActualizada);
  }

  async softDelete(id: number): Promise<MembresiaResponseDto> {
    const membresia = await this.membresiasRepository.removePlan(id);
    if (!membresia) {
      throw new NotFoundException(`Membresía con ID ${id} no encontrada`);
    }
    return plainToInstance(MembresiaResponseDto, membresia);
  }
}
