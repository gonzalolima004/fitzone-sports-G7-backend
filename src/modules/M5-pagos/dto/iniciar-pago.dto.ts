import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Validador personalizado para asegurar que el pago esté vinculado
 * exactamente a un único concepto: o reserva de cancha o plan/membresía.
 */
export function ConceptoUnico(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'conceptoUnico',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(_value: any, args: ValidationArguments) {
          const obj = args.object as IniciarPagoDto;
          const tieneCancha =
            obj.id_cancha_reserva !== undefined &&
            obj.id_cancha_reserva !== null;
          const tienePlan =
            obj.id_membresia_plan !== undefined &&
            obj.id_membresia_plan !== null;
          const tieneMembresia =
            obj.id_membresia !== undefined && obj.id_membresia !== null;
          const tieneConceptoMembresia = tienePlan || tieneMembresia;

          // Retorna true solo si exactamente uno de los dos está presente
          return (
            (tieneCancha && !tieneConceptoMembresia) ||
            (!tieneCancha && tieneConceptoMembresia)
          );
        },
        defaultMessage() {
          return 'Debe asociar el pago exactamente a una reserva de cancha (id_cancha_reserva) o a un plan/membresía (id_membresia_plan / id_membresia), pero no a ambos ni a ninguno.';
        },
      },
    });
  };
}

export class IniciarPagoDto {
  @ApiPropertyOptional({
    description:
      'Monto total a abonar en la pasarela de pagos (opcional si se especifica un plan)',
    example: 40000.0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(1)
  monto?: number;

  @ApiProperty({
    description: 'Título o descripción del concepto a pagar',
    example: 'Suscripción - Plan Mensual',
  })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiPropertyOptional({
    description:
      'ID de la reserva de cancha asociada (requerido si no se especifica plan o membresía)',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @ConceptoUnico()
  id_cancha_reserva?: number;

  @ApiPropertyOptional({
    description: 'ID del plan de membresía a contratar o renovar (recomendado)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  id_membresia_plan?: number;

  @ApiPropertyOptional({
    description:
      'ID de la membresía asociada (uso para renovación directa de membresía existente)',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  id_membresia?: number;

  @ApiPropertyOptional({
    description:
      'Indica si el socio habilita la renovación automática para su membresía',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  renovacion_automatica?: boolean;

  @ApiPropertyOptional({
    description:
      'Correo electrónico del pagador para precarga en Mercado Pago Checkout Pro',
    example: 'socio@fitzone.com',
  })
  @IsOptional()
  @IsEmail()
  email_pagador?: string;
}
