import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
export class QrDinamicoResponseDto {
  @ApiProperty({
    description: 'Token efímero/TOTP firmado correspondiente al usuario',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OCIsImV4cCI6MTY3MjU4OTYwMH0',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Tiempo de validez restante del token en segundos',
    example: 60,
    default: 60,
  })
  @IsNumber()
  @IsNotEmpty()
  expiraEnSegundos: number;

  @ApiProperty({
    description: 'Fecha y hora exactas en que se generó el token',
    example: '2026-09-17T15:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  fechaGeneracion: Date;

  constructor(partial: Partial<QrDinamicoResponseDto>) {
    Object.assign(this, partial);
  }
}
