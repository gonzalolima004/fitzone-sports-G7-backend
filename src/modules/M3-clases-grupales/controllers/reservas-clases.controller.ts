import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReservasClasesService } from '../services/reservas-clases.service';
import { CrearReservaClaseDto } from '../dto/crear-reserva-clase.dto';
import { ReservaClaseResponseDto } from '../dto/reserva-clase-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUserId } from '../../../common/decorators/current-user.decorator';

@ApiTags('Reservas de Clases Grupales')
@ApiBearerAuth()
@Controller('reservas-clases')
export class ReservasClasesController {
  constructor(private readonly reservasService: ReservasClasesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reservar una clase grupal (hasta 48h antes)' })
  @ApiResponse({
    status: 201,
    description: 'Reserva confirmada exitosamente.',
    type: ReservaClaseResponseDto,
  })
  async crearReserva(
    @Body() crearReservaDto: CrearReservaClaseDto,
    @CurrentUserId() userId: number,
  ) {
    return await this.reservasService.crearReserva(crearReservaDto, userId);
  }
}
