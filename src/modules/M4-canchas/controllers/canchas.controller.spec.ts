import { CanchasController } from './canchas.controller';
import { CanchasService } from '../services/canchas.service';
import {
  CotizarTurnoQueryDto,
  CotizacionResponseDto,
} from '../dto/cotizacion-turno.dto';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

describe('CanchasController - cotizar', () => {
  let controller: CanchasController;
  let canchasService: Partial<jest.Mocked<CanchasService>>;

  const mockUser: AuthenticatedUser = {
    id_usuario: 10,
    supabase_user_id: 'sub-123',
    email: 'socio@fitzone.com',
    rol: 'socio',
    roles: ['socio'],
  };

  const mockCotizacionResponse: CotizacionResponseDto = {
    costo_base: 12000,
    descuento_porcentaje: 15,
    monto_descuento: 1800,
    es_horario_pico: true,
    monto_recargo_pico: 2400,
    precio_final: 12600,
    es_socio: true,
    aplica_descuento_socio: true,
    motivo_sin_descuento: null,
  };

  beforeEach(() => {
    canchasService = {
      cotizarTurno: jest.fn().mockResolvedValue(mockCotizacionResponse),
    };

    controller = new CanchasController(
      canchasService as unknown as CanchasService,
    );
  });

  it('debe llamar a canchasService.cotizarTurno con el DTO query y el id_usuario del token', async () => {
    const query: CotizarTurnoQueryDto = {
      canchaId: 1,
      fecha: '2026-11-15',
      hora: '19:00',
    };

    const response = await controller.cotizar(query, mockUser);

    expect(canchasService.cotizarTurno).toHaveBeenCalledWith(query, 10);
    expect(response).toEqual(mockCotizacionResponse);
  });

  describe('Verificación de @UseGuards y @Roles en endpoints administrativos', () => {
    const getRoles = (methodName: keyof CanchasController): string[] => {
      const descriptor = Object.getOwnPropertyDescriptor(
        CanchasController.prototype,
        methodName,
      );
      const handler = descriptor?.value as object | undefined;
      if (!handler) return [];
      const meta = Reflect.getMetadata('roles', handler) as unknown;
      return Array.isArray(meta) ? (meta as string[]) : [];
    };

    it('debe proteger POST /canchas con rol gerente', () => {
      expect(getRoles('crear')).toEqual(['gerente']);
    });

    it('debe proteger POST /canchas/tipos con rol gerente', () => {
      expect(getRoles('crearTipo')).toEqual(['gerente']);
    });

    it('debe proteger PATCH /canchas/tipos/:id con rol gerente', () => {
      expect(getRoles('actualizarTipo')).toEqual(['gerente']);
    });

    it('debe proteger DELETE /canchas/tipos/:id con rol gerente', () => {
      expect(getRoles('eliminarTipo')).toEqual(['gerente']);
    });

    it('debe proteger PATCH /canchas/:id con rol gerente', () => {
      expect(getRoles('actualizar')).toEqual(['gerente']);
    });

    it('debe proteger DELETE /canchas/:id con rol gerente', () => {
      expect(getRoles('eliminar')).toEqual(['gerente']);
    });
  });
});
