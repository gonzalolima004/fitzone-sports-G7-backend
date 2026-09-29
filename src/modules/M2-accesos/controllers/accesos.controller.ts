import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  ParseIntPipe,
  //UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AccesosService } from '../services/accesos.service';
/*
import { ValidarIngresoDto } from '../dto/validar-ingreso.dto';
import { AccesoResponseDto } from '../dto/acceso-response.dto';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
*/
import { RegistrarEgresoDto } from '../dto/registrar-egreso.dto';
import { EgresoResponseDto } from '../dto/egreso-response.dto';
import { AforoStatusResponseDto } from '../dto/aforo-status-response.dto';
@ApiTags('Control de Acceso')
@ApiBearerAuth()
//@UseGuards(SupabaseAuthGuard)
@Controller('accesos')
export class AccesosController {
  constructor(private readonly accesosService: AccesosService) {}

  /*@Post('validar-ingreso')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Validar token QR e ingresar a la sede',
    description:
      'Valida la firma y vigencia del token QR, confirma que la membresía del socio esté activa y registra el ingreso físico en la sede.',
  })
  @ApiResponse({
    status: 201,
    description: 'Acceso autorizado y registrado con éxito.',
    type: AccesoResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token QR inválido o expirado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado debido a membresía vencida o estado en mora.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto por anti-doble ingreso (RN-01): El usuario registra un ingreso activo sin egreso.',
  })
  
  async validarIngreso(@Body() validarIngresoDto: ValidarIngresoDto): Promise<AccesoResponseDto> {
    return this.accesosService.validarYRegistrarIngreso(validarIngresoDto);
  }
    */

  /**
   * Endpoint HTTP de Egreso
   * Publica la ruta para registrar la salida física del establecimiento,
   * cerrar la sesión de entrenamiento y liberar aforo de forma controlada.
   */
  @Post('registrar-egreso')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar salida física de socio y calcular permanencia',
    description:
      'Busca la entrada activa del usuario en la sede, estampa la fecha/hora de salida y retorna la confirmación del egreso.',
  })
  @ApiResponse({
    status: 200,
    description: 'Egreso registrado correctamente y aforo liberado.',
    type: EgresoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'La sede del egreso no coincide con la sede donde ingresó el socio.',
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontró un ingreso activo previo para el usuario.',
  })
  async registrarEgreso(
    @Body() registrarEgresoDto: RegistrarEgresoDto,
  ): Promise<EgresoResponseDto> {
    return this.accesosService.registrarEgreso(registrarEgresoDto);
  }
  @Get('aforo/:id_sede')
  @ApiOperation({ summary: 'Obtener estado del aforo actual de una sede' })
  @ApiParam({ name: 'id_sede', type: String, description: 'ID de la sede' })
  @ApiResponse({
    status: 200,
    type: AforoStatusResponseDto,
    description: 'Estado del aforo obtenido exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Sede no encontrada' })
  async obtenerAforo(
    @Param('id_sede', ParseIntPipe) idSede: number,
  ): Promise<AforoStatusResponseDto> {
    return this.accesosService.obtenerEstadoAforo(idSede);
  }
}
