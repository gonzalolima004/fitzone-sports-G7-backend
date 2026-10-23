/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  INestApplication,
  ValidationPipe,
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import request from 'supertest';
import { CreateUsuarioDto } from '../dto/crear-usuario.dto';
import { Test, TestingModule } from '@nestjs/testing';

// Controlador Dummy efímero para poder golpear el pipeline HTTP real
@Controller('test-usuarios')
class TestUsuariosController {
  @Post()
  crear(@Body() dto: CreateUsuarioDto) {
    // Si llega aquí, pasó todas las validaciones y transformaciones
    return dto;
  }
}

describe('CreateUsuarioDto (Integración ValidationPipe)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestUsuariosController],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Replicamos la configuración típica de validación en NestJS
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('debería aceptar un DTO válido y aplicar las transformaciones (capitalización y limpieza de DNI)', async () => {
    const payloadValido = {
      dni: ' 38.451.220 ',
      email: 'JUAN.PEREZ@fitzone.com',
      nombre: 'juan ignacio',
      apellido: 'perez',
      telefono: '+5493451234567',
      id_sede: '1',
      roles: [4],
    };

    const response = await request(app.getHttpServer())
      .post('/test-usuarios')
      .send(payloadValido)
      .expect(201);

    // Verificamos las transformaciones (@Transform)
    expect(response.body.dni).toBe('38451220');
    expect(response.body.email).toBe('juan.perez@fitzone.com');
    expect(response.body.nombre).toBe('Juan Ignacio');
    expect(response.body.apellido).toBe('Perez');
  });

  it('debería rechazar si faltan campos obligatorios', async () => {
    const payloadInvalido = {
      // Faltan dni, email, nombre, etc.
      id_sede: '1',
    };

    const response = await request(app.getHttpServer())
      .post('/test-usuarios')
      .send(payloadInvalido)
      .expect(400);

    const mensajes = response.body.message;
    expect(mensajes).toEqual(
      expect.arrayContaining([
        'El DNI no puede estar vacío',
        'El correo electrónico no puede estar vacío',
        'El nombre no puede estar vacío',
      ]),
    );
  });

  it('debería rechazar contraseñas que no cumplen con los requisitos mínimos', async () => {
    const payloadPassInvalido = {
      dni: '12345678',
      email: 'test@test.com',
      nombre: 'Test',
      apellido: 'Test',
      telefono: '123',
      id_sede: '1',
      contrasenia: '123', // Muy corta
    };

    const response = await request(app.getHttpServer())
      .post('/test-usuarios')
      .send(payloadPassInvalido)
      .expect(400);

    expect(response.body.message).toContain(
      'La contraseña debe tener al menos 6 caracteres',
    );
  });

  it('debería ignorar campos adicionales no permitidos gracias a whitelist', async () => {
    const payloadConBasura = {
      dni: '12345678',
      email: 'test@test.com',
      nombre: 'Test',
      apellido: 'Test',
      telefono: '123',
      id_sede: '1',
      rolAdminFalso: true, // Campo no existente
    };

    const response = await request(app.getHttpServer())
      .post('/test-usuarios')
      .send(payloadConBasura)
      .expect(201);

    expect(response.body).not.toHaveProperty('rolAdminFalso');
  });
});
