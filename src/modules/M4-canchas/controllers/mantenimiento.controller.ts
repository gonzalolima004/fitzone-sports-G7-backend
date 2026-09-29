import { Controller, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MantenimientoService } from '../services/mantenimiento.service';
import { CrearMantenimientoDto } from '../dto/crear-mantenimiento.dto';
import { MantenimientoResponseDto } from '../dto/mantenimiento-response.dto';

@ApiTags('Mantenimiento de Canchas')
@Controller('canchas')
export class MantenimientoController {
  constructor(private readonly mantenimientoService: MantenimientoService) {}

  @Post(':id/mantenimiento')
  @ApiBearerAuth() // Dejar preparado para cuando se integre el guard JWT de la Épica 1
  @ApiOperation({
    summary: 'Programar mantenimiento inhabilitando turnos futuros (RF-12)',
  })
  @ApiResponse({ status: 201, type: MantenimientoResponseDto })
  programarMantenimiento(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearMantenimientoDto,
  ) {
    return this.mantenimientoService.programarMantenimiento(id, dto);
  }
}
