import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ListaEsperaService } from '../services/lista-espera.service';
import { InscribirListaEsperaDto } from '../dto/inscribir-lista-espera.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

@ApiTags('Lista de Espera')
@Controller('lista-espera')
export class ListaEsperaController {
  constructor(private readonly listaEsperaService: ListaEsperaService) {}

  @Post('inscribir')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inscribirse en lista de espera de una clase agotada' })
  @ApiResponse({ status: 201, description: 'Inscripto correctamente a la lista de espera' })
  @ApiResponse({ status: 400, description: 'La clase aún tiene cupos o ya estás inscripto' })
  @ApiResponse({ status: 404, description: 'Clase no encontrada' })
  async inscribir(
    @Body() data: InscribirListaEsperaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.listaEsperaService.inscribir(data, user.id_usuario);
  }
}
