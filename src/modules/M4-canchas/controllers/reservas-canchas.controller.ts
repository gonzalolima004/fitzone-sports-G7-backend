import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReservasCanchasService } from '../services/reservas-canchas.service';
import { CrearReservaCanchaDto } from '../dto/crear-reserva-cancha.dto';
import { ReservaCanchaResponseDto } from '../dto/reserva-cancha-response.dto';
// Ajustar rutas relativas si los decorators/guards de la Épica 1 están en otra ubicación
// import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
// import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Reservas de Canchas')
@Controller('reservas-canchas')
export class ReservasCanchasController {
  constructor(private readonly reservasService: ReservasCanchasService) {}

  @Post()
  // @UseGuards(SupabaseAuthGuard) <-- Descomentar cuando la Épica 1 esté integrada
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear una reserva de cancha garantizando concurrencia (RN-02)',
  })
  @ApiResponse({ status: 201, type: ReservaCanchaResponseDto })
  crearReserva(
    @Body() dto: CrearReservaCanchaDto,
    // @CurrentUser() usuario: AuthenticatedUser <-- Descomentar luego
  ) {
    const idUsuarioMock = 1; // Temporal para testing local sin JWT
    return this.reservasService.crearReserva(dto, idUsuarioMock);
  }
}
