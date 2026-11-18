import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { PagosRepository } from '../repositories/pagos.repository';
import { MercadoPagoService } from './mercadopago.service';
import { GeneradorPdfService } from './generador-pdf.service';
import { EstadosService } from './estados.service';

describe('PagosService - propiedad de recursos', () => {
  let repo: Record<string, jest.Mock>;
  let service: PagosService;

  beforeEach(() => {
    repo = {
      obtenerPagoCompletoParaComprobante: jest.fn(),
      obtenerDetallePorId: jest.fn(),
      obtenerCanchaReservaPorId: jest.fn(),
      obtenerMembresiaPorId: jest.fn(),
    };
    service = new PagosService(
      {} as MercadoPagoService,
      repo as unknown as PagosRepository,
      {} as GeneradorPdfService,
      {} as EstadosService,
    );
  });

  describe('obtenerDatosComprobante', () => {
    it('404 si el pago no existe', async () => {
      repo.obtenerPagoCompletoParaComprobante.mockResolvedValue(null);
      await expect(service.obtenerDatosComprobante(1, 10)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('403 si el pago es de otro usuario', async () => {
      repo.obtenerPagoCompletoParaComprobante.mockResolvedValue({
        id_pago: 1,
        cancha_reserva: { id_usuario: 99 },
        membresia: null,
      });
      await expect(service.obtenerDatosComprobante(1, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('obtenerDetallePago', () => {
    it('403 si el pago es de otro usuario', async () => {
      repo.obtenerDetallePorId.mockResolvedValue({
        id_pago: 1,
        cancha_reserva: null,
        membresia: { id_usuario: 99 },
      });
      await expect(service.obtenerDetallePago(1, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('crearPreferenciaPago', () => {
    it('403 si la reserva de cancha es de otro usuario', async () => {
      repo.obtenerCanchaReservaPorId.mockResolvedValue({
        id_cancha_reserva: 5,
        id_usuario: 99,
      });
      await expect(
        service.crearPreferenciaPago(
          { id_cancha_reserva: 5, monto: 1000, titulo: 'x' },
          10,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('403 si la membresía es de otro usuario', async () => {
      repo.obtenerMembresiaPorId.mockResolvedValue({
        id_membresia: 5,
        id_usuario: 99,
      });
      await expect(
        service.crearPreferenciaPago({ id_membresia: 5 } as never, 10),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
