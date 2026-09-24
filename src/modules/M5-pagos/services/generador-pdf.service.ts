import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { ComprobanteResponseDto } from '../dto/comprobante-response.dto';

@Injectable()
export class GeneradorPdfService {
  private readonly logger = new Logger(GeneradorPdfService.name);

  /**
   * Genera en memoria un comprobante de pago en formato PDF utilizando pdfkit.
   * Retorna una promesa con el Buffer del archivo generado (On-the-Fly / Stream binario).
   * Toda la información y textos visualizados se reciben dinámicamente en `datos`.
   */
  async generarComprobante(datos: ComprobanteResponseDto): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: `Comprobante ${datos.nro_ticket}`,
            Author: datos.emisor?.nombre || 'FitZone Sports Club',
            Subject: 'Comprobante de Pago Oficial',
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err: Error) => {
          this.logger.error('Error durante la generación del PDF:', err);
          reject(err);
        });

        this.renderizarDocumento(doc, datos);

        doc.end();
      } catch (error) {
        this.logger.error('Error al inicializar el documento PDF:', error);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private renderizarDocumento(
    doc: PDFKit.PDFDocument,
    datos: ComprobanteResponseDto,
  ): void {
    // Paleta de colores oficial solicitada
    const primaryColor = '#1B204A'; // Color primario (Navy / Azul institucional)
    const secondaryColor = '#E04B51'; // Color secundario (Coral / Acento deportivo)
    const neutralMuted = '#475569'; // Texto secundario
    const neutralLight = '#94A3B8'; // Texto tenue
    const borderColor = '#E2E8F0'; // Bordes
    const lightBg = '#F8FAFC'; // Fondo suave para contenedores

    // Extracción dinámica de siglas para el imagotipo (ej: "FitZone Sports Club" -> "FZ")
    const nombreEmisor = datos.emisor?.nombre || 'FitZone';
    const siglas =
      nombreEmisor
        .split(' ')
        .filter((w) => w.length > 0)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'FZ';

    // 1. ENCABEZADO Y LOGO VECTORIAL (Y: 40 a 95)
    // Badge vectorial con siglas dinámicas
    doc.roundedRect(40, 40, 45, 45, 8).fill(primaryColor);
    doc
      .fontSize(17)
      .font('Helvetica-Bold')
      .fillColor(secondaryColor)
      .text(siglas, 40, 53, { width: 45, align: 'center' });

    // Textos institucionales 100% dinámicos recibidos en datos.emisor
    doc
      .fontSize(15)
      .font('Helvetica-Bold')
      .fillColor(primaryColor)
      .text(nombreEmisor, 95, 43);

    if (datos.emisor?.subtitulo) {
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor(neutralMuted)
        .text(datos.emisor.subtitulo, 95, 62);
    }

    if (datos.emisor?.descripcion) {
      doc
        .fontSize(8)
        .fillColor(neutralLight)
        .text(datos.emisor.descripcion, 95, 75);
    }

    // Cuadro de metadatos de emisión (derecha)
    doc.roundedRect(365, 40, 190, 48, 6).fillAndStroke(lightBg, borderColor);

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor(neutralMuted)
      .text('TICKET N°:', 375, 48);

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(primaryColor)
      .text(datos.nro_ticket, 430, 47);

    const fechaStr = new Date(datos.fecha_emision).toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(neutralMuted)
      .text('FECHA:', 375, 66);

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(primaryColor)
      .text(fechaStr, 430, 66);

    // Línea divisoria superior
    doc
      .moveTo(40, 100)
      .lineTo(555, 100)
      .lineWidth(1)
      .strokeColor(borderColor)
      .stroke();

    // 2. BADGE DE ESTADO DEL PAGO (Y: 110)
    const esAprobado = (datos.estado || '').toLowerCase() === 'aprobado';
    const badgeBg = esAprobado ? '#DCFCE7' : '#FEF3C7';
    const badgeStroke = esAprobado ? '#86EFAC' : '#FCD34D';
    const badgeText = esAprobado ? '#15803D' : '#B45309';

    doc.roundedRect(40, 110, 130, 20, 4).fillAndStroke(badgeBg, badgeStroke);
    doc.circle(52, 120, 2.5).fill(badgeText);

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor(badgeText)
      .text(
        `ESTADO: ${datos.estado ? datos.estado.toUpperCase() : 'PENDIENTE'}`,
        60,
        116,
      );

    // 3. TARJETAS DE INFORMACIÓN: CLIENTE Y TRANSACCIÓN (Y: 140 a 210)
    // Tarjeta Cliente
    doc.roundedRect(40, 140, 250, 72, 6).fillAndStroke(lightBg, borderColor);
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor(neutralMuted)
      .text('DATOS DEL CLIENTE / SOCIO', 50, 148);

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(neutralMuted)
      .text('Titular:', 50, 163)
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .text(`${datos.cliente.nombre} ${datos.cliente.apellido}`, 90, 163);

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(neutralMuted)
      .text('DNI:', 50, 178)
      .fillColor(primaryColor)
      .text(datos.cliente.dni, 90, 178);

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(neutralMuted)
      .text('Email:', 50, 193)
      .fillColor(primaryColor)
      .text(datos.cliente.email, 90, 193);

    // Tarjeta Transacción
    doc.roundedRect(305, 140, 250, 72, 6).fillAndStroke(lightBg, borderColor);
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor(neutralMuted)
      .text('DETALLES DE LA TRANSACCIÓN', 315, 148);

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(neutralMuted)
      .text('Pasarela:', 315, 163)
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .text(datos.metodo_pago || 'Mercado Pago (Checkout Pro)', 380, 163);

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(neutralMuted)
      .text('ID Transacción:', 315, 178)
      .fillColor(primaryColor)
      .text(datos.token_transaccion || 'Sin token registrado', 380, 178);

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(neutralMuted)
      .text('Moneda:', 315, 193)
      .fillColor(primaryColor)
      .text(datos.moneda || 'ARS', 380, 193);

    // 4. TABLA DE ÍTEMS Y DESGLOSE (Y: 225 en adelante)
    const tableTop = 225;
    doc.roundedRect(40, tableTop, 515, 24, 4).fill(primaryColor);

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#FFFFFF')
      .text('CONCEPTO', 52, tableTop + 8)
      .text('DETALLE', 190, tableTop + 8)
      .text('CANT.', 360, tableTop + 8)
      .text('PRECIO UNIT.', 405, tableTop + 8)
      .text('SUBTOTAL', 485, tableTop + 8);

    let currentY = tableTop + 32;

    const items =
      datos.items && datos.items.length > 0
        ? datos.items
        : [
            {
              concepto: 'Servicio Deportivo FitZone',
              detalle: 'Abono general registrado',
              cantidad: 1,
              precio_unitario: datos.total,
              subtotal: datos.total,
            },
          ];

    for (const item of items) {
      doc
        .moveTo(40, currentY + 22)
        .lineTo(555, currentY + 22)
        .lineWidth(0.5)
        .strokeColor(borderColor)
        .stroke();

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text(item.concepto, 52, currentY, { width: 130, ellipsis: true });

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor(neutralMuted)
        .text(item.detalle || '-', 190, currentY, {
          width: 165,
          ellipsis: true,
        });

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor(primaryColor)
        .text(String(item.cantidad), 365, currentY);

      const precioUnitStr = `$${Number(item.precio_unitario).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor(primaryColor)
        .text(precioUnitStr, 405, currentY);

      const subtotalStr = `$${Number(item.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text(subtotalStr, 485, currentY);

      currentY += 30;
    }

    // 5. CAJA DE TOTAL FINANCIERO DINÁMICA (Y: currentY + 10)
    currentY += 10;
    const tieneDescuento =
      datos.descuento !== undefined && Number(datos.descuento) > 0;
    const boxHeight = tieneDescuento ? 68 : 52;

    doc
      .roundedRect(355, currentY, 200, boxHeight, 6)
      .fillAndStroke(lightBg, borderColor);

    const subtotalMostrar =
      datos.subtotal !== undefined ? datos.subtotal : datos.total;
    const subtotalFormateado = `$${Number(subtotalMostrar).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(neutralMuted)
      .text('SUBTOTAL:', 370, currentY + 12);

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(primaryColor)
      .text(subtotalFormateado, 370, currentY + 12, {
        width: 170,
        align: 'right',
      });

    let offsetY = currentY + 28;

    if (tieneDescuento) {
      const descuentoFormateado = `-$${Number(datos.descuento).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor(secondaryColor)
        .text('DESCUENTO:', 370, offsetY);

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(secondaryColor)
        .text(descuentoFormateado, 370, offsetY, {
          width: 170,
          align: 'right',
        });

      offsetY += 16;
    }

    doc
      .moveTo(370, offsetY)
      .lineTo(540, offsetY)
      .lineWidth(0.5)
      .strokeColor(borderColor)
      .stroke();

    const totalFormateado = `$${Number(datos.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    const monedaStr = datos.moneda || 'ARS';

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(primaryColor)
      .text('TOTAL ABONADO:', 370, offsetY + 6);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(secondaryColor)
      .text(`${totalFormateado} ${monedaStr}`, 370, offsetY + 6, {
        width: 170,
        align: 'right',
      });

    currentY += boxHeight;

    // 6. AVISO DE CONFORMIDAD NORMATIVA Y SEGURIDAD DINÁMICO
    if (datos.nota_seguridad) {
      const noticeY = currentY + 20;
      doc
        .roundedRect(40, noticeY, 515, 36, 4)
        .fillAndStroke('#F0FDF4', '#BBF7D0');

      doc.circle(52, noticeY + 13, 2.5).fill('#166534');

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#166534')
        .text('PAGO VERIFICADO Y PROCESADO DE FORMA SEGURA', 60, noticeY + 8);

      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor('#15803D')
        .text(datos.nota_seguridad, 60, noticeY + 20);
    }

    // 7. PIE DE PÁGINA DINÁMICO (Y: 740 a 770)
    doc
      .moveTo(40, 740)
      .lineTo(555, 740)
      .lineWidth(0.5)
      .strokeColor(borderColor)
      .stroke();

    if (datos.leyenda_pie) {
      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor(neutralLight)
        .text(datos.leyenda_pie, 40, 748, { align: 'center', width: 515 });
    }

    if (datos.emisor?.contacto) {
      doc
        .fontSize(7)
        .fillColor(neutralLight)
        .text(`Contacto / Soporte: ${datos.emisor.contacto}`, 40, 760, {
          align: 'center',
          width: 515,
        });
    }
  }
}
