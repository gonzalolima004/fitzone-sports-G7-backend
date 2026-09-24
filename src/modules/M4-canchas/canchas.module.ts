import { Module } from '@nestjs/common';
import { CanchasController } from './controllers/canchas.controller';
import { CanchasService } from './services/canchas.service';
import { CanchasRepository } from './repositories/canchas.repository';
import { ReservasCanchasRepository } from './repositories/reservas-canchas.repository';
import { PrecioEstandarStrategy } from './patterns/strategy/precio-estandar.strategy';
import { DescuentoSocioStrategy } from './patterns/strategy/descuento-socio.strategy';
import { HorarioPicoStrategy } from './patterns/strategy/horario-pico.strategy';
import { PrecioContextService } from './services/precio-context.service';

@Module({
  // Los controladores que manejan las rutas (ej. GET /canchas)
  controllers: [CanchasController],

  // La lógica de negocio y el acceso a base de datos que se inyectan
  providers: [
    CanchasService,
    CanchasRepository,
    ReservasCanchasRepository,
    // Registramos las estrategias y su contexto
    PrecioEstandarStrategy,
    DescuentoSocioStrategy,
    HorarioPicoStrategy,
    PrecioContextService,
  ],
  // Exportamos el servicio por si otro módulo (ej. Reservas o Pagos) necesita consultarlo en el futuro
  exports: [
    CanchasService,
    ReservasCanchasRepository,
    PrecioContextService, // Exportado para usarlo luego en la reserva final
  ],
})
export class CanchasModule {}
