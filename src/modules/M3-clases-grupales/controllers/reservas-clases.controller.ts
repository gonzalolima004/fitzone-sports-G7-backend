import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Delete,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReservasClasesService } from '../services/reservas-clases.service';
import { CrearReservaClaseDto } from '../dto/crear-reserva-clase.dto';
import { ReservaClaseResponseDto } from '../dto/reserva-clase-response.dto';
import { CancelarReservaResponseDto } from '../dto/cancelar-reserva-response.dto';
import { MiReservaClaseResponseDto } from '../dto/mis-reservas-response.dto';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { CurrentUserId } from '../../../common/decorators/current-user.decorator';

@ApiTags('Reservas de Clases Grupales')
@ApiBearerAuth()
@Controller('reservas-clases')
export class ReservasClasesController {
  constructor(private readonly reservasService: ReservasClasesService) {}

  @Get('mis-reservas')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary: 'Consultar las reservas de clases del usuario autenticado',
    description: 'Permite filtrar opcionalmente por fecha (formato YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'fecha',
    required: false,
    description: 'Filtrar reservas por fecha en formato YYYY-MM-DD',
    example: '2026-10-12',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de reservas del usuario autenticado.',
    type: [MiReservaClaseResponseDto],
  })
  async obtenerMisReservas(
    @CurrentUserId() userId: number,
    @Query('fecha') fecha?: string,
  ) {
    return await this.reservasService.obtenerMisReservas(userId, fecha);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
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
  @UseGuards(SupabaseAuthGuard)
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
