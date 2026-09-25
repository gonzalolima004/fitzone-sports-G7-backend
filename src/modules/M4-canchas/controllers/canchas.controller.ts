import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CanchasService } from '../services/canchas.service';
import { CrearCanchaDto } from '../dto/crear-cancha.dto';
import { ActualizarCanchaDto } from '../dto/actualizar-cancha.dto';
import { DisponibilidadSlotResponseDto } from '../dto/disponibilidad-slot-response.dto';
import { ConsultaDisponibilidadQueryDto } from '../dto/consulta-disponibilidad-query.dto';

@ApiTags('Canchas Deportivas')
@Controller('canchas')
export class CanchasController {
  constructor(private readonly canchasService: CanchasService) {}

  @Post()
  @ApiOperation({ summary: 'Dar de alta una nueva cancha' })
  @ApiResponse({ status: 201, description: 'Cancha creada exitosamente.' })
  crear(@Body() crearCanchaDto: CrearCanchaDto) {
    return this.canchasService.crearCancha(crearCanchaDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todas las canchas activas con sus relaciones',
  })
  listar() {
    return this.canchasService.listarCanchas();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de una cancha específica' })
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.canchasService.obtenerCancha(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos parciales de una cancha' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() actualizarCanchaDto: ActualizarCanchaDto,
  ) {
    return this.canchasService.actualizarCancha(id, actualizarCanchaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Realizar un borrado lógico de la cancha' })
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.canchasService.eliminarCancha(id);
  }

  @Get(':id/disponibilidad')
  @ApiOperation({ summary: 'Consultar grilla horaria de disponibilidad' })
  @ApiResponse({ status: 200, type: [DisponibilidadSlotResponseDto] })
  obtenerDisponibilidad(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ConsultaDisponibilidadQueryDto,
  ) {
    return this.canchasService.obtenerDisponibilidad(id, query.fecha);
  }
}
