import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MembresiasService } from './membresias.service';
import { MembresiasRepository } from '../repositories/membresias.repository';
import { UsuariosRepository } from '../repositories/usuarios.repository';
import { FotoStorageService } from './foto-storage.service';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import {
  mesesDePlan,
  calcularFechaFin,
  etiquetaPlan,
  nombrePeriodo,
} from '../utils/plan-duracion';

describe('M1 MembresiasService, FotoStorageService y plan-duracion', () => {
  describe('plan-duracion utils', () => {
    it('debe mapear meses, calcular fecha fin y retornar etiquetas para 30, 90, 365 y días personalizados', () => {
      expect(mesesDePlan(30)).toBe(1);
      expect(mesesDePlan(90)).toBe(3);
      expect(mesesDePlan(365)).toBe(12);
      expect(mesesDePlan(15)).toBeNull();

      const inicio = new Date(2026, 0, 31, 12, 0, 0);
      const finMes = calcularFechaFin(inicio, 30);
      expect(finMes.getMonth()).toBe(1); // Febrero
      expect(finMes.getDate()).toBe(28);

      const finCustom = calcularFechaFin(new Date(2026, 2, 1, 12, 0, 0), 15);
      expect(finCustom.getDate()).toBe(16);

      expect(etiquetaPlan(30)).toBe('Plan Mensual');
      expect(etiquetaPlan(90)).toBe('Plan Trimestral');
      expect(etiquetaPlan(365)).toBe('Plan Anual');
      expect(etiquetaPlan(15)).toBe('Plan de 15 días');

      expect(nombrePeriodo(30)).toBe('Mensual');
      expect(nombrePeriodo(90)).toBe('Trimestral');
      expect(nombrePeriodo(365)).toBe('Anual');
      expect(nombrePeriodo(15)).toBe('15 días');
    });
  });

  describe('MembresiasService', () => {
    let membRepo: Record<string, jest.Mock>;
    let userRepo: Record<string, jest.Mock>;
    let service: MembresiasService;

    beforeEach(() => {
      membRepo = {
        findOnePlan: jest.fn(),
        deactivatePrevious: jest.fn(),
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        findActiveByUsuarioId: jest.fn(),
        findSuspendidaVigenteByUsuarioId: jest.fn(),
        findLatestActivaOrVencidaByUsuarioId: jest.fn(),
        findByUsuarioId: jest.fn(),
        findOneEstado: jest.fn(),
        updateEstado: jest.fn(),
        countPagosAprobados: jest.fn(),
        obtenerEstadoId: jest.fn(),
        findAllEstados: jest.fn(),
        update: jest.fn(),
        countPagos: jest.fn(),
        remove: jest.fn(),
        removePlan: jest.fn(),
      };

      userRepo = {
        findById: jest.fn(),
      };

      service = new MembresiasService(
        membRepo as unknown as MembresiasRepository,
        userRepo as unknown as UsuariosRepository,
      );
    });

    it('create debe validar existencia de usuario y plan, desactivar anteriores y crear membresía', async () => {
      userRepo.findById.mockResolvedValueOnce(null);
      await expect(
        service.create({
          id_usuario: 1,
          id_membresia_plan: 1,
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-02-01',
          id_membresia_estado: 1,
        }),
      ).rejects.toThrow(NotFoundException);

      userRepo.findById.mockResolvedValue({ id_usuario: 1, id_sede: 2 });
      membRepo.findOnePlan.mockResolvedValueOnce(null);
      await expect(
        service.create({
          id_usuario: 1,
          id_membresia_plan: 99,
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-02-01',
          id_membresia_estado: 1,
        }),
      ).rejects.toThrow(NotFoundException);

      membRepo.findOnePlan.mockResolvedValue({
        id_membresia_plan: 1,
        duracion_dias: 30,
      });
      membRepo.create.mockResolvedValue({ id_membresia: 10 });

      const res = await service.create({
        id_usuario: 1,
        id_membresia_plan: 1,
      } as never);
      expect(res.id_membresia).toBe(10);
      expect(membRepo.deactivatePrevious).toHaveBeenCalledWith(1);
    });

    it('findAll, findById, findActiveByUsuarioId y findByUsuarioId deben manejar éxitos y 404', async () => {
      membRepo.findAll.mockResolvedValue([{ id_membresia: 1 }]);
      expect(await service.findAll()).toHaveLength(1);

      membRepo.findById.mockResolvedValueOnce(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
      membRepo.findById.mockResolvedValueOnce({ id_membresia: 1 });
      expect((await service.findById(1)).id_membresia).toBe(1);

      userRepo.findById.mockResolvedValueOnce(null);
      await expect(service.findActiveByUsuarioId(99)).rejects.toThrow(
        NotFoundException,
      );

      userRepo.findById.mockResolvedValue({ id_usuario: 1 });
      membRepo.findActiveByUsuarioId.mockResolvedValueOnce(null);
      expect(await service.findActiveByUsuarioId(1)).toBeNull();
      membRepo.findActiveByUsuarioId.mockResolvedValueOnce({ id_membresia: 2 });
      expect((await service.findActiveByUsuarioId(1))?.id_membresia).toBe(2);

      userRepo.findById.mockResolvedValueOnce(null);
      await expect(service.findByUsuarioId(99)).rejects.toThrow(
        NotFoundException,
      );
      userRepo.findById.mockResolvedValue({ id_usuario: 1 });
      membRepo.findByUsuarioId.mockResolvedValue([{ id_membresia: 3 }]);
      expect(await service.findByUsuarioId(1)).toHaveLength(1);
    });

    it('updateEstado y suspenderMiMembresia deben validar reglas de negocio y conflictos', async () => {
      membRepo.findById.mockResolvedValueOnce({ id_membresia: 1 });
      await expect(service.updateEstado(1, {})).rejects.toThrow(
        BadRequestException,
      );

      membRepo.findById.mockResolvedValueOnce(null);
      await expect(
        service.updateEstado(1, { id_membresia_estado: 2 }),
      ).rejects.toThrow(NotFoundException);

      membRepo.findById.mockResolvedValue({ id_membresia: 1 });
      membRepo.findOneEstado.mockResolvedValueOnce(null);
      await expect(
        service.updateEstado(1, { id_membresia_estado: 99 }),
      ).rejects.toThrow(NotFoundException);

      membRepo.findOneEstado.mockResolvedValueOnce({ id_membresia_estado: 2 });
      membRepo.updateEstado.mockResolvedValueOnce({
        id_membresia: 1,
        id_membresia_estado: 2,
      });
      expect(
        (await service.updateEstado(1, { id_membresia_estado: 2 }))
          .id_membresia_estado,
      ).toBe(2);

      // suspenderMiMembresia: ya suspendida -> 409; sin activa -> 404; sin pago aprobado -> 409; éxito
      membRepo.findActiveByUsuarioId.mockResolvedValueOnce(null);
      membRepo.findSuspendidaVigenteByUsuarioId.mockResolvedValueOnce({
        id_membresia: 5,
      });
      await expect(service.suspenderMiMembresia(1)).rejects.toThrow(
        ConflictException,
      );

      membRepo.findActiveByUsuarioId.mockResolvedValueOnce(null);
      membRepo.findSuspendidaVigenteByUsuarioId.mockResolvedValueOnce(null);
      await expect(service.suspenderMiMembresia(1)).rejects.toThrow(
        NotFoundException,
      );

      membRepo.findActiveByUsuarioId.mockResolvedValue({ id_membresia: 5 });
      membRepo.countPagosAprobados.mockResolvedValueOnce(0);
      await expect(service.suspenderMiMembresia(1)).rejects.toThrow(
        ConflictException,
      );

      membRepo.countPagosAprobados.mockResolvedValueOnce(1);
      membRepo.obtenerEstadoId.mockResolvedValueOnce(3);
      membRepo.updateEstado.mockResolvedValueOnce({
        id_membresia: 5,
        id_membresia_estado: 3,
      });
      expect((await service.suspenderMiMembresia(1)).id_membresia).toBe(5);
    });

    it('update, remove, softDelete y findAllEstados deben validar fechas y pagos asociados', async () => {
      membRepo.findAllEstados.mockResolvedValue([{ id_membresia_estado: 1 }]);
      expect(await service.findAllEstados()).toHaveLength(1);

      membRepo.findById.mockResolvedValueOnce(null);
      await expect(
        service.update(99, { renovacion_automatica: true }),
      ).rejects.toThrow(NotFoundException);

      membRepo.findById.mockResolvedValue({
        id_membresia: 1,
        fecha_inicio: new Date('2026-05-10T00:00:00Z'),
      });
      await expect(service.update(1, {})).rejects.toThrow(BadRequestException);
      await expect(
        service.update(1, { fecha_fin: 'fecha-invalida' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update(1, { fecha_fin: '2026-05-01' }),
      ).rejects.toThrow(BadRequestException);

      membRepo.update.mockResolvedValue({
        id_membresia: 1,
        renovacion_automatica: true,
      });
      expect(
        (
          await service.update(1, {
            fecha_fin: '2026-06-10',
            renovacion_automatica: true,
          })
        ).id_membresia,
      ).toBe(1);

      // remove: 404 si no existe, 409 si tiene pagos, éxito si no tiene pagos
      membRepo.findById.mockResolvedValueOnce(null);
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);

      membRepo.findById.mockResolvedValue({ id_membresia: 1 });
      membRepo.countPagos.mockResolvedValueOnce(2);
      await expect(service.remove(1)).rejects.toThrow(ConflictException);

      membRepo.countPagos.mockResolvedValueOnce(0);
      membRepo.remove.mockResolvedValueOnce({ id_membresia: 1 });
      expect((await service.remove(1)).id_membresia).toBe(1);

      // softDelete
      membRepo.removePlan.mockResolvedValueOnce(null);
      await expect(service.softDelete(99)).rejects.toThrow(NotFoundException);
      membRepo.removePlan.mockResolvedValueOnce({ id_membresia: 1 });
      expect((await service.softDelete(1)).id_membresia).toBe(1);
    });

    it('verificarMembresia debe evaluar socio activo, en mora y cliente externo sin membresía', async () => {
      userRepo.findById.mockResolvedValueOnce(null);
      await expect(service.verificarMembresia(99)).rejects.toThrow(
        NotFoundException,
      );

      userRepo.findById.mockResolvedValue({ id_usuario: 1, id_sede: 3 });
      membRepo.findActiveByUsuarioId.mockResolvedValueOnce(null);
      membRepo.findSuspendidaVigenteByUsuarioId.mockResolvedValueOnce(null);
      membRepo.findLatestActivaOrVencidaByUsuarioId.mockResolvedValueOnce(null);

      const resExterno = await service.verificarMembresia(1);
      expect(resExterno.esSocioActivo).toBe(false);
      expect(resExterno.enMora).toBe(false);

      // Membresía activa vigente
      membRepo.findActiveByUsuarioId.mockResolvedValueOnce({
        id_membresia: 10,
        fecha_inicio: new Date(Date.now() - 86400000),
        fecha_fin: new Date(Date.now() + 86400000),
        membresia_estado: { descripcion: 'Activa' },
        membresia_plan: { nombre: 'Plan Anual' },
      });
      const resActivo = await service.verificarMembresia(1);
      expect(resActivo.esSocioActivo).toBe(true);
      expect(resActivo.enMora).toBe(false);

      // Membresía vencida (en mora)
      membRepo.findActiveByUsuarioId.mockResolvedValueOnce(null);
      membRepo.findSuspendidaVigenteByUsuarioId.mockResolvedValueOnce(null);
      membRepo.findLatestActivaOrVencidaByUsuarioId.mockResolvedValueOnce({
        id_membresia: 11,
        fecha_inicio: new Date(Date.now() - 172800000),
        fecha_fin: new Date(Date.now() - 86400000),
        membresia_estado: { descripcion: 'Vencida' },
        membresia_plan: { nombre: 'Plan Mensual' },
      });
      const resMora = await service.verificarMembresia(1);
      expect(resMora.esSocioActivo).toBe(false);
      expect(resMora.enMora).toBe(true);
    });
  });

  describe('FotoStorageService', () => {
    const prevUrl = process.env.SUPABASE_URL;
    const prevKey = process.env.SUPABASE_ANON_KEY;

    beforeEach(() => {
      process.env.SUPABASE_URL = 'https://xyz.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'anon-key-test';
    });

    afterAll(() => {
      process.env.SUPABASE_URL = prevUrl;
      process.env.SUPABASE_ANON_KEY = prevKey;
    });

    it('debe validar archivo ausente, formato inválido, tamaño > 2MB y subir/eliminar avatar anterior', async () => {
      const storageService = new FotoStorageService();

      await expect(
        storageService.uploadFoto(
          undefined as unknown as Express.Multer.File,
          1,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        storageService.uploadFoto(
          {
            mimetype: 'application/pdf',
            size: 100,
            buffer: Buffer.from('x'),
          } as Express.Multer.File,
          1,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        storageService.uploadFoto(
          {
            mimetype: 'image/png',
            size: 3 * 1024 * 1024,
            buffer: Buffer.from('x'),
          } as Express.Multer.File,
          1,
        ),
      ).rejects.toThrow(BadRequestException);

      const uploadMock = jest.fn().mockResolvedValue({ error: null });
      const getPublicUrlMock = jest.fn().mockReturnValue({
        data: {
          publicUrl:
            'https://xyz.supabase.co/storage/v1/object/public/fitzonepublic/avatars/usuario-1-999.png',
        },
      });
      const removeMock = jest.fn().mockResolvedValue({});

      (
        storageService as unknown as {
          supabase: { storage: { from: jest.Mock } };
        }
      ).supabase = {
        storage: {
          from: jest.fn().mockReturnValue({
            upload: uploadMock,
            getPublicUrl: getPublicUrlMock,
            remove: removeMock,
          }),
        },
      };

      const url = await storageService.uploadFoto(
        {
          mimetype: 'image/png',
          size: 1024,
          buffer: Buffer.from('img'),
        } as Express.Multer.File,
        1,
        'https://xyz.supabase.co/storage/v1/object/public/fitzonepublic/avatars/usuario-1-old.png',
      );

      expect(url).toContain('avatars/usuario-1-999.png');
      expect(removeMock).toHaveBeenCalledWith(['avatars/usuario-1-old.png']);

      // Error de upload en Supabase -> 500
      uploadMock.mockResolvedValueOnce({ error: { message: 'Bucket error' } });
      await expect(
        storageService.uploadFoto(
          {
            mimetype: 'image/webp',
            size: 1024,
            buffer: Buffer.from('img'),
          } as Express.Multer.File,
          1,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('MembresiasRepository', () => {
    it('debe cubrir consultas Prisma, auto-creación de estado y promoción de externo a socio', async () => {
      const mockPrisma = {
        membresiaEstado: {
          findFirst: jest.fn(),
          create: jest.fn(),
        },
        membresia: {
          create: jest.fn(),
          findFirst: jest.fn(),
          findMany: jest.fn(),
          update: jest.fn(),
          updateMany: jest.fn(),
        },
        pago: {
          count: jest.fn().mockResolvedValue(1),
        },
        usuarioRol: {
          findMany: jest.fn(),
          deleteMany: jest.fn(),
          upsert: jest.fn(),
        },
        rol: {
          findFirst: jest.fn(),
          create: jest.fn(),
        },
      };

      const repo = new MembresiasRepository(
        mockPrisma as unknown as PrismaService,
      );

      // obtenerEstadoId auto-crea si no existe
      mockPrisma.membresiaEstado.findFirst.mockResolvedValueOnce(null);
      mockPrisma.membresiaEstado.create.mockResolvedValueOnce({
        id_membresia_estado: 9,
      });
      expect(await repo.obtenerEstadoId('Suspendida')).toBe(9);

      // create con estado Activa promueve externo a socio (creando rol socio si no existe)
      mockPrisma.membresiaEstado.findFirst.mockResolvedValueOnce({
        id_membresia_estado: 1,
      });
      mockPrisma.membresia.create.mockResolvedValueOnce({
        id_membresia: 100,
        id_usuario: 5,
        membresia_estado: { descripcion: 'Activa' },
      });
      mockPrisma.usuarioRol.findMany.mockResolvedValueOnce([
        { rol: { nombre: 'externo' } },
      ]);
      mockPrisma.rol.findFirst.mockResolvedValueOnce(null);
      mockPrisma.rol.create.mockResolvedValueOnce({
        id_rol: 2,
        nombre: 'socio',
      });

      await repo.create({
        id_usuario: 5,
        id_membresia_plan: 1,
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
      });
      expect(mockPrisma.usuarioRol.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.usuarioRol.upsert).toHaveBeenCalled();

      // updateEstado a Activa con usuario que ya no es externo
      mockPrisma.membresia.update.mockResolvedValueOnce({
        id_membresia: 100,
        id_usuario: 5,
        membresia_estado: { descripcion: 'Activa' },
      });
      mockPrisma.usuarioRol.findMany.mockResolvedValueOnce([
        { rol: { nombre: 'socio' } },
      ]);
      await repo.updateEstado(100, 1);

      // Consultas de membresías
      mockPrisma.membresia.findFirst.mockResolvedValue(null);
      mockPrisma.membresia.findMany.mockResolvedValue([]);

      await repo.findActiveByUsuarioId(5);
      await repo.findSuspendidaVigenteByUsuarioId(5);
      await repo.findLatestActivaOrVencidaByUsuarioId(5);
      await repo.findByUsuarioId(5);
      await repo.findAll({
        id_usuario: 5,
        id_membresia_estado: 1,
        id_membresia_plan: 1,
      });
      await repo.countPagosAprobados(100);
    });
  });
});
