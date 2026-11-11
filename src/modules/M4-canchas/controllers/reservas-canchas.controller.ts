import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReservasCanchasService } from '../services/reservas-canchas.service';
import { CrearReservaCanchaDto } from '../dto/crear-reserva-cancha.dto';
import { ReservaCanchaResponseDto } from '../dto/reserva-cancha-response.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import * as authenticatedUserInterface from '../../../common/interfaces/authenticated-user.interface';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';

@ApiTags('Reservas de Canchas')
@Controller('reservas-canchas')
export class ReservasCanchasController {
  constructor(private readonly reservasService: ReservasCanchasService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear una reserva de cancha garantizando concurrencia (RN-02)',
  })
  @ApiResponse({ status: 201, type: ReservaCanchaResponseDto })
  crearReserva(
    @Body() dto: CrearReservaCanchaDto,
    @CurrentUser() usuario: authenticatedUserInterface.AuthenticatedUser,
  ) {
    return this.reservasService.crearReserva(dto, usuario.id_usuario);
  }
  @Get(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener detalle de una reserva por ID' })
  obtenerReserva(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() usuario: authenticatedUserInterface.AuthenticatedUser,
  ) {
    return this.reservasService.obtenerReservaPorId(id, usuario);
  }
}
