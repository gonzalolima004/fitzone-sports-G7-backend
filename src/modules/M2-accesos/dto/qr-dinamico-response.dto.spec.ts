import { validate } from 'class-validator';
import { plainToInstance, instanceToPlain } from 'class-transformer';
import { QrDinamicoResponseDto } from './qr-dinamico-response.dto';

describe('QrDinamicoResponseDto', () => {
  const fechaEjemplo = new Date('2026-09-17T15:00:00.000Z');

  describe('Validación de tipos (class-validator)', () => {
    it('debe pasar la validación con datos válidos', async () => {
      const dto = new QrDinamicoResponseDto({
        token: 'token_valido_xyz',
        expiraEnSegundos: 60,
        fechaGeneracion: fechaEjemplo,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe fallar la validación si falta el token o está vacío', async () => {
      const dto = plainToInstance(QrDinamicoResponseDto, {
        token: '',
        expiraEnSegundos: 60,
        fechaGeneracion: fechaEjemplo,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('token');
    });

    it('debe fallar si expiraEnSegundos no es un número', async () => {
      const dto = plainToInstance(QrDinamicoResponseDto, {
        token: 'token_valido',
        expiraEnSegundos: 'sesenta' as unknown as number,
        fechaGeneracion: fechaEjemplo,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('expiraEnSegundos');
    });

    it('debe fallar si fechaGeneracion no es una fecha válida', async () => {
      const dto = plainToInstance(QrDinamicoResponseDto, {
        token: 'token_valido',
        expiraEnSegundos: 60,
        fechaGeneracion: 'fecha-invalida',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('fechaGeneracion');
    });
  });

  describe('Serialización y Deserialización (class-transformer)', () => {
    it('debe transformar correctamente un objeto plano a una instancia de DTO', () => {
      const plainObject = {
        token: 'token_123',
        expiraEnSegundos: 60,
        fechaGeneracion: '2026-09-17T15:00:00.000Z',
      };

      const dtoInstance = plainToInstance(QrDinamicoResponseDto, plainObject);

      expect(dtoInstance).toBeInstanceOf(QrDinamicoResponseDto);
      expect(dtoInstance.token).toBe('token_123');
      expect(dtoInstance.fechaGeneracion).toBeInstanceOf(Date);
    });

    it('debe serializar la instancia DTO a un objeto JSON plano', () => {
      const dto = new QrDinamicoResponseDto({
        token: 'token_123',
        expiraEnSegundos: 60,
        fechaGeneracion: fechaEjemplo,
      });

      const plainObject = instanceToPlain(dto);

      expect(plainObject).toEqual({
        token: 'token_123',
        expiraEnSegundos: 60,
        fechaGeneracion: fechaEjemplo,
      });
    });
  });
});
