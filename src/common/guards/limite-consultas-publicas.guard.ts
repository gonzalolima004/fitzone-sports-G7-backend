import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

/** Duración de la ventana en la que se cuentan las consultas. */
const VENTANA_MS = 60_000;

/** Consultas por minuto, IP y ruta si no se configura LIMITE_CONSULTAS_PUBLICAS. */
const LIMITE_POR_DEFECTO = 120;

/** Cantidad de ventanas guardadas a partir de la cual se descartan las vencidas. */
const VENTANAS_ANTES_DE_LIMPIAR = 1_000;

type Ventana = { inicio: number; cantidad: number };

type PeticionHttp = {
  ip?: string;
  method: string;
  path?: string;
  route?: { path?: string };
};

/**
 * Guard de los endpoints públicos, que no pueden pedir sesión (por ejemplo,
 * la landing y el registro consultan las sedes sin token). Cuenta las
 * consultas de cada IP a cada ruta durante un minuto y, al pasar el límite,
 * responde 429 hasta que empieza la ventana siguiente.
 *
 * El conteo vive en la memoria del proceso. Si la API corre detrás de un
 * proxy, Express tiene que confiar en él (`trust proxy`) para ver la IP de
 * cada cliente.
 */
@Injectable()
export class LimiteConsultasPublicasGuard implements CanActivate {
  private readonly limite = leerLimite(process.env.LIMITE_CONSULTAS_PUBLICAS);
  private readonly ventanas = new Map<string, Ventana>();

  canActivate(context: ExecutionContext): boolean {
    const peticion = context.switchToHttp().getRequest<PeticionHttp>();
    const ruta = peticion.route?.path ?? peticion.path ?? '';
    const clave = `${peticion.ip ?? 'sin-ip'} ${peticion.method} ${ruta}`;
    const ahora = Date.now();
    const ventana = this.ventanas.get(clave);

    if (!ventana || ahora - ventana.inicio >= VENTANA_MS) {
      this.descartarVencidas(ahora);
      this.ventanas.set(clave, { inicio: ahora, cantidad: 1 });
      return true;
    }

    if (ventana.cantidad >= this.limite) {
      throw new HttpException(
        'Demasiadas consultas seguidas. Esperá un minuto y volvé a intentar.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    ventana.cantidad += 1;
    return true;
  }

  private descartarVencidas(ahora: number): void {
    if (this.ventanas.size < VENTANAS_ANTES_DE_LIMPIAR) {
      return;
    }
    for (const [clave, ventana] of this.ventanas) {
      if (ahora - ventana.inicio >= VENTANA_MS) {
        this.ventanas.delete(clave);
      }
    }
  }
}

function leerLimite(valor: string | undefined): number {
  const limite = Number(valor);
  return Number.isInteger(limite) && limite > 0 ? limite : LIMITE_POR_DEFECTO;
}
