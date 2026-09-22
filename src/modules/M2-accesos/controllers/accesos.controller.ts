import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AccesosService } from '../services/accesos.service';
import { ValidarIngresoDto } from '../dto/validar-ingreso.dto';
import { AccesoResponseDto } from '../dto/acceso-response.dto';

@ApiTags('Control de Acceso')
@Controller('accesos')
export class AccesosController {
    constructor(private readonly accesosService: AccesosService) { }

    @Post('validar-ingreso')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Validar token QR y autorizar ingreso en molinete/recepción',
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
        description: 'Acceso denegado: Membresía vencida o suspendida.',
    })
    @ApiResponse({
        status: 409,
        description: 'Conflicto: El usuario ya posee un ingreso activo sin egreso (RN-01).',
    })
    async validarIngreso(
        @Body() validarIngresoDto: ValidarIngresoDto,
    ): Promise<AccesoResponseDto> {
        const dto: AccesoResponseDto = {
            id_registro_acceso: 1,
            nombreUsuario: 'Usuario Temporal',
            accesoPermitido: true,
            fechaIngreso: new Date(),
        };
        return dto;
        //return this.accesosService.validarYRegistrarIngreso(validarIngresoDto);
    }
}