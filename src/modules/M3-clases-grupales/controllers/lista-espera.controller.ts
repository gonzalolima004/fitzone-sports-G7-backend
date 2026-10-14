import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ListaEsperaService } from '../services/lista-espera.service';
import { InscribirListaEsperaDto } from '../dto/inscribir-lista-espera.dto';
import { MiInscripcionListaEsperaResponseDto } from '../dto/mis-inscripciones-response.dto';
import { CurrentUserId } from '../../../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';

@ApiTags('Lista de Espera')
@ApiBearerAuth()
@Controller('lista-espera')
export class ListaEsperaController {
  constructor(private readonly listaEsperaService: ListaEsperaService) {}

  @Get('mis-inscripciones')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary:
      'Consultar las inscripciones activas en lista de espera del usuario autenticado',
    description: 'Permite filtrar opcionalmente por fecha (formato YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'fecha',
    required: false,
    description: 'Filtrar por fecha en formato YYYY-MM-DD',
    example: '2026-10-12',
  })
  @ApiResponse({
    status: 200,
    description:
      'Lista de inscripciones activas en lista de espera del usuario.',
    type: [MiInscripcionListaEsperaResponseDto],
  })
  async obtenerMisInscripciones(
    @CurrentUserId() id_usuario: number,
    @Query('fecha') fecha?: string,
  ) {
    return await this.listaEsperaService.obtenerMisInscripciones(
      id_usuario,
      fecha,
    );
  }

  @Post('inscribir')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary: 'Inscribirse en lista de espera de una clase agotada',
  })
  @ApiResponse({
    status: 201,
    description: 'Inscripto correctamente a la lista de espera',
  })
  @ApiResponse({
    status: 400,
    description: 'La clase aún tiene cupos o ya estás inscripto',
  })
  @ApiResponse({ status: 404, description: 'Clase no encontrada' })
  async inscribir(
    @Body() data: InscribirListaEsperaDto,
    @CurrentUserId() id_usuario: number,
  ) {
    return await this.listaEsperaService.inscribir(data, id_usuario);
  }
}
