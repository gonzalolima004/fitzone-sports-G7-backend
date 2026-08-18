/**
 * ARCHIVO: usuarios.module.ts
 * PROPÓSITO: Es el módulo de la funcionalidad "usuarios".
 * Agrupa el controlador y el servicio para que NestJS sepa que trabajan juntos.
 * Si este módulo se importa en app.module.ts, toda la funcionalidad estará disponible.
 */
import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';

@Module({
  controllers: [UsuariosController],
  providers: [UsuariosService],
})
export class UsuariosModule {}
