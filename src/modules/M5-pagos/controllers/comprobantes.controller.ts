import { Controller, Get, Param, ParseIntPipe, Res } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiProduces,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { PagosService } from '../services/pagos.service';

@ApiTags('Pagos y Facturación')
@Controller('pagos')
export class ComprobantesController {
  constructor(private readonly pagosService: PagosService) {}

  @Get(':id/comprobante')
  @ApiOperation({
    summary:
      'Obtener comprobante/factura en formato PDF para visualización e impresión directa',
    description:
      'Genera on-the-fly en memoria el comprobante oficial en formato PDF con stream binario inline y asegura la persistencia de comprobante_url en la base de datos (RF-14, RNF-02).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Identificador único del pago a emitir comprobante',
    example: 1,
  })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description:
      'Archivo binario PDF retornado con cabeceras Content-Type: application/pdf y Content-Disposition: inline para visualización e impresión inmediata.',
  })
  @ApiResponse({
    status: 400,
    description: 'Identificador de pago inválido (debe ser numérico entero).',
  })
  @ApiResponse({
    status: 404,
    description: 'El pago especificado no existe en el sistema.',
  })
  async descargarComprobante(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    const pdfBuffer = await this.pagosService.generarComprobantePdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="comprobante-pago-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
