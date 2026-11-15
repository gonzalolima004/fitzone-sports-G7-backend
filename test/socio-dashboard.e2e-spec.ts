import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { UsuariosRepository } from '../src/modules/M1-usuarios/repositories/usuarios.repository';
import { SupabaseService } from '../src/common/supabase/supabase.service';
import { SocioDashboardService } from '../src/modules/M1-usuarios/services/socio-dashboard.service';
import { TipoActividadHistorial } from '../src/modules/M1-usuarios/dto/historial-query.dto';

describe('Socio Dashboard & Historial (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let mockUsuariosRepository: Record<string, jest.Mock>;
  let mockSupabaseService: Record<string, jest.Mock>;
  let mockSocioDashboardService: Record<string, jest.Mock>;

  const socioUser = {
    id_usuario: 10,
    supabase_user_id: 'sub-socio-123',
    email: 'socio@fitzone.com',
    rol: 'socio',
    roles: ['socio'],
  };

  const externoUser = {
    id_usuario: 20,
    supabase_user_id: 'sub-externo-456',
    email: 'externo@fitzone.com',
    rol: 'externo',
    roles: ['externo'],
  };

  beforeAll(async () => {
    mockUsuariosRepository = {
      findAuthProfileByEmail: jest.fn(),
      findById: jest.fn(),
    };

    mockSupabaseService = {
      getUser: jest.fn(),
    };

    mockSocioDashboardService = {
      obtenerDashboard: jest.fn(),
      obtenerHistorial: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UsuariosRepository)
      .useValue(mockUsuariosRepository)
      .overrideProvider(SupabaseService)
      .useValue(mockSupabaseService)
      .overrideProvider(SocioDashboardService)
      .useValue(mockSocioDashboardService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /usuarios/me/dashboard', () => {
    it('debería responder 401 si no se envía token de autorización', async () => {
      await request(app.getHttpServer())
        .get('/usuarios/me/dashboard')
        .expect(401);
    });

    it('debería responder 403 Forbidden cuando el usuario tiene rol "externo"', async () => {
      const tokenExterno = jwtService.sign(
        {
          id_usuario: externoUser.id_usuario,
          sub: externoUser.id_usuario,
          email: externoUser.email,
          rol: 'externo',
          roles: ['externo'],
        },
        { secret: process.env.JWT_SECRET || 'secreto_desarrollo_fitzone' },
      );

      mockSupabaseService.getUser.mockResolvedValue({
        data: {
          user: {
            id: externoUser.supabase_user_id,
            email: externoUser.email,
            user_metadata: {},
          },
        },
        error: null,
      });

      mockUsuariosRepository.findAuthProfileByEmail.mockResolvedValue({
        id_usuario: externoUser.id_usuario,
        dni: '22222222',
        email: externoUser.email,
        nombre: 'Pedro',
        apellido: 'Externo',
        telefono: '112233',
        foto_url: null,
        id_sede: 1,
        id_usuario_estado: 1,
        sede: { id_sede: 1, nombre: 'Sede Central', id_ciudad: 1 },
        usuario_rol: [{ rol: { id_rol: 2, nombre: 'externo' } }],
      });

      const response = await request(app.getHttpServer())
        .get('/usuarios/me/dashboard')
        .set('Authorization', `Bearer ${tokenExterno}`)
        .expect(403);

      const body = response.body as { message?: string };
      expect(body.message).toContain('Acceso denegado');
      expect(mockSocioDashboardService.obtenerDashboard).not.toHaveBeenCalled();
    });

    it('debería responder 200 con el resumen del dashboard cuando el usuario tiene rol "socio"', async () => {
      const tokenSocio = jwtService.sign(
        {
          id_usuario: socioUser.id_usuario,
          sub: socioUser.id_usuario,
          email: socioUser.email,
          rol: 'socio',
          roles: ['socio'],
        },
        { secret: process.env.JWT_SECRET || 'secreto_desarrollo_fitzone' },
      );

      mockSupabaseService.getUser.mockResolvedValue({
        data: {
          user: {
            id: socioUser.supabase_user_id,
            email: socioUser.email,
            user_metadata: {},
          },
        },
        error: null,
      });

      mockUsuariosRepository.findAuthProfileByEmail.mockResolvedValue({
        id_usuario: socioUser.id_usuario,
        dni: '11111111',
        email: socioUser.email,
        nombre: 'Carlos',
        apellido: 'Socio',
        telefono: '445566',
        foto_url: null,
        id_sede: 1,
        id_usuario_estado: 1,
        sede: { id_sede: 1, nombre: 'Sede Central', id_ciudad: 1 },
        usuario_rol: [{ rol: { id_rol: 1, nombre: 'socio' } }],
      });

      const mockDashboardResult = {
        membresia: {
          id_membresia: 1,
          plan: 'Pase Libre',
          estado: 'Activa',
          fecha_inicio: '2026-11-01',
          fecha_fin: '2026-12-01',
          dias_restantes: 16,
          renovacion_automatica: true,
        },
        totales: {
          total_canchas: 5,
          total_clases: 3,
          total_actividades: 8,
          proximas_confirmadas: 2,
        },
        proximas_actividades: [],
      };

      mockSocioDashboardService.obtenerDashboard.mockResolvedValue(
        mockDashboardResult,
      );

      const response = await request(app.getHttpServer())
        .get('/usuarios/me/dashboard')
        .set('Authorization', `Bearer ${tokenSocio}`)
        .expect(200);

      expect(mockSocioDashboardService.obtenerDashboard).toHaveBeenCalledWith(
        socioUser.id_usuario,
      );
      expect(response.body).toEqual(mockDashboardResult);
    });
  });

  describe('GET /usuarios/me/historial', () => {
    it('debería responder 403 Forbidden cuando un no-socio intenta consultar el historial', async () => {
      const tokenExterno = jwtService.sign(
        {
          id_usuario: externoUser.id_usuario,
          sub: externoUser.id_usuario,
          email: externoUser.email,
          rol: 'externo',
          roles: ['externo'],
        },
        { secret: process.env.JWT_SECRET || 'secreto_desarrollo_fitzone' },
      );

      mockSupabaseService.getUser.mockResolvedValue({
        data: {
          user: {
            id: externoUser.supabase_user_id,
            email: externoUser.email,
            user_metadata: {},
          },
        },
        error: null,
      });

      mockUsuariosRepository.findAuthProfileByEmail.mockResolvedValue({
        id_usuario: externoUser.id_usuario,
        dni: '22222222',
        email: externoUser.email,
        nombre: 'Pedro',
        apellido: 'Externo',
        telefono: '112233',
        foto_url: null,
        id_sede: 1,
        id_usuario_estado: 1,
        sede: { id_sede: 1, nombre: 'Sede Central', id_ciudad: 1 },
        usuario_rol: [{ rol: { id_rol: 2, nombre: 'externo' } }],
      });

      await request(app.getHttpServer())
        .get('/usuarios/me/historial')
        .set('Authorization', `Bearer ${tokenExterno}`)
        .expect(403);

      expect(mockSocioDashboardService.obtenerHistorial).not.toHaveBeenCalled();
    });

    it('debería responder 200 y pasar correctamente los parámetros de paginación y filtro para un socio', async () => {
      const tokenSocio = jwtService.sign(
        {
          id_usuario: socioUser.id_usuario,
          sub: socioUser.id_usuario,
          email: socioUser.email,
          rol: 'socio',
          roles: ['socio'],
        },
        { secret: process.env.JWT_SECRET || 'secreto_desarrollo_fitzone' },
      );

      mockSupabaseService.getUser.mockResolvedValue({
        data: {
          user: {
            id: socioUser.supabase_user_id,
            email: socioUser.email,
            user_metadata: {},
          },
        },
        error: null,
      });

      mockUsuariosRepository.findAuthProfileByEmail.mockResolvedValue({
        id_usuario: socioUser.id_usuario,
        dni: '11111111',
        email: socioUser.email,
        nombre: 'Carlos',
        apellido: 'Socio',
        telefono: '445566',
        foto_url: null,
        id_sede: 1,
        id_usuario_estado: 1,
        sede: { id_sede: 1, nombre: 'Sede Central', id_ciudad: 1 },
        usuario_rol: [{ rol: { id_rol: 1, nombre: 'socio' } }],
      });

      const mockHistorialResult = {
        items: [
          {
            id: 'cancha-1',
            tipo: 'cancha',
            titulo: 'Cancha Pádel 1',
            fecha_inicio: '2026-11-20T10:00:00.000Z',
            fecha_fin: '2026-11-20T11:00:00.000Z',
            estado: 'Confirmada',
            sede: { id_sede: 1, nombre: 'Central' },
          },
        ],
        meta: { total: 1, page: 1, limit: 10, total_paginas: 1 },
      };

      mockSocioDashboardService.obtenerHistorial.mockResolvedValue(
        mockHistorialResult,
      );

      const response = await request(app.getHttpServer())
        .get('/usuarios/me/historial?page=1&limit=10&tipo=canchas')
        .set('Authorization', `Bearer ${tokenSocio}`)
        .expect(200);

      expect(mockSocioDashboardService.obtenerHistorial).toHaveBeenCalledWith(
        socioUser.id_usuario,
        expect.objectContaining({
          page: 1,
          limit: 10,
          tipo: TipoActividadHistorial.CANCHAS,
        }),
      );
      expect(response.body).toEqual(mockHistorialResult);
    });
  });
});
