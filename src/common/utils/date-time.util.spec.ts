import {
  normalizarHorarioHHmm,
  crearFechaArgentina,
  obtenerRangoDiaArgentina,
  obtenerFechaHoyArgentina,
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
});
