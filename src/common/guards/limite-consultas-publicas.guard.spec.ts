import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { LimiteConsultasPublicasGuard } from './limite-consultas-publicas.guard';

describe('LimiteConsultasPublicasGuard', () => {
  const limiteOriginal = process.env.LIMITE_CONSULTAS_PUBLICAS;
  let ahora: number;

  const contexto = (ip: string, ruta = '/sedes'): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ ip, method: 'GET', route: { path: ruta } }),
      }),
    }) as unknown as ExecutionContext;

  /** Estado HTTP del error que lanza el guard, o null si dejó pasar. */
  const estadoDe = (
    guard: LimiteConsultasPublicasGuard,
    ctx: ExecutionContext,
  ): number | null => {
    try {
      guard.canActivate(ctx);
      return null;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        return error.getStatus();
      }
      throw error;
    }
  };

  beforeEach(() => {
    process.env.LIMITE_CONSULTAS_PUBLICAS = '3';
    ahora = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => ahora);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (limiteOriginal === undefined) {
      delete process.env.LIMITE_CONSULTAS_PUBLICAS;
    } else {
      process.env.LIMITE_CONSULTAS_PUBLICAS = limiteOriginal;
    }
  });

  it('deja pasar hasta el límite y después responde 429', () => {
    const guard = new LimiteConsultasPublicasGuard();
    const ctx = contexto('10.0.0.1');

    expect([1, 2, 3].map(() => estadoDe(guard, ctx))).toEqual([
      null,
      null,
      null,
    ]);
    expect(estadoDe(guard, ctx)).toBe(HttpStatus.TOO_MANY_REQUESTS);
  });

  it('vuelve a dejar pasar cuando termina el minuto', () => {
    const guard = new LimiteConsultasPublicasGuard();
    const ctx = contexto('10.0.0.1');
    [1, 2, 3].forEach(() => guard.canActivate(ctx));

    ahora += 59_999;
    expect(estadoDe(guard, ctx)).toBe(HttpStatus.TOO_MANY_REQUESTS);

    ahora += 1;
    expect(estadoDe(guard, ctx)).toBeNull();
  });

  it('cuenta por separado cada IP y cada ruta', () => {
    const guard = new LimiteConsultasPublicasGuard();
    [1, 2, 3].forEach(() => guard.canActivate(contexto('10.0.0.1')));

    expect(estadoDe(guard, contexto('10.0.0.1'))).toBe(
      HttpStatus.TOO_MANY_REQUESTS,
    );
    expect(estadoDe(guard, contexto('10.0.0.2'))).toBeNull();
    expect(estadoDe(guard, contexto('10.0.0.1', '/ciudades'))).toBeNull();
  });

  it('usa 120 consultas por minuto si el límite configurado no es válido', () => {
    process.env.LIMITE_CONSULTAS_PUBLICAS = 'muchas';
    const guard = new LimiteConsultasPublicasGuard();
    const ctx = contexto('10.0.0.1');

    for (let consulta = 1; consulta <= 120; consulta++) {
      expect(estadoDe(guard, ctx)).toBeNull();
    }
    expect(estadoDe(guard, ctx)).toBe(HttpStatus.TOO_MANY_REQUESTS);
  });
});
