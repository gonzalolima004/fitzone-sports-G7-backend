import { NotFoundException } from '@nestjs/common';
import { SedeService } from './sede.service';
import { SedeRepository } from '../repositories/sede.repository';
import { CiudadRepository } from '../repositories/ciudad.repository';
import { MOTIVOS_DE_CIERRE } from '../constants/sedes.constants';

describe('SedeService.getHorarioOperativo', () => {
  const repositorio = {
    findById: jest.fn(),
    findHorarioOperativo: jest.fn(),
  };
  const servicio = new SedeService(
    repositorio as unknown as SedeRepository,
    {} as CiudadRepository,
  );

  const conDatos = (excepcion: unknown, horarioBase: unknown) =>
    repositorio.findHorarioOperativo.mockResolvedValue({
      excepcion,
      horarioBase,
    });

  const semanal = {
    abierto: true,
    hora_apertura: '07:00',
    hora_cierre: '23:00',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    repositorio.findById.mockResolvedValue({ id_sede: 3 });
  });

  it('consulta el día de la semana de la fecha (0 domingo … 6 sábado)', async () => {
    conDatos(null, semanal);

    // El 15/11/2026 es domingo.
    await servicio.getHorarioOperativo(3, '2026-11-15');

    expect(repositorio.findHorarioOperativo).toHaveBeenCalledWith(
      3,
      0,
      new Date('2026-11-15T00:00:00.000Z'),
    );
  });

  it('usa el horario semanal sin consultar de nuevo la sede', async () => {
    conDatos(null, semanal);

    expect(await servicio.getHorarioOperativo(3, '2026-11-16')).toEqual({
      abierto: true,
      hora_apertura: '07:00',
      hora_cierre: '23:00',
      es_horario_especial: false,
    });
    expect(repositorio.findById).not.toHaveBeenCalled();
  });

  it('informa cerrado el día que el horario semanal no abre', async () => {
    conDatos(null, {
      abierto: false,
      hora_apertura: '00:00',
      hora_cierre: '00:00',
    });

    expect(await servicio.getHorarioOperativo(3, '2026-11-15')).toEqual({
      abierto: false,
      hora_apertura: '00:00',
      hora_cierre: '00:00',
      motivo_cierre: MOTIVOS_DE_CIERRE.DIA_SIN_ATENCION,
    });
  });

  it('sin horario cargado ese día la sede figura cerrada: no hay horario por defecto', async () => {
    conDatos(null, null);

    expect(await servicio.getHorarioOperativo(3, '2026-11-16')).toEqual({
      abierto: false,
      hora_apertura: '00:00',
      hora_cierre: '00:00',
      motivo_cierre: MOTIVOS_DE_CIERRE.SIN_HORARIO,
    });
    expect(repositorio.findById).toHaveBeenCalledWith(3);
  });

  it('responde 404 si la sede no existe', async () => {
    conDatos(null, null);
    repositorio.findById.mockResolvedValue(null);

    await expect(
      servicio.getHorarioOperativo(99, '2026-11-16'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('la excepción del día manda sobre el horario semanal', async () => {
    conDatos(
      {
        cerrado: false,
        hora_apertura: '10:00',
        hora_cierre: '14:00',
        motivo: 'Horario reducido',
      },
      semanal,
    );
    expect(await servicio.getHorarioOperativo(3, '2026-11-23')).toEqual({
      abierto: true,
      hora_apertura: '10:00',
      hora_cierre: '14:00',
      es_horario_especial: true,
    });

    conDatos({ cerrado: true, motivo: 'Fumigación' }, semanal);
    expect(await servicio.getHorarioOperativo(3, '2026-11-23')).toMatchObject({
      abierto: false,
      motivo_cierre: 'Fumigación',
    });
  });

  it('un cierre sin motivo informa la fecha del calendario o un motivo general', async () => {
    conDatos(
      {
        cerrado: true,
        motivo: null,
        calendario: { descripcion: 'Día de la Soberanía Nacional' },
      },
      semanal,
    );
    expect(await servicio.getHorarioOperativo(3, '2026-11-23')).toMatchObject({
      abierto: false,
      motivo_cierre: 'Día de la Soberanía Nacional',
    });

    conDatos(
      { cerrado: true, motivo: null, calendario: { descripcion: null } },
      semanal,
    );
    expect(await servicio.getHorarioOperativo(3, '2026-11-23')).toMatchObject({
      abierto: false,
      motivo_cierre: MOTIVOS_DE_CIERRE.CALENDARIO,
    });
  });

  it('una excepción abierta sin horas usa el horario semanal del día', async () => {
    conDatos(
      { cerrado: false, hora_apertura: null, hora_cierre: null },
      semanal,
    );

    expect(await servicio.getHorarioOperativo(3, '2026-11-23')).toEqual({
      abierto: true,
      hora_apertura: '07:00',
      hora_cierre: '23:00',
      es_horario_especial: false,
    });
  });
});
