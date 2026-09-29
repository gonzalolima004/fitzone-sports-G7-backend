import {
  Controller,
  Post,
  Body,
  UseGuards,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReservasClasesService } from '../services/reservas-clases.service';
import { CrearReservaClaseDto } from '../dto/crear-reserva-clase.dto';
import { ReservaClaseResponseDto } from '../dto/reserva-clase-response.dto';
import { CancelarReservaResponseDto } from '../dto/cancelar-reserva-response.dto';
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Cancelar una reserva de clase',
    description:
      'Cancela la reserva. Si se hace con menos de 2 horas de anticipación, se aplica penalidad.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reserva cancelada (indica si hubo penalidad).',
    type: CancelarReservaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'La clase ya comenzó/finalizó o ya estaba cancelada.',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para cancelar esta reserva.',
  })
  @ApiResponse({
    status: 404,
    description: 'La reserva no existe.',
  })
  async cancelarReserva(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
  ): Promise<CancelarReservaResponseDto> {
    return await this.reservasService.cancelarReserva(id, userId);
  }
}
