import { Module } from '@nestjs/common';
// Controladores
import { CanchasController } from './controllers/canchas.controller';
import { ReservasCanchasController } from './controllers/reservas-canchas.controller';
import { MantenimientoController } from './controllers/mantenimiento.controller';

// Servicios
import { CanchasService } from './services/canchas.service';
import { ReservasCanchasService } from './services/reservas-canchas.service';
import { MantenimientoService } from './services/mantenimiento.service';
import { PrecioContextService } from './services/precio-context.service';

// Repositorios
import { CanchasRepository } from './repositories/canchas.repository';
import { ReservasCanchasRepository } from './repositories/reservas-canchas.repository';

// Estrategias (Pattern Strategy)
import { PrecioEstandarStrategy } from './patterns/strategy/precio-estandar.strategy';
import { DescuentoSocioStrategy } from './patterns/strategy/descuento-socio.strategy';
import { HorarioPicoStrategy } from './patterns/strategy/horario-pico.strategy';

@Module({
  controllers: [
    CanchasController,
    ReservasCanchasController,
    MantenimientoController,
  ],
  providers: [
    CanchasService,
    ReservasCanchasService,
    MantenimientoService,
    PrecioContextService,
    CanchasRepository,
    ReservasCanchasRepository,
    PrecioEstandarStrategy,
    DescuentoSocioStrategy,
    HorarioPicoStrategy,
  ],
  exports: [CanchasService, ReservasCanchasService, MantenimientoService],
})
export class CanchasModule {}
