import {
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
 * exactamente a un único concepto: o reserva de cancha o membresía.
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
          const tieneMembresia =
            obj.id_membresia !== undefined && obj.id_membresia !== null;

          // Retorna true solo si exactamente uno de los dos está presente
          return (
            (tieneCancha && !tieneMembresia) || (!tieneCancha && tieneMembresia)
          );
        },
        defaultMessage() {
          return 'Debe asociar el pago exactamente a una reserva de cancha (id_cancha_reserva) o a una membresía (id_membresia), pero no a ambas ni a ninguna.';
        },
      },
    });
  };
}

export class IniciarPagoDto {
  @ApiProperty({
    description: 'Monto total a abonar en la pasarela de pagos',
    example: 15000.0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(1)
  monto: number;

  @ApiProperty({
    description: 'Título o descripción del concepto a pagar',
    example: 'Reserva Cancha Pádel 1 - 21/09 18:00hs',
  })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiPropertyOptional({
    description:
      'ID de la reserva de cancha asociada (requerido si no se especifica id_membresia)',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @ConceptoUnico()
  id_cancha_reserva?: number;

  @ApiPropertyOptional({
    description:
      'ID de la membresía asociada (requerido si no se especifica id_cancha_reserva)',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  id_membresia?: number;

  @ApiPropertyOptional({
    description:
      'Correo electrónico del pagador para precarga en Mercado Pago Checkout Pro',
    example: 'socio@fitzone.com',
  })
  @IsOptional()
  @IsEmail()
  email_pagador?: string;
}
