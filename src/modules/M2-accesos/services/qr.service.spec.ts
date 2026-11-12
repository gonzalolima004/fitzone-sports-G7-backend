import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { QrService } from './qr.service';
import { MembresiasService } from '../../M1-usuarios/services/membresias.service';
import { VerificarMembresiaResponseDto } from '../../M1-usuarios/dto/verificar-membresia-response.dto';
import { UsuariosService } from '../../M1-usuarios/services/usuarios.service';
describe('QrService', () => {
  let service: QrService;
  let membresiasService: jest.Mocked<MembresiasService>;

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('super-secret-test-key-12345'),
  };

  const mockMembresiasService = {
    verificarMembresia: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QrService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: MembresiasService,
          useValue: mockMembresiasService,
        },
        {
          provide: UsuariosService,
          useValue: {
            findById: jest.fn().mockResolvedValue({
              id_usuario: 42,
              sede: {
                id_ciudad: 1,
              },
            }),
          },
        },
      ],
    }).compile();

    service = module.get<QrService>(QrService);
    membresiasService = module.get(MembresiasService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('generarQrDinamico', () => {
    it('debe generar un token QR dinámico válido si el usuario tiene membresía activa y al día', async () => {
      // Arrange
      membresiasService.verificarMembresia.mockResolvedValue({
        esSocioActivo: true,
        enMora: false,
      } as unknown as VerificarMembresiaResponseDto);

      // Act
      const resultado = await service.generarQrDinamico(42);

      // Assert
      expect(resultado).toBeDefined();
      expect(resultado.token).toBeDefined();
      expect(resultado.expiraEnSegundos).toBe(60);
      expect(resultado.fechaGeneracion).toBeInstanceOf(Date);

      const partes = resultado.token.split('.');
      expect(partes).toHaveLength(4);
      expect(partes[0]).toBe('42');
    });

    it('debe lanzar ForbiddenException si el usuario no tiene membresía activa o está en mora', async () => {
      // Arrange
      membresiasService.verificarMembresia.mockResolvedValue({
        esSocioActivo: false,
        enMora: true,
      } as unknown as VerificarMembresiaResponseDto);

      // Act & Assert
      await expect(service.generarQrDinamico(42)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('validarTokenEfimero', () => {
    it('debe retornar true si el token es reciente, bien formado y pertenece al usuario', async () => {
      // Arrange
      membresiasService.verificarMembresia.mockResolvedValue({
        esSocioActivo: true,
        enMora: false,
      } as unknown as VerificarMembresiaResponseDto);

      const qrGenerado = await service.generarQrDinamico(42);

      // Act
      const esValido = service.validarTokenEfimero(qrGenerado.token, 42);

      // Assert
      expect(esValido).toBe(true);
    });

    it('debe lanzar BadRequestException si el formato del token no tiene 3 partes', () => {
      const tokenMalFormado = '42.123456789';

      expect(() => {
        service.validarTokenEfimero(tokenMalFormado, 42);
      }).toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si el token pertenece a otro usuario', async () => {
      membresiasService.verificarMembresia.mockResolvedValue({
        esSocioActivo: true,
        enMora: false,
      } as unknown as VerificarMembresiaResponseDto);

      const qrGenerado = await service.generarQrDinamico(42);

      expect(() => {
        service.validarTokenEfimero(qrGenerado.token, 99);
      }).toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si el token ha expirado (más de 60 segundos)', async () => {
      membresiasService.verificarMembresia.mockResolvedValue({
        esSocioActivo: true,
        enMora: false,
      } as unknown as VerificarMembresiaResponseDto);

      const timestampAntiguo = Math.floor(Date.now() / 1000) - 120;
      const qrLegitimo = await service.generarQrDinamico(42);
      const [userId, , signature] = qrLegitimo.token.split('.');
      const tokenExpirado = `${userId}.${timestampAntiguo}.${signature}`;

      expect(() => {
        service.validarTokenEfimero(tokenExpirado, 42);
      }).toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si la firma del token fue alterada', async () => {
      membresiasService.verificarMembresia.mockResolvedValue({
        esSocioActivo: true,
        enMora: false,
      } as unknown as VerificarMembresiaResponseDto);

      const qrLegitimo = await service.generarQrDinamico(42);
      const [userId, timestamp] = qrLegitimo.token.split('.');
      const tokenAlterado = `${userId}.${timestamp}.firmasttrucha1234`;

      expect(() => {
        service.validarTokenEfimero(tokenAlterado, 42);
      }).toThrow(BadRequestException);
    });
  });
});
