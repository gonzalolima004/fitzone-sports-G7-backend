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
import { REGLAS_CANCHAS } from '../constants/canchas.constants';
import { normalizarHorarioHHmm } from '../../../common/utils/date-time.util';

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
    const esHorarioPico =
      hora >= REGLAS_CANCHAS.HORARIO_PICO_INICIO &&
      hora < REGLAS_CANCHAS.HORARIO_PICO_FIN; // Rango de 19:00 a 20:59

    let resultadoBase: ResultadoPrecio;

    // 1. Selección de Estrategia Principal
    if (esHorarioPico) {
      resultadoBase = this.horarioPicoStrategy.calcular(costoBase, context);
    } else if (context.esSocioActivo) {
      resultadoBase = this.descuentoSocioStrategy.calcular(costoBase, context);
    } else {
      resultadoBase = this.estandarStrategy.calcular(costoBase, context);
    }

    // 2. Composición: Si es socio activo y además es horario pico,
    // se aplica el descuento sobre el costo base sin modificar el recargo pico
    if (esHorarioPico && context.esSocioActivo) {
      const resultadoSocio = this.descuentoSocioStrategy.calcular(
        costoBase,
        context,
      );
      const montoDescuento = costoBase - resultadoSocio.precio_congelado;
      resultadoBase.precio_congelado -= montoDescuento;
      resultadoBase.descuento_porcentaje = resultadoSocio.descuento_porcentaje;
    }

    // Retorna los datos listos para ser persistidos en CanchaReserva (precio_congelado, etc)
    return resultadoBase;
  }

  /**
   * Calcula la cotización completa de un turno de cancha acorde a las reglas de negocio,
   * utilizando calcularPrecioFinal y las estrategias para el desglose detallado.
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

    const horaNormalizada = normalizarHorarioHHmm(hora);
    const [horaStr, minStr] = horaNormalizada.split(':');
    const horaNum = parseInt(horaStr, 10);
    const minNum = parseInt(minStr || '0', 10);

    const contextDate = new Date();
    contextDate.setUTCHours(horaNum, minNum, 0, 0);

    const context: CotizacionContext = {
      esSocioActivo: aplicaDescuentoSocio,
      horaInicio: contextDate,
    };

    // Obtener el precio final y estado mediante la estrategia
    const resultado = this.calcularPrecioFinal(costoBase, context);

    const esHorarioPico = resultado.es_horario_pico;
    const montoRecargoPico = esHorarioPico
      ? Math.round(costoBase * (REGLAS_CANCHAS.PORCENTAJE_RECARGO_PICO / 100))
      : 0;
    const montoDescuento =
      resultado.descuento_porcentaje > 0
        ? Math.round(costoBase * (resultado.descuento_porcentaje / 100))
        : 0;

    return {
      costo_base: costoBase,
      descuento_porcentaje: resultado.descuento_porcentaje,
      monto_descuento: montoDescuento,
      es_horario_pico: esHorarioPico,
      monto_recargo_pico: montoRecargoPico,
      precio_final: resultado.precio_congelado,
      es_socio: esSocio,
      aplica_descuento_socio: aplicaDescuentoSocio,
      motivo_sin_descuento: motivoSinDescuento,
    };
  }
}
