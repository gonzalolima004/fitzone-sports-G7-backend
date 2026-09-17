import { ApiProperty } from '@nestjs/swagger';

export class CanchaResponseDto {
    @ApiProperty({ example: 1 })
    id_cancha: number;

    @ApiProperty({ example: 'Cancha 1 - Césped Sintético' })
    nombre: string;

    @ApiProperty({ example: 5000.50 })
    costo_base: number;

    @ApiProperty({ example: true })
    activo: boolean;

    @ApiProperty({ example: true })
    disponible: boolean;

    @ApiProperty({ example: 1 })
    id_cancha_tipo: number;

    @ApiProperty({ example: 3 })
    id_sede: number;
}