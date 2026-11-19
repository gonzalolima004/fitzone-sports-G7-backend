import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} from 'mercadopago';
import type { Response } from 'express';
import { GeneradorPdfService } from './generador-pdf.service';
import { MercadoPagoService } from './mercadopago.service';
import { WebhooksController } from '../controllers/webhooks.controller';
import { PagosController } from '../controllers/pagos.controller';
import { ComprobantesController } from '../controllers/comprobantes.controller';
import { PagosService } from './pagos.service';
import { PagosRepository } from '../repositories/pagos.repository';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { ComprobanteResponseDto } from '../dto/comprobante-response.dto';

describe('M5 Pagos - PDF, MercadoPago, Controllers y Repository', () => {
  describe('GeneradorPdfService', () => {
    const pdfService = new GeneradorPdfService();

    it('debe generar un buffer PDF válido con ítems, descuento, nota de seguridad y pie de página', async () => {
      const datos: ComprobanteResponseDto = {
        id_pago: 1,
        nro_ticket: 'FZ-PAGO-00000001',
        fecha_emision: new Date('2026-11-10T15:00:00Z'),
        emisor: {
          nombre: 'FitZone Sports Club',
          subtitulo: 'Comprobante Oficial',
          descripcion: 'Gestión deportiva',
          contacto: 'soporte@fitzone.com',
        },
        cliente: {
          nombre: 'Carlos',
          apellido: 'López',
          dni: '30555666',
          email: 'carlos@fitzone.com',
        },
        items: [
          {
            concepto: 'Reserva Cancha 1',
            detalle: 'Central • 10/11/2026',
            cantidad: 1,
            precio_unitario: 12000,
            subtotal: 12000,
          },
        ],
        subtotal: 12000,
        descuento: 1800,
        total: 10200,
        moneda: 'ARS',
        metodo_pago: 'Mercado Pago',
        token_transaccion: 'mp-999',
        estado: 'Aprobado',
        nota_seguridad: 'Transacción segura RNF-02',
        leyenda_pie: 'Comprobante electrónico',
        comprobante_url: '/pagos/1/comprobante',
      };

      const buffer = await pdfService.generarComprobante(datos);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
      expect(buffer.length).toBeGreaterThan(500);
    });

    it('debe generar un buffer PDF válido con valores por defecto (sin ítems ni descuento)', async () => {
      const datosMinimos = {
        id_pago: 2,
        nro_ticket: 'FZ-PAGO-00000002',
        fecha_emision: new Date(),
        emisor: { nombre: '' },
        cliente: {
          nombre: 'Ana',
          apellido: 'Díaz',
          dni: '123',
          email: 'a@b.c',
        },
        items: [],
        total: 5000,
        estado: '',
      } as unknown as ComprobanteResponseDto;

      const buffer = await pdfService.generarComprobante(datosMinimos);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });
  });

  describe('MercadoPagoService', () => {
    it('debe inicializar con ConfigService y exponer propiedades y métodos de consulta', async () => {
      const mockConfig = {
        get: jest.fn().mockReturnValue({
          accessToken: 'TEST-TOKEN-123',
          publicKey: 'PUB-123',
          webhookSecret: 'SEC-123',
          backUrls: {
            success: 'https://ok',
            failure: 'https://fail',
            pending: 'https://pend',
          },
          notificationUrl: 'https://hook',
        }),
      } as unknown as ConfigService;

      const mpService = new MercadoPagoService(mockConfig);
      expect(mpService.publicKey).toBe('PUB-123');
      expect(mpService.webhookSecret).toBe('SEC-123');
      expect(mpService.notificationUrl).toBe('https://hook');
      expect(mpService.backUrls.success).toBe('https://ok');

      jest
        .spyOn(mpService.payment, 'get')
        .mockResolvedValueOnce({ id: 55, status: 'approved' } as never);
      const pago = await mpService.consultarPago(55);
      expect(pago.id).toBe(55);

      jest
        .spyOn(mpService.payment, 'get')
        .mockRejectedValueOnce(new Error('MP Error'));
      await expect(mpService.consultarPago(55)).rejects.toThrow('MP Error');

      jest
        .spyOn(mpService.payment, 'search')
        .mockResolvedValueOnce({ results: [{ id: 77 }] } as never);
      const resultados =
        await mpService.buscarPagosPorReferenciaExterna('cancha-1');
      expect(resultados).toHaveLength(1);

      jest
        .spyOn(mpService.payment, 'search')
        .mockRejectedValueOnce(new Error('Search fail'));
      const vacio = await mpService.buscarPagosPorReferenciaExterna('cancha-1');
      expect(vacio).toEqual([]);
    });

    it('debe retornar configuración por defecto cuando ConfigService no tiene mercadopago', () => {
      const emptyConfig = {
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as ConfigService;
      const mpService = new MercadoPagoService(emptyConfig);
      expect(mpService.publicKey).toBe('');
      expect(mpService.webhookSecret).toBe('');
    });
  });

  describe('WebhooksController, PagosController y ComprobantesController', () => {
    it('WebhooksController debe validar firmas HMAC, ignorar eventos sin paymentId y delegar procesamiento', async () => {
      const mockPagosService = {
        procesarWebhook: jest
          .fn()
          .mockResolvedValue({ status: 'approved', message: 'OK' }),
      };
      const mockMpService = {
        webhookSecret: 'secret-hmac',
      };

      const controller = new WebhooksController(
        mockPagosService as unknown as PagosService,
        mockMpService as unknown as MercadoPagoService,
      );

      // 1. Sin paymentId y fuera de producción sin xSignature
      const resIgnored = await controller.recibirWebhook({}, {});
      expect(resIgnored.status).toBe('ignored');

      // 2. En producción sin xSignature -> UnauthorizedException
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      await expect(
        controller.recibirWebhook({ data: { id: '123' } }, {}),
      ).rejects.toThrow(UnauthorizedException);
      process.env.NODE_ENV = prevEnv;

      // 3. Con xSignature válida
      const validateSpy = jest
        .spyOn(WebhookSignatureValidator, 'validate')
        .mockImplementationOnce(() => undefined);
      const resOk = await controller.recibirWebhook(
        { data: { id: '123' }, type: 'payment' },
        {},
        'ts=1,v1=hash',
        'req-1',
      );
      expect(resOk.status).toBe('approved');
      expect(validateSpy).toHaveBeenCalled();

      // 4. Con xSignature inválida -> InvalidWebhookSignatureError
      validateSpy.mockImplementationOnce(() => {
        throw Object.assign(
          Object.create(
            InvalidWebhookSignatureError.prototype,
          ) as InvalidWebhookSignatureError,
          { message: 'Firma inválida' },
        );
      });
      const resUnauth = await controller.recibirWebhook(
        {},
        { topic: 'payment', id: '456' },
        'ts=1,v1=bad',
      );
      expect(resUnauth.status).toBe('unauthorized');

      // 5. Error interno al procesarWebhook -> captura y retorna status: 'error'
      mockPagosService.procesarWebhook.mockRejectedValueOnce(
        new Error('DB Fail'),
      );
      const resErr = await controller.recibirWebhook(
        { type: 'payment', id: '789' },
        {},
      );
      expect(resErr.status).toBe('error');
    });

    it('PagosController y ComprobantesController deben delegar correctamente en PagosService', async () => {
      const mockPagosService = {
        crearPreferenciaPago: jest
          .fn()
          .mockResolvedValue({ preferenceId: 'p1' }),
        obtenerHistorialUsuario: jest.fn().mockResolvedValue([]),
        obtenerPendientesUsuario: jest.fn().mockResolvedValue([]),
        obtenerDetallePago: jest.fn().mockResolvedValue({ id_pago: 1 }),
        generarComprobantePdf: jest
          .fn()
          .mockResolvedValue(Buffer.from('%PDF-1.4')),
      };

      const pagosCtrl = new PagosController(
        mockPagosService as unknown as PagosService,
      );
      expect(
        await pagosCtrl.iniciarPago(
          { id_cancha_reserva: 1, monto: 100, titulo: 'T' },
          10,
        ),
      ).toEqual({ preferenceId: 'p1' });
      expect(await pagosCtrl.obtenerMisPagos(10)).toEqual([]);
      expect(await pagosCtrl.obtenerPendientes(10)).toEqual([]);
      expect(await pagosCtrl.obtenerDetalle(1, 10)).toEqual({ id_pago: 1 });

      const compCtrl = new ComprobantesController(
        mockPagosService as unknown as PagosService,
      );
      const mockRes = {
        set: jest.fn(),
        end: jest.fn(),
      };

      await compCtrl.descargarComprobante(
        1,
        10,
        mockRes as unknown as Response,
      );
      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/pdf',
        }),
      );
      expect(mockRes.end).toHaveBeenCalled();
    });
  });

  describe('PagosRepository', () => {
    let mockPrisma: Record<string, Record<string, jest.Mock>> & {
      $transaction: jest.Mock;
    };
    let repository: PagosRepository;

    beforeEach(() => {
      mockPrisma = {
        pago: {
          create: jest.fn().mockResolvedValue({ id_pago: 1 }),
          update: jest.fn().mockResolvedValue({ id_pago: 1 }),
          findUnique: jest.fn().mockResolvedValue({ id_pago: 1 }),
          findFirst: jest.fn().mockResolvedValue({ id_pago: 1 }),
          findMany: jest.fn().mockResolvedValue([{ id_pago: 1 }]),
          count: jest.fn().mockResolvedValue(1),
        },
        membresiaPlan: {
          findUnique: jest.fn().mockResolvedValue({ id_membresia_plan: 1 }),
        },
        usuario: {
          findUnique: jest.fn().mockResolvedValue({ id_usuario: 10 }),
          findFirst: jest.fn().mockResolvedValue({ id_usuario: 10 }),
        },
        membresia: {
          findUnique: jest.fn().mockResolvedValue({
            id_membresia: 5,
            id_usuario: 10,
            membresia_plan: { duracion_dias: 30 },
          }),
          findFirst: jest.fn().mockResolvedValue(null),
          update: jest.fn().mockResolvedValue({ id_membresia: 5 }),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          create: jest.fn().mockResolvedValue({ id_membresia: 6 }),
        },
        canchaReserva: {
          findUnique: jest.fn().mockResolvedValue({ id_cancha_reserva: 3 }),
          findMany: jest.fn().mockResolvedValue([]),
          update: jest.fn().mockResolvedValue({ id_cancha_reserva: 3 }),
        },
        usuarioRol: {
          findMany: jest
            .fn()
            .mockResolvedValue([{ rol: { nombre: 'externo' } }]),
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          upsert: jest.fn().mockResolvedValue({}),
        },
        rol: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id_rol: 2, nombre: 'socio' }),
        },
        $transaction: jest.fn((cb: (tx: unknown) => Promise<unknown>) =>
          cb(mockPrisma),
        ),
      } as unknown as typeof mockPrisma;

      repository = new PagosRepository(mockPrisma as unknown as PrismaService);
    });

    it('debe ejecutar operaciones CRUD y consultas de pagos, planes, usuarios y membresías', async () => {
      await repository.crearPago({
        id_pago_estado: 1,
        monto: 1000,
      });
      await repository.actualizarPagoPendiente(1, {
        monto: 1200,
        token_transaccion: 'tok',
      });
      await repository.obtenerPorId(1);
      await repository.obtenerPorTokenTransaccion('tok');
      await repository.obtenerUltimoPagoPendienteCancha(3);
      await repository.obtenerUltimoPagoPendienteMembresia(5);
      await repository.actualizarEstado(1, 2);
      await repository.obtenerPlanPorId(1);
      await repository.obtenerUsuarioPorId(10);
      await repository.obtenerUsuarioPorEmail('a@b.c');
      await repository.obtenerMembresiaPorId(5);
      await repository.obtenerMembresiaSuspendidaSinPagoAprobado(10);
      await repository.actualizarIntencionMembresia(5, {
        id_membresia_plan: 2,
      });
      await repository.crearMembresia({
        id_usuario: 10,
        id_membresia_plan: 2,
        id_membresia_estado: 2,
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
      });
      await repository.marcarPagoRechazado(1, 3);
      await repository.obtenerCanchaReservaPorId(3);
      expect(await repository.existeCanchaReserva(3)).toBe(true);
      expect(await repository.existeMembresia(5)).toBe(true);
      await repository.obtenerDetallePorId(1);
      await repository.obtenerPagoCompletoParaComprobante(1);
      await repository.actualizarComprobanteUrl(1, '/url');
      await repository.obtenerHistorialPorUsuario(10);
      await repository.obtenerReservasPendientesDePago(10);
      await repository.obtenerUltimaMembresiaDeUsuario(10);
      expect(
        await repository.existePagoAprobadoDeMembresiaDesde(5, new Date()),
      ).toBe(true);
      await repository.obtenerPagosPendientesPorUsuario(10);

      expect(mockPrisma.pago.create).toHaveBeenCalled();
      expect(mockPrisma.pago.findMany).toHaveBeenCalled();
    });

    it('confirmarPagoTransaccional debe confirmar pago, reserva, activar membresía y promover rol externo a socio', async () => {
      await expect(
        repository.confirmarPagoTransaccional({
          id_pago: 1,
          id_pago_estado: 2,
          comprobante_url: '/pagos/1/comprobante',
          id_membresia: 5,
          id_membresia_estado: 1,
        }),
      ).rejects.toThrow('Falta id_membresia_estado_suspendida');

      mockPrisma.membresia.findFirst.mockResolvedValueOnce({
        id_membresia: 4,
        fecha_fin: new Date(Date.now() + 86400000),
      });

      const res = await repository.confirmarPagoTransaccional({
        id_pago: 1,
        id_pago_estado: 2,
        comprobante_url: '/pagos/1/comprobante',
        token_transaccion: 'mp-1',
        id_cancha_reserva: 3,
        id_cancha_reserva_estado: 2,
        id_membresia: 5,
        id_membresia_estado: 1,
        id_membresia_estado_suspendida: 2,
      });

      expect(res.id_pago).toBe(1);
      expect(mockPrisma.canchaReserva.update).toHaveBeenCalled();
      expect(mockPrisma.membresia.update).toHaveBeenCalled();
      expect(mockPrisma.usuarioRol.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.rol.create).toHaveBeenCalled();
      expect(mockPrisma.usuarioRol.upsert).toHaveBeenCalled();
    });

    it('confirmarPagoTransaccional debe cubrir usuario sin roles y usuario ya socio con rol existente, más caso de membresía inexistente', async () => {
      // Usuario sin roles y rol 'socio' ya existente en DB
      mockPrisma.usuarioRol.findMany.mockResolvedValueOnce([]);
      mockPrisma.rol.findFirst.mockResolvedValueOnce({
        id_rol: 2,
        nombre: 'socio',
      });

      await repository.confirmarPagoTransaccional({
        id_pago: 2,
        id_pago_estado: 2,
        comprobante_url: '/pagos/2/comprobante',
        id_membresia: 5,
        id_membresia_estado: 1,
        id_membresia_estado_suspendida: 2,
      });
      expect(mockPrisma.usuarioRol.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.usuarioRol.upsert).toHaveBeenCalled();

      // Usuario ya socio (no promueve ni elimina roles)
      mockPrisma.usuarioRol.findMany.mockResolvedValueOnce([
        { rol: { nombre: 'socio' } },
      ]);
      await repository.confirmarPagoTransaccional({
        id_pago: 3,
        id_pago_estado: 2,
        comprobante_url: '/pagos/3/comprobante',
        id_membresia: 5,
        id_membresia_estado: 1,
        id_membresia_estado_suspendida: 2,
      });
      expect(mockPrisma.usuarioRol.upsert).toHaveBeenCalledTimes(1);

      // Membresía no encontrada en DB (no falla)
      mockPrisma.membresia.findUnique.mockResolvedValueOnce(null);
      const resSinMemb = await repository.confirmarPagoTransaccional({
        id_pago: 4,
        id_pago_estado: 2,
        comprobante_url: '/pagos/4/comprobante',
        id_membresia: 999,
        id_membresia_estado: 1,
        id_membresia_estado_suspendida: 2,
      });
      expect(resSinMemb.id_pago).toBe(1);
    });
  });
});
