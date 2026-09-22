import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ValidarIngresoDto {
    @ApiProperty({
        description: 'Token efímero del código QR dinámico (TOTP)',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    @IsString()
    @IsNotEmpty()
    readonly qrToken: string;

    @ApiProperty({
        description: 'Identificador único de la sede donde se intenta el ingreso',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    readonly id_sede: number;
}