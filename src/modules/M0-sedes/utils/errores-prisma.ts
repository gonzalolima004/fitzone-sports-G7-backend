import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

interface MensajesDeError {
  /** P2025: el registro que se quiere modificar o eliminar no existe. */
  noEncontrado?: string;
  /** P2002: el dato choca con una restricción única. */
  duplicado?: string;
  /** P2003: una clave foránea apunta a un registro que no existe o lo bloquea. */
  referencia?: { mensaje: string; tipo: 'no-encontrado' | 'conflicto' };
}

/**
 * Traduce los errores de restricciones de la base a respuestas HTTP.
 *
 * Se usa en lugar de consultar antes de escribir: cada consulta a Supabase
 * tarda bastante, así que la existencia y la unicidad las valida la propia
 * base en la misma operación de escritura.
 */
export function traducirErrorPrisma(
  error: unknown,
  mensajes: MensajesDeError,
): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025' && mensajes.noEncontrado) {
      throw new NotFoundException(mensajes.noEncontrado);
    }
    if (error.code === 'P2002' && mensajes.duplicado) {
      throw new ConflictException(mensajes.duplicado);
    }
    if (esViolacionDeReferencia(error) && mensajes.referencia) {
      throw mensajes.referencia.tipo === 'conflicto'
        ? new ConflictException(mensajes.referencia.mensaje)
        : new NotFoundException(mensajes.referencia.mensaje);
    }
  }
  throw error;
}

/**
 * P2003 cubre las altas que apuntan a un registro inexistente. Al borrar un
 * registro referenciado por una clave con ON DELETE RESTRICT, PostgreSQL
 * devuelve el código 23001 y Prisma lo informa como error genérico (P2039).
 */
function esViolacionDeReferencia(
  error: Prisma.PrismaClientKnownRequestError,
): boolean {
  if (error.code === 'P2003') {
    return true;
  }
  const errorDeBase = error.meta?.driverAdapterError as
    { cause?: { originalCode?: string; code?: string } } | undefined;
  const codigoPostgres =
    errorDeBase?.cause?.originalCode ?? errorDeBase?.cause?.code;
  return error.code === 'P2039' && codigoPostgres === '23001';
}
