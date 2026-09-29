import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PagosService } from '../services/pagos.service';
import { IniciarPagoDto } from '../dto/iniciar-pago.dto';
import { PreferenciaPagoResponseDto } from '../dto/preferencia-pago-response.dto';
import { PagoDetalleResponseDto } from '../dto/pago-detalle-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUserId } from '../../../common/decorators/current-user.decorator';

@ApiTags('Pagos y Facturación')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
  ): Promise<PreferenciaPagoResponseDto> {
    return this.pagosService.crearPreferenciaPago(dto, dto.email_pagador);
  }

  @Get('mis-pagos')
  @ApiOperation({
    summary: 'Consultar historial de pagos del usuario autenticado',
    description:
      'Obtiene el listado cronológico de todos los pagos realizados por el usuario en sesión (canchas y membresías).',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de pagos obtenido exitosamente.',
    type: [PagoDetalleResponseDto],
  })
  @ApiResponse({
    status: 401,
    description:
      'No autorizado. El token de autenticación está ausente o es inválido.',
  })
  async obtenerMisPagos(
    @CurrentUserId() userId: number,
  ): Promise<PagoDetalleResponseDto[]> {
    return this.pagosService.obtenerHistorialUsuario(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar detalle y trazabilidad de un pago por ID',
    description:
      'Retorna el detalle completo de un pago específico, su estado en la pasarela de pagos y acceso al comprobante PDF.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Identificador único numérico del pago a consultar',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle del pago obtenido exitosamente.',
    type: PagoDetalleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Identificador de pago inválido (debe ser numérico entero).',
  })
  @ApiResponse({
    status: 401,
    description:
      'No autorizado. El token de autenticación está ausente o es inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado a este comprobante o pago.',
  })
  @ApiResponse({
    status: 404,
    description: 'El pago especificado no existe en el sistema.',
  })
  async obtenerDetalle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
  ): Promise<PagoDetalleResponseDto> {
    return this.pagosService.obtenerDetallePago(id, userId);
  }
}
