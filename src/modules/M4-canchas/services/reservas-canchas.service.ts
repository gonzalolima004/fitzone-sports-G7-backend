import { Injectable, NotFoundException } from '@nestjs/common';
import { ReservasCanchasRepository } from '../repositories/reservas-canchas.repository';
import { CanchasRepository } from '../repositories/canchas.repository';
import { PrecioContextService } from './precio-context.service';
import { CrearReservaCanchaDto } from '../dto/crear-reserva-cancha.dto';
import { CotizacionContext } from '../dto/cotizacion-turno.dto';
import { PrismaService } from '../../../database/prisma-service/prisma.service';

@Injectable()
export class ReservasCanchasService {
  constructor(
    private readonly reservasRepository: ReservasCanchasRepository,
    private readonly canchasRepository: CanchasRepository,
    private readonly precioContext: PrecioContextService,
    private readonly prisma: PrismaService, // Para consultar membresía del usuario
  ) {}

  async crearReserva(dto: CrearReservaCanchaDto, idUsuario: number) {
    // 1. Validar Cancha
    const cancha = await this.canchasRepository.obtenerPorId(dto.id_cancha);
    if (!cancha || !cancha.activo)
      throw new NotFoundException('Cancha inactiva o inexistente.');

    // 2. Validar estado del usuario (RN-03: membresía al día)
    // Nota: Esta validación asume que el usuario tiene una membresía activa en este momento
    const membresiaActiva = await this.prisma.membresia.findFirst({
      where: {
        id_usuario: idUsuario,
        id_membresia_estado: 1, // 1 = Activa (Ajustar según catálogo real)
        fecha_fin: { gte: new Date() },
      },
    });

    // 3. Configurar contexto y calcular precio con Strategy
    const contextoCotizacion: CotizacionContext = {
      esSocioActivo: !!membresiaActiva,
      horaInicio: new Date(dto.fecha_inicio),
    };

    const calculo = this.precioContext.calcularPrecioFinal(
      Number(cancha.costo_base),
      contextoCotizacion,
    );

    // 4. Ejecutar transacción atómica
    const reserva = await this.reservasRepository.crearReservaTransaccional({
      id_cancha: dto.id_cancha,
      id_usuario: idUsuario,
      id_cancha_reserva_estado: 1, // 1 = Confirmada/Pendiente Pago
      fecha_inicio: new Date(dto.fecha_inicio),
      fecha_fin: new Date(dto.fecha_fin),
      descuento_porcentaje: calculo.descuento_porcentaje,
      es_horario_pico: calculo.es_horario_pico,
      precio_congelado: calculo.precio_congelado,
    });

    // 5. Emitir evento Realtime a Supabase (Mockeado temporalmente hasta que se integre la Épica 1)
    // this.supabaseService.emitir('reservas', 'nueva_reserva', reserva);
    console.log(
      `[Realtime Broadcast] Grilla actualizada para cancha ${dto.id_cancha}`,
    );

    return reserva;
  }
}
