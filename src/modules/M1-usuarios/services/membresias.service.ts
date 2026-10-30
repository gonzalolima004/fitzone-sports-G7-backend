import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembresiasRepository } from '../repositories/membresias.repository';
import { UsuariosRepository } from '../repositories/usuarios.repository';
import { CreateMembresiaDto } from '../dto/crear-membresia.dto';
import { ActualizarMembresiaEstadoDto } from '../dto/actualizar-membresia-estado.dto';
import { ActualizarMembresiaDto } from '../dto/actualizar-membresia.dto';
import { plainToInstance } from 'class-transformer';
import {
  MembresiaEstadoDto,
  MembresiaResponseDto,
} from '../dto/membresia-response.dto';
import { VerificarMembresiaResponseDto } from '../dto/verificar-membresia-response.dto';
import { calcularFechaFin } from '../utils/plan-duracion';

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
      : calcularFechaFin(fechaInicio, plan.duracion_dias);

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

  /**
   * Catálogo de estados de membresía (tabla membresia_estado).
   */
  async findAllEstados(): Promise<MembresiaEstadoDto[]> {
    const estados = await this.membresiasRepository.findAllEstados();
    return plainToInstance(MembresiaEstadoDto, estados);
  }

  /**
   * Modifica la fecha de vencimiento o la renovación automática de una membresía.
   */
  async update(
    id_membresia: number,
    dto: ActualizarMembresiaDto,
  ): Promise<MembresiaResponseDto> {
    const membresia = await this.membresiasRepository.findById(id_membresia);
    if (!membresia) {
      throw new NotFoundException(
        `Membresía con ID ${id_membresia} no encontrada`,
      );
    }

    if (
      dto.fecha_fin === undefined &&
      dto.renovacion_automatica === undefined
    ) {
      throw new BadRequestException(
        'Indicá la fecha de fin o la renovación automática a modificar',
      );
    }

    const datos: { fecha_fin?: Date; renovacion_automatica?: boolean } = {};

    if (dto.fecha_fin !== undefined) {
      const fechaFin = new Date(dto.fecha_fin);
      if (Number.isNaN(fechaFin.getTime())) {
        throw new BadRequestException('La fecha de fin no es válida');
      }
      if (fechaFin < membresia.fecha_inicio) {
        throw new BadRequestException(
          'La fecha de fin no puede ser anterior a la fecha de inicio',
        );
      }
      datos.fecha_fin = fechaFin;
    }

    if (dto.renovacion_automatica !== undefined) {
      datos.renovacion_automatica = dto.renovacion_automatica;
    }

    const actualizada = await this.membresiasRepository.update(
      id_membresia,
      datos,
    );
    return plainToInstance(MembresiaResponseDto, actualizada);
  }

  /**
   * Elimina una membresía cargada por error. Si ya tiene pagos no se borra:
   * se conserva para la facturación y los reportes, y se suspende.
   */
  async remove(id_membresia: number): Promise<MembresiaResponseDto> {
    const membresia = await this.membresiasRepository.findById(id_membresia);
    if (!membresia) {
      throw new NotFoundException(
        `Membresía con ID ${id_membresia} no encontrada`,
      );
    }

    const pagos = await this.membresiasRepository.countPagos(id_membresia);
    if (pagos > 0) {
      throw new ConflictException(
        'La membresía tiene pagos registrados y no se puede eliminar. Cambiá su estado a Suspendida.',
      );
    }

    const eliminada = await this.membresiasRepository.remove(id_membresia);
    return plainToInstance(MembresiaResponseDto, eliminada);
  }

  async softDelete(id: number): Promise<MembresiaResponseDto> {
    const membresia = await this.membresiasRepository.removePlan(id);
    if (!membresia) {
      throw new NotFoundException(`Membresía con ID ${id} no encontrada`);
    }
    return plainToInstance(MembresiaResponseDto, membresia);
  }

  /**
   * Verifica el estado de membresía de un usuario para validación de acceso multi-sede.
   */
  async verificarMembresia(
    id_usuario: number,
  ): Promise<VerificarMembresiaResponseDto> {
    // 1. Verificar que el usuario exista
    const usuario = await this.usuariosRepository.findById(id_usuario);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id_usuario} no encontrado`);
    }

    // Extraer sede de origen del usuario
    const idSedeOrigen = usuario.id_sede ?? 0;

    // 2. Obtener última membresía Activa o Vencida del socio (vigente o expirada)
    const ultimaMembresia =
      (await this.membresiasRepository.findActiveByUsuarioId(id_usuario)) ??
      (await this.membresiasRepository.findLatestActivaOrVencidaByUsuarioId?.(
        id_usuario,
      ));

    // Si no tiene ninguna membresía activa ni vencida registrada
    if (!ultimaMembresia) {
      return plainToInstance(VerificarMembresiaResponseDto, {
        id_usuario: id_usuario,
        esSocioActivo: false,
        enMora: false,
        id_sede_origen: idSedeOrigen,
        fecha_inicio: null,
        fecha_vencimiento: null,
        nombre_plan: null,
        mensaje:
          'El usuario no cuenta con una membresía activa vigente. Puede operar como cliente externo.',
      });
    }

    // 3. Determinar estado de mora según estado y fecha de vencimiento
    const estadoDescripcion =
      ultimaMembresia.membresia_estado?.descripcion?.toLowerCase();
    const esMora =
      estadoDescripcion === 'vencida' ||
      new Date(ultimaMembresia.fecha_fin) < new Date();

    // 4. Construir respuesta
    return plainToInstance(VerificarMembresiaResponseDto, {
      id_usuario: id_usuario,
      esSocioActivo: !esMora,
      enMora: esMora,
      id_sede_origen: idSedeOrigen,
      fecha_inicio: ultimaMembresia.fecha_inicio,
      fecha_vencimiento: ultimaMembresia.fecha_fin,
      nombre_plan: ultimaMembresia.membresia_plan?.nombre,
      mensaje: esMora
        ? 'Membresía vencida. El socio se encuentra en mora y no tiene permitido el acceso.'
        : 'Socio activo habilitado para acceso multi-sede y beneficios.',
    });
  }
}
