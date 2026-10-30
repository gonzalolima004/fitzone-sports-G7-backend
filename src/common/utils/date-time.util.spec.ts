import {
  normalizarHorarioHHmm,
  crearFechaArgentina,
  obtenerRangoDiaArgentina,
  obtenerFechaHoyArgentina,
  obtenerDiaSemana,
  claseAplicaEnFecha,
  TIMEZONE_ARGENTINA_OFFSET,
} from './date-time.util';

describe('date-time.util', () => {
  it('normalizarHorarioHHmm debe formatear correctamente a HH:mm', () => {
    expect(normalizarHorarioHHmm('18:00:00')).toBe('18:00');
    expect(normalizarHorarioHHmm('9:5')).toBe('09:05');
    expect(normalizarHorarioHHmm('08:30')).toBe('08:30');
    expect(normalizarHorarioHHmm(null)).toBe('09:00');
    expect(normalizarHorarioHHmm(undefined, '10:00')).toBe('10:00');
  });

  it('crearFechaArgentina debe crear un objeto Date con offset -03:00', () => {
    const date = crearFechaArgentina('2026-10-12', '18:00');

    expect(TIMEZONE_ARGENTINA_OFFSET).toBe('-03:00');
    // 18:00 ART (-03:00) equivale a 21:00 UTC (Z)
    expect(date.toISOString()).toBe('2026-10-12T21:00:00.000Z');
  });

  it('obtenerRangoDiaArgentina debe retornar los extremos del día en ART', () => {
    const { inicioDia, finDia } = obtenerRangoDiaArgentina('2026-10-12');

    // 00:00:00.000 ART (-03:00) es 03:00:00.000Z
    expect(inicioDia.toISOString()).toBe('2026-10-12T03:00:00.000Z');
    // 23:59:59.999 ART (-03:00) es 02:59:59.999Z del día siguiente
    expect(finDia.toISOString()).toBe('2026-10-13T02:59:59.999Z');
  });

  it('obtenerFechaHoyArgentina debe devolver formato YYYY-MM-DD', () => {
    const fecha = obtenerFechaHoyArgentina();
    expect(fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('obtenerDiaSemana debe devolver 0 para Domingo, 1 para Lunes, ..., 6 para Sábado', () => {
    // 2026-10-18 = Domingo (0)
    expect(obtenerDiaSemana('2026-10-18')).toBe(0);
    // 2026-10-19 = Lunes (1)
    expect(obtenerDiaSemana('2026-10-19')).toBe(1);
    // 2026-10-20 = Martes (2)
    expect(obtenerDiaSemana('2026-10-20')).toBe(2);
    // 2026-10-21 = Miércoles (3)
    expect(obtenerDiaSemana('2026-10-21')).toBe(3);
    // 2026-10-22 = Jueves (4)
    expect(obtenerDiaSemana('2026-10-22')).toBe(4);
    // 2026-10-23 = Viernes (5)
    expect(obtenerDiaSemana('2026-10-23')).toBe(5);
    // 2026-10-24 = Sábado (6)
    expect(obtenerDiaSemana('2026-10-24')).toBe(6);
  });

  describe('claseAplicaEnFecha', () => {
    it('debe retornar true si el día de la semana está en dias_semana', () => {
      // 2026-10-19 es Lunes (1)
      const claseLunesMiercolesViernes = { dias_semana: [1, 3, 5] };
      expect(claseAplicaEnFecha(claseLunesMiercolesViernes, '2026-10-19')).toBe(
        true,
      );
      // 2026-10-21 es Miércoles (3)
      expect(claseAplicaEnFecha(claseLunesMiercolesViernes, '2026-10-21')).toBe(
        true,
      );
    });

    it('debe retornar false si el día de la semana no está en dias_semana', () => {
      // 2026-10-20 es Martes (2)
      const claseLunesMiercolesViernes = { dias_semana: [1, 3, 5] };
      expect(claseAplicaEnFecha(claseLunesMiercolesViernes, '2026-10-20')).toBe(
        false,
      );
      // 2026-10-22 es Jueves (4)
      expect(claseAplicaEnFecha(claseLunesMiercolesViernes, '2026-10-22')).toBe(
        false,
      );
    });

    it('debe retornar true si coincide exactamente con la fecha puntual asignada', () => {
      const clasePuntual = { fecha: new Date('2026-10-25T00:00:00.000Z') };
      expect(claseAplicaEnFecha(clasePuntual, '2026-10-25')).toBe(true);
    });

    it('debe retornar false si no coincide con la fecha puntual asignada', () => {
      const clasePuntual = { fecha: '2026-10-25' };
      expect(claseAplicaEnFecha(clasePuntual, '2026-10-26')).toBe(false);
    });

    it('debe retornar true para clases legacy sin fecha ni dias_semana definidos', () => {
      const claseLegacy = { dias_semana: [], fecha: null };
      expect(claseAplicaEnFecha(claseLegacy, '2026-10-20')).toBe(true);
      expect(claseAplicaEnFecha({}, '2026-10-20')).toBe(true);
    });
  });
});
