import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma-service/prisma.service';

export type IngresoAgrupadoPorSede = {
  id_sede: number;
  nombre_sede: string;
  total_ingresos: Prisma.Decimal;
};

@Injectable()
export class ReportesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async obtenerIngresosPorSede(
    fechaDesde: Date,
    fechaHastaExclusiva: Date,
    estadoPagoValido: string,
    idSede?: number,
    concepto?: 'cancha' | 'membresia',
  ): Promise<IngresoAgrupadoPorSede[]> {
    const filtroSede = idSede
      ? Prisma.sql`AND ingresos.id_sede = ${idSede}`
      : Prisma.empty;

    const filtroConcepto = concepto
      ? Prisma.sql`AND ingresos.concepto = ${concepto}`
      : Prisma.empty;

    return this.prismaService.$queryRaw<IngresoAgrupadoPorSede[]>(
      Prisma.sql`
        WITH pagos_validos AS (
          SELECT p.*
          FROM pago p
          INNER JOIN pago_estado pe
            ON pe.id_pago_estado = p.id_pago_estado
          WHERE p.fecha_pago >= ${fechaDesde}
            AND p.fecha_pago < ${fechaHastaExclusiva}
            AND LOWER(pe.descripcion) = LOWER(${estadoPagoValido})
        ),

        ingresos AS (
          SELECT
            s.id_sede,
            s.nombre AS nombre_sede,
            p.monto,
            'membresia' AS concepto
          FROM pagos_validos p
          INNER JOIN membresia m
            ON m.id_membresia = p.id_membresia
          INNER JOIN usuario u
            ON u.id_usuario = m.id_usuario
          INNER JOIN sede s
            ON s.id_sede = u.id_sede
          WHERE p.id_membresia IS NOT NULL

          UNION ALL

          SELECT
            s.id_sede,
            s.nombre AS nombre_sede,
            p.monto,
            'cancha' AS concepto
          FROM pagos_validos p
          INNER JOIN cancha_reserva cr
            ON cr.id_cancha_reserva = p.id_cancha_reserva
          INNER JOIN cancha c
            ON c.id_cancha = cr.id_cancha
          INNER JOIN sede s
            ON s.id_sede = c.id_sede
          WHERE p.id_cancha_reserva IS NOT NULL
        )

        SELECT
          ingresos.id_sede,
          ingresos.nombre_sede,
          SUM(ingresos.monto) AS total_ingresos
        FROM ingresos
        WHERE 1 = 1
          ${filtroSede}
          ${filtroConcepto}
        GROUP BY ingresos.id_sede, ingresos.nombre_sede
        ORDER BY ingresos.id_sede
      `,
    );
  }
}
