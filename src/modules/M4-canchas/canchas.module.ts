import { Module } from '@nestjs/common';
import { CanchasController } from './controllers/canchas.controller';
import { CanchasService } from './services/canchas.service';
import { CanchasRepository } from './repositories/canchas.repository';

@Module({
  // Los controladores que manejan las rutas (ej. GET /canchas)
  controllers: [CanchasController],

  // La lógica de negocio y el acceso a base de datos que se inyectan
  providers: [CanchasService, CanchasRepository],

  // Exportamos el servicio por si otro módulo (ej. Reservas o Pagos) necesita consultarlo en el futuro
  exports: [CanchasService],
})
export class CanchasModule {}
