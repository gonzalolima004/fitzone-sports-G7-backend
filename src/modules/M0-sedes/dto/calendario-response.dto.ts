import { ApiProperty } from '@nestjs/swagger';

export class CalendarioResponseDto {
  @ApiProperty({ example: 1 })
  id_calendario!: number;

  @ApiProperty({ example: '2026-12-25', description: 'Formato YYYY-MM-DD' })
  fecha!: string;

  @ApiProperty({ example: 'Navidad', nullable: true, type: String })
  descripcion!: string | null;

  @ApiProperty({ example: true })
  es_feriado!: boolean;

  @ApiProperty({ example: false })
  es_dia_habil!: boolean;
}
