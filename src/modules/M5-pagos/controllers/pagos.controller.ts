import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  // UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PagosService } from '../services/pagos.service';
import { IniciarPagoDto } from '../dto/iniciar-pago.dto';
import { PreferenciaPagoResponseDto } from '../dto/preferencia-pago-response.dto';

//import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
//import { CurrentUser } from '../../../common/decorators/current-user.decorator';
//import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

@ApiTags('Pagos y Facturación')
@ApiBearerAuth()
// @UseGuards(SupabaseAuthGuard)
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post('iniciar-pago')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear preferencia de pago en Mercado Pago y registrar intención',
    description:
      'Genera una preferencia en Mercado Pago Checkout Pro para abonar una membresía o reserva de cancha y persiste la intención en estado Pendiente sin almacenar datos de tarjeta (RF-13, RNF-02).',
  })
  @ApiResponse({
    status: 201,
    description:
      'Preferencia creada exitosamente. Redirigir al usuario a initPoint o sandboxInitPoint.',
    type: PreferenciaPagoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos de pago inválidos o violación de concepto único (se debe asociar exactamente una reserva de cancha o una membresía).',
  })
  @ApiResponse({
    status: 401,
    description:
      'No autorizado. El token de autenticación está ausente o es inválido.',
  })
  @ApiResponse({
    status: 404,
    description:
      'La reserva de cancha o membresía especificada no existe en el sistema.',
  })
  @ApiResponse({
    status: 500,
    description:
      'Error interno al comunicarse con los servidores de Mercado Pago o registrar la transacción.',
  })
  async iniciarPago(
    @Body() dto: IniciarPagoDto,
    //@CurrentUser() user?: AuthenticatedUser,
  ): Promise<PreferenciaPagoResponseDto> {
    return this.pagosService.crearPreferenciaPago(dto, dto.email_pagador);
  }
}
