import { Injectable } from '@nestjs/common';
import {
  CotizacionContext,
  CotizacionResponseDto,
  MotivoSinDescuento,
  ResultadoPrecio,
} from '../dto/cotizacion-turno.dto';
import { PrecioEstandarStrategy } from '../patterns/strategy/precio-estandar.strategy';
import { DescuentoSocioStrategy } from '../patterns/strategy/descuento-socio.strategy';
import { HorarioPicoStrategy } from '../patterns/strategy/horario-pico.strategy';

@Injectable()
export class PrecioContextService {
  constructor(
    private readonly estandarStrategy: PrecioEstandarStrategy,
    private readonly descuentoSocioStrategy: DescuentoSocioStrategy,
    private readonly horarioPicoStrategy: HorarioPicoStrategy,
  ) {}

  /**
   * Evalúa el contexto (hora y estado del usuario) y aplica la estrategia correcta.
   */
  calcularPrecioFinal(
    costoBase: number,
    context: CotizacionContext,
  ): ResultadoPrecio {
    const hora = context.horaInicio.getUTCHours();
    const esHorarioPico = hora >= 19 && hora < 21; // Rango de 19:00 a 20:59

    let resultadoBase: ResultadoPrecio;

    // 1. Selección de Estrategia Principal
    if (esHorarioPico) {
      resultadoBase = this.horarioPicoStrategy.calcular(costoBase, context);
    } else if (context.esSocioActivo) {
      resultadoBase = this.descuentoSocioStrategy.calcular(costoBase, context);
    } else {
      resultadoBase = this.estandarStrategy.calcular(costoBase, context);
    }

    // 2. Composición: Si es socio activo Y además es horario pico,
    // le aplicamos el descuento sobre el precio con recargo.
    if (esHorarioPico && context.esSocioActivo) {
      const descuentoPico = this.descuentoSocioStrategy.calcular(
        resultadoBase.precio_congelado,
        context,
      );
      resultadoBase.precio_congelado = descuentoPico.precio_congelado;
      resultadoBase.descuento_porcentaje = descuentoPico.descuento_porcentaje;
    }

    // Retorna los datos listos para ser persistidos en CanchaReserva (precio_congelado, etc)
    return resultadoBase;
  }

  /**
   * Calcula la cotización completa de un turno de cancha acorde a las reglas de negocio:
   * - Tarifa Base: costo_base de la cancha.
   * - Horario Pico: si la hora de inicio está comprendida entre 19:00 y 21:00 hs (+20% sobre costo base).
   * - Descuento Socio: 15% sobre costo base si es socio activo en la misma ciudad.
   * - Fórmula de Precio Final: precio_final = costo_base - monto_descuento + monto_recargo_pico.
   */
  calcularCotizacion(params: {
    costoBase: number;
    hora: string;
    esSocio: boolean;
    aplicaDescuentoSocio: boolean;
    motivoSinDescuento: MotivoSinDescuento;
  }): CotizacionResponseDto {
    const {
      costoBase,
      hora,
      esSocio,
      aplicaDescuentoSocio,
      motivoSinDescuento,
    } = params;

    const [horaStr] = hora.split(':');
    const horaInicio = parseInt(horaStr, 10);
    const esHorarioPico = horaInicio >= 19 && horaInicio < 21;

    const montoRecargoPico = esHorarioPico ? Math.round(costoBase * 0.2) : 0;
    const descuentoPorcentaje = aplicaDescuentoSocio ? 15 : 0;
    const montoDescuento = aplicaDescuentoSocio
      ? Math.round(costoBase * 0.15)
      : 0;
    const precioFinal = costoBase - montoDescuento + montoRecargoPico;

    return {
      costo_base: costoBase,
      descuento_porcentaje: descuentoPorcentaje,
      monto_descuento: montoDescuento,
      es_horario_pico: esHorarioPico,
      monto_recargo_pico: montoRecargoPico,
      precio_final: precioFinal,
      es_socio: esSocio,
      aplica_descuento_socio: aplicaDescuentoSocio,
      motivo_sin_descuento: motivoSinDescuento,
    };
  }
}
