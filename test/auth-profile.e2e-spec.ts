import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { UsuariosRepository } from '../src/modules/M1-usuarios/repositories/usuarios.repository';
import { SupabaseService } from '../src/common/supabase/supabase.service';

describe('Auth & Profile (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let mockUsuariosRepository: any;
  let mockSupabaseService: any;

  beforeAll(async () => {
    mockUsuariosRepository = {
      findExistingByDniOrEmail: jest.fn(),
      findRolByNombre: jest.fn(),
      create: jest.fn(),
      findAuthProfileByEmail: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    mockSupabaseService = {
      getUser: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UsuariosRepository)
      .useValue(mockUsuariosRepository)
      .overrideProvider(SupabaseService)
      .useValue(mockSupabaseService)
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

  describe('POST /usuarios', () => {
    it('debería asignar dinámicamente el rol "externo" incluso si el payload incluye roles: [1]', async () => {
      mockUsuariosRepository.findExistingByDniOrEmail.mockResolvedValue(null);
      mockUsuariosRepository.findRolByNombre.mockResolvedValue({
        id_rol: 99,
        nombre: 'externo',
      });
      mockUsuariosRepository.create.mockResolvedValue({
        id_usuario: 1,
        dni: '12345678',
        email: 'externo@fitzone.com',
        nombre: 'Test',
        apellido: 'Externo',
        telefono: '+54911223344',
        foto_url: null,
        id_sede: 1,
        id_usuario_estado: 1,
        creacion: new Date(),
        modificado: new Date(),
        usuario_rol: [
          {
            rol: { id_rol: 99, nombre: 'externo' },
          },
        ],
        sede: {
          id_sede: 1,
          nombre: 'Central',
          ciudad: { id_ciudad: 1, nombre: 'CABA' },
        },
        usuario_estado: { id_usuario_estado: 1, descripcion: 'activo' },
      });

      const response = await request(app.getHttpServer())
        .post('/usuarios')
        .send({
          dni: '12345678',
          email: 'externo@fitzone.com',
          contrasenia: 'Password123!',
          nombre: 'Test',
          apellido: 'Externo',
          telefono: '+54911223344',
          id_sede: 1,
          roles: [1], // Intento de inyectar rol de administrador/socio
        })
        .expect(201);

      expect(mockUsuariosRepository.findRolByNombre).toHaveBeenCalledWith(
        'externo',
      );
      expect(mockUsuariosRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_rol: {
            create: [
              {
                rol: { connect: { id_rol: 99 } },
              },
            ],
          },
        }),
      );
      expect(response.body).toBeDefined();
    });
  });

  describe('GET /auth/me', () => {
    it('debería retornar el perfil optimizado (nombre, apellido, rol)', async () => {
      const token = jwtService.sign({
        sub: 10,
        email: 'user10@fitzone.com',
        rol: 'externo',
        roles: ['externo'],
      });

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toEqual(
        expect.objectContaining({
          id_usuario: 10,
          email: 'user10@fitzone.com',
          rol: 'externo',
        }),
      );
    });
  });

  describe('PATCH /usuarios/:id', () => {
    it('debería rechazar con 400 el envío de campos no permitidos en el body (dni, email o roles)', async () => {
      const token = jwtService.sign({
        sub: 5,
        email: 'user5@fitzone.com',
        rol: 'externo',
        roles: ['externo'],
      });

      await request(app.getHttpServer())
        .patch('/usuarios/5')
        .set('Authorization', `Bearer ${token}`)
        .send({
          dni: '99999999',
        })
        .expect(400);

      await request(app.getHttpServer())
        .patch('/usuarios/5')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'nuevo@fitzone.com',
        })
        .expect(400);

      await request(app.getHttpServer())
        .patch('/usuarios/5')
        .set('Authorization', `Bearer ${token}`)
        .send({
          roles: [2],
        })
        .expect(400);
    });

    it('debería rechazar con 403 la edición del perfil de otro usuario', async () => {
      const token = jwtService.sign({
        sub: 5,
        email: 'user5@fitzone.com',
        rol: 'externo',
        roles: ['externo'],
      });

      await request(app.getHttpServer())
        .patch('/usuarios/6')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Hacker',
        })
        .expect(403);
    });

    it('debería actualizar con 200 nombre, apellido y telefono del propio usuario', async () => {
      const token = jwtService.sign({
        sub: 5,
        email: 'user5@fitzone.com',
        rol: 'externo',
        roles: ['externo'],
      });

      mockUsuariosRepository.findById.mockResolvedValue({
        id_usuario: 5,
        nombre: 'Anterior',
        apellido: 'User',
        telefono: '+11111111',
      });

      mockUsuariosRepository.update.mockResolvedValue({
        id_usuario: 5,
        nombre: 'Nuevo Nombre',
        apellido: 'Nuevo Apellido',
        telefono: '+54911888888',
        email: 'user5@fitzone.com',
        dni: '12345678',
        id_sede: 1,
        id_usuario_estado: 1,
        usuario_rol: [],
      });

      const response = await request(app.getHttpServer())
        .patch('/usuarios/5')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Nuevo Nombre',
          apellido: 'Nuevo Apellido',
          telefono: '+54911888888',
        })
        .expect(200);

      expect(mockUsuariosRepository.update).toHaveBeenCalledWith(5, {
        nombre: 'Nuevo Nombre',
        apellido: 'Nuevo Apellido',
        telefono: '+54911888888',
      });
      expect(response.body.nombre).toBe('Nuevo Nombre');
      expect(response.body.apellido).toBe('Nuevo Apellido');
      expect(response.body.telefono).toBe('+54911888888');
    });
  });
});
