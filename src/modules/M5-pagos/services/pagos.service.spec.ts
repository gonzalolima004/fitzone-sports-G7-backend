import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PagosService } from './pagos.service';
import { PagosRepository } from '../repositories/pagos.repository';
import { MercadoPagoService } from './mercadopago.service';
import { GeneradorPdfService } from './generador-pdf.service';
import { EstadosService } from './estados.service';

describe('PagosService', () => {
  let repo: Record<string, jest.Mock>;
  let mpService: {
    preference: { create: jest.Mock };
    consultarPago: jest.Mock;
    buscarPagosPorReferenciaExterna: jest.Mock;
    backUrls: { success: string; failure: string; pending: string };
    notificationUrl: string;
  };
  let pdfService: { generarComprobante: jest.Mock };
  let estadosService: Record<string, jest.Mock>;
  let service: PagosService;

  beforeEach(() => {
    repo = {
      obtenerPagoCompletoParaComprobante: jest.fn(),
      actualizarComprobanteUrl: jest.fn(),
      obtenerDetallePorId: jest.fn(),
      obtenerCanchaReservaPorId: jest.fn(),
      obtenerPlanPorId: jest.fn(),
      obtenerUsuarioPorEmail: jest.fn(),
      obtenerUsuarioPorId: jest.fn(),
      obtenerMembresiaSuspendidaSinPagoAprobado: jest.fn(),
      actualizarIntencionMembresia: jest.fn(),
      crearMembresia: jest.fn(),
      obtenerMembresiaPorId: jest.fn(),
      obtenerUltimoPagoPendienteCancha: jest.fn(),
      obtenerUltimoPagoPendienteMembresia: jest.fn(),
      actualizarPagoPendiente: jest.fn(),
      crearPago: jest.fn(),
      obtenerPorId: jest.fn(),
      obtenerPorTokenTransaccion: jest.fn(),
      confirmarPagoTransaccional: jest.fn(),
      marcarPagoRechazado: jest.fn(),
      obtenerPagosPendientesPorUsuario: jest.fn(),
      obtenerHistorialPorUsuario: jest.fn(),
      obtenerUltimaMembresiaDeUsuario: jest.fn(),
      existePagoAprobadoDeMembresiaDesde: jest.fn(),
      obtenerReservasPendientesDePago: jest.fn(),
    };

    mpService = {
      preference: { create: jest.fn() },
      consultarPago: jest.fn(),
      buscarPagosPorReferenciaExterna: jest.fn(),
      backUrls: {
        success: 'https://fitzone.com/success',
        failure: 'https://fitzone.com/failure',
        pending: 'https://fitzone.com/pending',
      },
      notificationUrl: 'https://api.fitzone.com/pagos/webhook',
    };

    pdfService = {
      generarComprobante: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4')),
    };

    estadosService = {
      getPagoPendienteId: jest.fn().mockResolvedValue(1),
      getPagoAprobadoId: jest.fn().mockResolvedValue(2),
      getPagoRechazadoId: jest.fn().mockResolvedValue(3),
      getMembresiaActivaId: jest.fn().mockResolvedValue(1),
      getMembresiaSuspendidaId: jest.fn().mockResolvedValue(2),
      getReservaConfirmadaId: jest.fn().mockResolvedValue(2),
    };

    service = new PagosService(
      mpService as unknown as MercadoPagoService,
      repo as unknown as PagosRepository,
      pdfService as unknown as GeneradorPdfService,
      estadosService as unknown as EstadosService,
    );
  });

  describe('crearPreferenciaPago', () => {
    it('debe lanzar 400 si no se envía ni cancha ni plan/membresía, o si se envían ambos', async () => {
      await expect(
        service.crearPreferenciaPago({ monto: 1000, titulo: 'Test' }, 10),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.crearPreferenciaPago(
          {
            id_cancha_reserva: 1,
            id_membresia_plan: 2,
            monto: 1000,
            titulo: 'Test',
          },
          10,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar 404 si la reserva de cancha no existe y 400 si no tiene monto', async () => {
      repo.obtenerCanchaReservaPorId.mockResolvedValue(null);
      await expect(
        service.crearPreferenciaPago(
          { id_cancha_reserva: 5, monto: 1000, titulo: 'Cancha' },
          10,
        ),
      ).rejects.toThrow(NotFoundException);

      repo.obtenerCanchaReservaPorId.mockResolvedValue({
        id_cancha_reserva: 5,
        id_usuario: 10,
      });
      await expect(
        service.crearPreferenciaPago(
          { id_cancha_reserva: 5, monto: 0, titulo: 'Cancha' },
          10,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar 403 si la reserva de cancha o la membresía pertenece a otro usuario', async () => {
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

      repo.obtenerMembresiaPorId.mockResolvedValue({
        id_membresia: 5,
        id_usuario: 99,
      });
      await expect(
        service.crearPreferenciaPago(
          { id_membresia: 5, monto: 1000, titulo: 'x' },
          10,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe crear preferencia para reserva de cancha reutilizando pago pendiente existente', async () => {
      repo.obtenerCanchaReservaPorId.mockResolvedValue({
        id_cancha_reserva: 5,
        id_usuario: 10,
      });
      repo.obtenerUsuarioPorId.mockResolvedValue({
        id_usuario: 10,
        email: 'socio@fitzone.com',
      });
      mpService.preference.create.mockResolvedValue({
        id: 'pref-cancha-123',
        init_point: 'https://mp.com/init',
        sandbox_init_point: 'https://mp.com/sandbox',
      });
      repo.obtenerUltimoPagoPendienteCancha.mockResolvedValue({ id_pago: 77 });
      repo.actualizarPagoPendiente.mockResolvedValue({ id_pago: 77 });

      const res = await service.crearPreferenciaPago(
        { id_cancha_reserva: 5, monto: 12000, titulo: 'Reserva Cancha 1' },
        10,
      );

      expect(res).toEqual({
        preferenceId: 'pref-cancha-123',
        initPoint: 'https://mp.com/init',
        sandboxInitPoint: 'https://mp.com/sandbox',
        id_pago: 77,
      });
      expect(repo.actualizarPagoPendiente).toHaveBeenCalledWith(77, {
        monto: 12000,
        token_transaccion: 'pref-cancha-123',
      });
    });

    it('debe crear preferencia para un plan resolviendo socio por email y reutilizando intención suspendida', async () => {
      repo.obtenerPlanPorId.mockResolvedValue({
        id_membresia_plan: 2,
        nombre: 'Plan Anual',
        precio: 150000,
      });
      repo.obtenerUsuarioPorEmail.mockResolvedValue({ id_usuario: 25 });
      repo.obtenerMembresiaSuspendidaSinPagoAprobado.mockResolvedValue({
        id_membresia: 40,
      });
      repo.actualizarIntencionMembresia.mockResolvedValue({ id_membresia: 40 });
      mpService.preference.create.mockResolvedValue({
        id: 'pref-plan-40',
        init_point: 'https://mp.com/plan',
        sandbox_init_point: 'https://mp.com/sandbox-plan',
      });
      repo.obtenerUltimoPagoPendienteMembresia.mockResolvedValue(null);
      repo.crearPago.mockResolvedValue({ id_pago: 88 });

      const res = await service.crearPreferenciaPago({
        id_membresia_plan: 2,
        email_pagador: 'nuevo@fitzone.com',
        monto: 0,
        titulo: '',
      });

      expect(res.id_pago).toBe(88);
      expect(repo.actualizarIntencionMembresia).toHaveBeenCalledWith(40, {
        id_membresia_plan: 2,
      });
      expect(repo.crearPago).toHaveBeenCalledWith(
        expect.objectContaining({
          id_membresia: 40,
          monto: 150000,
          token_transaccion: 'pref-plan-40',
        }),
      );
    });

    it('debe crear nueva membresía suspendida si no tenía intención previa, o fallar con 404/400 si falta plan o usuario', async () => {
      repo.obtenerPlanPorId.mockResolvedValue(null);
      await expect(
        service.crearPreferenciaPago({
          id_membresia_plan: 99,
          monto: 1000,
          titulo: 'Plan',
        }),
      ).rejects.toThrow(NotFoundException);

      repo.obtenerPlanPorId.mockResolvedValue({
        id_membresia_plan: 3,
        nombre: 'Mensual',
        precio: 25000,
      });
      repo.obtenerUsuarioPorEmail.mockResolvedValue(null);
      await expect(
        service.crearPreferenciaPago({
          id_membresia_plan: 3,
          email_pagador: 'noexiste@fitzone.com',
          monto: 0,
          titulo: 'Plan',
        }),
      ).rejects.toThrow(BadRequestException);

      repo.obtenerMembresiaSuspendidaSinPagoAprobado.mockResolvedValue(null);
      repo.crearMembresia.mockResolvedValue({ id_membresia: 55 });
      mpService.preference.create.mockResolvedValue({
        id: 'pref-55',
        init_point: 'https://mp.com/55',
        sandbox_init_point: 'https://mp.com/s55',
      });
      repo.obtenerUltimoPagoPendienteMembresia.mockResolvedValue(null);
      repo.crearPago.mockResolvedValue({ id_pago: 90 });

      const res = await service.crearPreferenciaPago(
        { id_membresia_plan: 3, monto: 25000, titulo: 'Plan Mensual' },
        10,
      );
      expect(res.id_pago).toBe(90);
      expect(repo.crearMembresia).toHaveBeenCalled();
    });

    it('debe crear preferencia para id_membresia existente y manejar errores de Mercado Pago (500)', async () => {
      repo.obtenerMembresiaPorId.mockResolvedValue(null);
      await expect(
        service.crearPreferenciaPago(
          { id_membresia: 99, monto: 0, titulo: 'Memb' },
          10,
        ),
      ).rejects.toThrow(NotFoundException);

      repo.obtenerMembresiaPorId.mockResolvedValue({
        id_membresia: 12,
        id_usuario: 10,
        membresia_plan: { precio: 30000 },
      });

      mpService.preference.create.mockRejectedValueOnce(new Error('MP Down'));
      await expect(
        service.crearPreferenciaPago(
          { id_membresia: 12, monto: 0, titulo: 'Memb' },
          10,
        ),
      ).rejects.toThrow(InternalServerErrorException);

      mpService.preference.create.mockResolvedValueOnce({ id: '' });
      await expect(
        service.crearPreferenciaPago(
          { id_membresia: 12, monto: 0, titulo: 'Memb' },
          10,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('procesarWebhook', () => {
    it('debe retornar ignored si Mercado Pago no devuelve un pago válido', async () => {
      mpService.consultarPago.mockResolvedValue(null);
      const res = await service.procesarWebhook('999');
      expect(res.status).toBe('ignored');
    });

    it('debe localizar el pago por external_reference (numérico, cancha-X, membresia-Y), metadata, token o fallbackIdPago', async () => {
      // 1. external_reference numérico + idempotencia (already_approved)
      mpService.consultarPago.mockResolvedValueOnce({
        id: 1001,
        status: 'approved',
        external_reference: '50',
      });
      repo.obtenerPorId.mockResolvedValueOnce({
        id_pago: 50,
        pago_estado: { descripcion: 'Aprobado' },
      });
      const resIdemp = await service.procesarWebhook(1001);
      expect(resIdemp.status).toBe('already_approved');

      // 2. external_reference cancha-X -> approved
      mpService.consultarPago.mockResolvedValueOnce({
        id: 1002,
        status: 'approved',
        external_reference: 'cancha-7',
      });
      repo.obtenerUltimoPagoPendienteCancha.mockResolvedValueOnce({
        id_pago: 51,
        id_cancha_reserva: 7,
        id_membresia: null,
        pago_estado: { descripcion: 'Pendiente' },
      });
      repo.confirmarPagoTransaccional.mockResolvedValueOnce({ id_pago: 51 });
      const resApproved = await service.procesarWebhook(1002);
      expect(resApproved.status).toBe('approved');
      expect(repo.confirmarPagoTransaccional).toHaveBeenCalled();

      // 3. external_reference membresia-Y -> rejected
      mpService.consultarPago.mockResolvedValueOnce({
        id: 1003,
        status: 'rejected',
        external_reference: 'membresia-9',
      });
      repo.obtenerUltimoPagoPendienteMembresia.mockResolvedValueOnce({
        id_pago: 52,
        pago_estado: { descripcion: 'Pendiente' },
      });
      const resRejected = await service.procesarWebhook(1003);
      expect(resRejected.status).toBe('rejected');
      expect(repo.marcarPagoRechazado).toHaveBeenCalledWith(52, 3);

      // 4. metadata.id_cancha_reserva -> pending
      mpService.consultarPago.mockResolvedValueOnce({
        id: 1004,
        status: 'in_process',
        metadata: { id_cancha_reserva: 15 },
      });
      repo.obtenerUltimoPagoPendienteCancha.mockResolvedValueOnce({
        id_pago: 53,
        pago_estado: { descripcion: 'Pendiente' },
      });
      const resPending = await service.procesarWebhook(1004);
      expect(resPending.status).toBe('pending');

      // 5. metadata.id_membresia -> fallback a token -> fallbackIdPago -> unmatched
      mpService.consultarPago.mockResolvedValueOnce({
        id: 1005,
        status: 'cancelled',
        metadata: { id_membresia: 20 },
      });
      repo.obtenerUltimoPagoPendienteMembresia.mockResolvedValueOnce(null);
      repo.obtenerPorTokenTransaccion.mockResolvedValueOnce(null);
      repo.obtenerPorId.mockResolvedValueOnce(null);
      const resUnmatched = await service.procesarWebhook(1005, 999);
      expect(resUnmatched.status).toBe('unmatched');
    });
  });

  describe('obtenerDatosComprobante y generarComprobantePdf', () => {
    it('debe estructurar comprobante para reserva de cancha y actualizar comprobante_url', async () => {
      repo.obtenerPagoCompletoParaComprobante.mockResolvedValue({
        id_pago: 12,
        monto: 15000,
        fecha_pago: new Date('2026-11-10T15:00:00Z'),
        token_transaccion: 'mp-123',
        comprobante_url: null,
        pago_estado: { descripcion: 'Aprobado' },
        cancha_reserva: {
          id_cancha_reserva: 3,
          id_usuario: 10,
          fecha_inicio: new Date('2026-11-12T18:00:00Z'),
          fecha_fin: new Date('2026-11-12T19:00:00Z'),
          cancha: {
            nombre: 'Cancha 1',
            sede: { nombre: 'Sede Central' },
          },
          usuario: {
            nombre: 'Juan',
            apellido: 'Pérez',
            dni: '30111222',
            email: 'juan@fitzone.com',
          },
        },
        membresia: null,
      });

      const buffer = await service.generarComprobantePdf(12, 10);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(repo.actualizarComprobanteUrl).toHaveBeenCalledWith(
        12,
        '/pagos/12/comprobante',
      );
      expect(pdfService.generarComprobante).toHaveBeenCalledWith(
        expect.objectContaining({
          id_pago: 12,
          nro_ticket: 'FZ-PAGO-00000012',
          total: 15000,
        }),
      );
    });

    it('debe estructurar comprobante para membresía sin reescribir comprobante_url si ya coincide', async () => {
      repo.obtenerPagoCompletoParaComprobante.mockResolvedValue({
        id_pago: 15,
        monto: 30000,
        fecha_pago: new Date('2026-11-10T15:00:00Z'),
        token_transaccion: 'mp-456',
        comprobante_url: '/pagos/15/comprobante',
        pago_estado: { descripcion: 'Aprobado' },
        cancha_reserva: null,
        membresia: {
          id_membresia: 8,
          id_usuario: 10,
          fecha_inicio: new Date('2026-11-01T00:00:00Z'),
          fecha_fin: new Date('2026-12-01T00:00:00Z'),
          membresia_plan: {
            nombre: 'Plan Trimestral',
            duracion_dias: 90,
          },
          usuario: {
            nombre: 'Ana',
            apellido: 'Gómez',
            dni: '32000111',
            email: 'ana@fitzone.com',
          },
        },
      });

      const comp = await service.obtenerDatosComprobante(15, 10);
      expect(repo.actualizarComprobanteUrl).not.toHaveBeenCalled();
      expect(comp.items[0].concepto).toContain('Membresía Plan Trimestral');
    });

    it('404 si el pago no existe y 403 si es de otro usuario', async () => {
      repo.obtenerPagoCompletoParaComprobante.mockResolvedValue(null);
      await expect(service.obtenerDatosComprobante(1, 10)).rejects.toThrow(
        NotFoundException,
      );

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

  describe('sincronización, historial, detalle y pendientes', () => {
    it('sincronizarPagoPendientePorReferencia debe reconciliar pagos aprobados y manejar errores', async () => {
      expect(
        await service.sincronizarPagoPendientePorReferencia({ id_pago: 1 }),
      ).toBe(false);

      mpService.buscarPagosPorReferenciaExterna.mockResolvedValueOnce([]);
      expect(
        await service.sincronizarPagoPendientePorReferencia({
          id_pago: 1,
          id_membresia: 10,
        }),
      ).toBe(false);

      mpService.buscarPagosPorReferenciaExterna.mockResolvedValueOnce([
        { id: '9001', status: 'pending' },
        { id: '9002', status: 'approved' },
      ]);
      mpService.consultarPago.mockResolvedValueOnce({
        id: '9002',
        status: 'approved',
        external_reference: '1',
      });
      repo.obtenerPorId.mockResolvedValueOnce({
        id_pago: 1,
        pago_estado: { descripcion: 'Aprobado' },
      });

      expect(
        await service.sincronizarPagoPendientePorReferencia({
          id_pago: 1,
          id_cancha_reserva: 5,
        }),
      ).toBe(true);

      mpService.buscarPagosPorReferenciaExterna.mockRejectedValueOnce(
        new Error('Network error'),
      );
      expect(
        await service.sincronizarPagoPendientePorReferencia({
          id_pago: 2,
          id_membresia: 11,
        }),
      ).toBe(false);
    });

    it('obtenerHistorialUsuario y obtenerDetallePago deben formatear conceptos y reconciliar pendientes', async () => {
      repo.obtenerPagosPendientesPorUsuario.mockResolvedValue([]);
      repo.obtenerHistorialPorUsuario.mockResolvedValue([
        {
          id_pago: 1,
          monto: 10000,
          fecha_pago: new Date(),
          pago_estado: { descripcion: 'Aprobado' },
          token_transaccion: 't1',
          comprobante_url: '/pagos/1/comprobante',
          cancha_reserva: {
            id_cancha_reserva: 2,
            id_usuario: 10,
            fecha_inicio: new Date(),
            fecha_fin: new Date(),
            cancha: { nombre: 'Cancha 2', sede: { nombre: 'Sede Norte' } },
          },
          membresia: null,
        },
        {
          id_pago: 2,
          monto: 25000,
          fecha_pago: new Date(),
          pago_estado: { descripcion: 'Aprobado' },
          token_transaccion: 't2',
          comprobante_url: null,
          cancha_reserva: null,
          membresia: {
            id_membresia: 4,
            id_usuario: 10,
            fecha_inicio: new Date(),
            fecha_fin: new Date(),
            membresia_plan: { nombre: 'Anual', duracion_dias: 365 },
          },
        },
        {
          id_pago: 3,
          monto: 5000,
          fecha_pago: new Date(),
          pago_estado: null,
          token_transaccion: null,
          comprobante_url: null,
          cancha_reserva: null,
          membresia: null,
        },
      ]);

      const historial = await service.obtenerHistorialUsuario(10);
      expect(historial).toHaveLength(3);
      expect(historial[0].concepto.tipo).toBe('cancha');
      expect(historial[1].concepto.tipo).toBe('membresia');
      expect(historial[2].concepto.tipo).toBe('general');

      // obtenerDetallePago: 404, 403 y reconciliación de Pendiente
      repo.obtenerDetallePorId.mockResolvedValueOnce(null);
      await expect(service.obtenerDetallePago(99, 10)).rejects.toThrow(
        NotFoundException,
      );

      repo.obtenerDetallePorId.mockResolvedValueOnce({
        id_pago: 1,
        cancha_reserva: null,
        membresia: { id_usuario: 99 },
      });
      await expect(service.obtenerDetallePago(1, 10)).rejects.toThrow(
        ForbiddenException,
      );

      const pagoPendiente = {
        id_pago: 10,
        id_membresia: 4,
        monto: 25000,
        fecha_pago: new Date(),
        pago_estado: { descripcion: 'Pendiente' },
        token_transaccion: 't-pend',
        comprobante_url: null,
        cancha_reserva: null,
        membresia: {
          id_membresia: 4,
          id_usuario: 10,
          fecha_inicio: new Date(),
          fecha_fin: new Date(),
          membresia_plan: { nombre: 'Mensual', duracion_dias: 30 },
        },
      };
      repo.obtenerDetallePorId
        .mockResolvedValueOnce(pagoPendiente)
        .mockResolvedValueOnce({
          ...pagoPendiente,
          pago_estado: { descripcion: 'Aprobado' },
        });
      mpService.buscarPagosPorReferenciaExterna.mockResolvedValueOnce([
        { id: '888', status: 'approved' },
      ]);
      mpService.consultarPago.mockResolvedValueOnce({
        id: '888',
        status: 'approved',
        external_reference: '10',
      });
      repo.obtenerPorId.mockResolvedValueOnce({
        id_pago: 10,
        pago_estado: { descripcion: 'Aprobado' },
      });

      const detalle = await service.obtenerDetallePago(10, 10);
      expect(detalle.estado).toBe('Aprobado');
    });

    it('obtenerPendientesUsuario debe listar membresías vencidas no renovadas y reservas pendientes, e ignorar suspendidas', async () => {
      repo.obtenerPagosPendientesPorUsuario.mockResolvedValue([]);

      // Caso 1: Membresía vencida no renovada + 1 reserva pendiente
      repo.obtenerUltimaMembresiaDeUsuario.mockResolvedValueOnce({
        id_membresia: 7,
        fecha_fin: new Date(Date.now() - 86400000),
        membresia_estado: { descripcion: 'Activa' },
        membresia_plan: { nombre: 'Mensual', duracion_dias: 30, precio: 25000 },
      });
      repo.existePagoAprobadoDeMembresiaDesde.mockResolvedValueOnce(false);
      repo.obtenerReservasPendientesDePago.mockResolvedValueOnce([
        {
          id_cancha_reserva: 20,
          fecha_inicio: new Date(Date.now() + 86400000),
          fecha_fin: new Date(Date.now() + 90000000),
          precio_congelado: 14000,
          cancha: { nombre: 'Cancha Fútbol', sede: { nombre: 'Sede Sur' } },
        },
      ]);

      const pendientes = await service.obtenerPendientesUsuario(10);
      expect(pendientes).toHaveLength(2);
      expect(pendientes[0].tipo).toBe('membresia');
      expect(pendientes[1].tipo).toBe('cancha');

      // Caso 2: Membresía suspendida -> no genera pendiente
      repo.obtenerUltimaMembresiaDeUsuario.mockResolvedValueOnce({
        id_membresia: 8,
        fecha_fin: new Date(Date.now() + 86400000),
        membresia_estado: { descripcion: 'Suspendida' },
        membresia_plan: { nombre: 'Mensual', duracion_dias: 30, precio: 25000 },
      });
      repo.obtenerReservasPendientesDePago.mockResolvedValueOnce([]);
      const pendientesSusp = await service.obtenerPendientesUsuario(10);
      expect(pendientesSusp).toHaveLength(0);
    });
  });
});
