import { Injectable } from '@nestjs/common';
import {
  CotizacionContext,
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
}
