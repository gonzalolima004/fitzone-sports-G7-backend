import {
  Controller,
  //Post, Body, HttpCode, HttpStatus, UseGuards
} from '@nestjs/common';
import {
  ApiTags,
  //ApiOperation,
  //ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AccesosService } from '../services/accesos.service';
/*
import { ValidarIngresoDto } from '../dto/validar-ingreso.dto';
import { AccesoResponseDto } from '../dto/acceso-response.dto';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
*/
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
}
