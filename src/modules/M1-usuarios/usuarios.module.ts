import { Module } from '@nestjs/common';
import { MembresiasController } from './controllers/membresias.controller';
import { UsuariosController } from './controllers/usuarios.controller';
import { PlanesController } from './controllers/planes.controller';
import { UploadFotoController } from './controllers/upload-foto.controller';
import { UsuariosService } from './services/usuarios.service';
import { UsuariosRepository } from './repositories/usuarios.repository';
import { PlanesService } from './services/planes.service';
import { MembresiasService } from './services/membresias.service';
import { FotoStorageService } from './services/foto-storage.service';

@Module({
  controllers: [
    UsuariosController,
    PlanesController,
    MembresiasController,
    UploadFotoController,
  ],
  providers: [
    UsuariosService,
    UsuariosRepository,
    PlanesService,
    MembresiasService,
    FotoStorageService,
  ],
  exports: [UsuariosService, MembresiasService],
})
export class UsuariosModule {}
