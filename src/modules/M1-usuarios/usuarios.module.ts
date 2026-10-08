import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt'; // <-- Nuevo
// Controladores
import { MembresiasController } from './controllers/membresias.controller';
import { UsuariosController } from './controllers/usuarios.controller';
import { PlanesController } from './controllers/planes.controller';
import { UploadFotoController } from './controllers/upload-foto.controller';
import { AuthController } from './controllers/auth.controller'; // <-- Nuevo
// Servicios y Repositorios
import { UsuariosService } from './services/usuarios.service';
import { UsuariosRepository } from './repositories/usuarios.repository';
import { MembresiasRepository } from './repositories/membresias.repository';
import { PlanesService } from './services/planes.service';
import { MembresiasService } from './services/membresias.service';
import { FotoStorageService } from './services/foto-storage.service';
import { AuthService } from './services/auth.service'; // <-- Nuevo

@Global()
@Module({
  imports: [
    // Registramos JWT para firmar tokens
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secreto_desarrollo_fitzone',
      signOptions: { expiresIn: '8h' }, // El token durará 8 horas
    }),
  ],
  controllers: [
    UsuariosController,
    PlanesController,
    MembresiasController,
    UploadFotoController,
    AuthController,
  ],
  providers: [
    UsuariosService,
    UsuariosRepository,
    MembresiasRepository,
    PlanesService,
    MembresiasService,
    FotoStorageService,
    AuthService,
  ],
  exports: [UsuariosService, MembresiasService],
})
export class UsuariosModule {}
