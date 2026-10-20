import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { ClasesRepository } from '../repositories/clases.repository';
import { ReservasClasesRepository } from '../repositories/reservas-clases.repository';
import { ListaEsperaRepository } from '../repositories/lista-espera.repository';
import { CreateClaseDto } from '../dto/create-clase.dto';
import { UpdateClaseDto } from '../dto/update-clase.dto';
import { EliminarClaseResponseDto } from '../dto/eliminar-clase-response.dto';

@Injectable()
export class ClasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clasesRepository: ClasesRepository,
    private readonly reservasRepository: ReservasClasesRepository,
    private readonly listaEsperaRepository: ListaEsperaRepository,
  ) {}

  async crearClase(createClaseDto: CreateClaseDto) {
    // Las validaciones de datos (como capacidad_maxima > 0) ya se ejecutan
    // a nivel del DTO mediante class-validator.
    // Si necesitas validar la existencia de la sede, podría requerirse inyectar SedesService.
    return await this.clasesRepository.crearClase(createClaseDto);
  }

  async obtenerClasesPorSede(id_sede: number, fecha?: string) {
    const clases = await this.clasesRepository.obtenerClasesPorSede(id_sede);

    if (!fecha) {
      return clases;
    }

    // Si se envía fecha (YYYY-MM-DD), calculamos la agenda del día con ocupación real:
    const agenda = await Promise.all(
      clases.map(async (clase) => {
        const horaInicioStr = clase.horario_inicio || '09:00';
        const horaFinStr = clase.horario_fin || '10:00';

        const fechaInicio = new Date(`${fecha}T${horaInicioStr}:00.000Z`);
        const fechaFin = new Date(`${fecha}T${horaFinStr}:00.000Z`);

        const cuposOcupados =
          await this.reservasRepository.contarReservasConfirmadas(
            clase.id_clase,
            fechaInicio,
            fechaFin,
          );

        const enEspera =
          await this.listaEsperaRepository.contarInscriptosActivos(
            clase.id_clase,
            fechaInicio,
            fechaFin,
          );

        const cuposDisponibles = Math.max(
          0,
          clase.capacidad_maxima - cuposOcupados,
        );
        const estado: 'DISPONIBLE' | 'COMPLETO' =
          cuposDisponibles > 0 ? 'DISPONIBLE' : 'COMPLETO';

        return {
          id_clase: clase.id_clase,
          id_sede: clase.id_sede,
          nombre: clase.nombre,
          descripcion: clase.descripcion,
          profesor: clase.profesor ?? 'Profesor no asignado',
          sala: clase.sala ?? 'Sala Principal',
          horario_inicio: horaInicioStr,
          horario_fin: horaFinStr,
          fecha_inicio: fechaInicio.toISOString(),
          fecha_fin: fechaFin.toISOString(),
          capacidad_maxima: clase.capacidad_maxima,
          cupos_ocupados: cuposOcupados,
          cupos_disponibles: cuposDisponibles,
          en_espera: enEspera,
          estado,
        };
      }),
    );

    return agenda;
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

  async reemplazarClase(id_clase: number, createClaseDto: CreateClaseDto) {
    // Verificamos que la clase exista antes de intentar reemplazarla
    await this.obtenerClasePorId(id_clase);

    return await this.clasesRepository.reemplazarClase(
      id_clase,
      createClaseDto,
    );
  }

  async eliminarClase(id_clase: number): Promise<EliminarClaseResponseDto> {
    // 1. Verificar existencia de la clase
    await this.obtenerClasePorId(id_clase);

    const ahora = new Date();

    // 2. Transacción para cancelar reservas activas a futuro y realizar la baja lógica
    const reservasCanceladas = await this.prisma.$transaction(async (tx) => {
      const canceladas = await this.clasesRepository.cancelarReservasFuturas(
        id_clase,
        ahora,
        tx,
      );

      await this.clasesRepository.darDeBajaClase(id_clase, tx);

      return canceladas;
    });

    return {
      mensaje: 'Clase dada de baja exitosamente.',
      id_clase,
      activo: false,
      reservas_canceladas: reservasCanceladas,
    };
  }
}
