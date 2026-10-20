import { ApiProperty } from '@nestjs/swagger';

export class EliminarClaseResponseDto {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la baja lógica',
    example: 'Clase dada de baja exitosamente.',
  })
  mensaje: string;

  @ApiProperty({
    description: 'Identificador único de la clase dada de baja',
    example: 10,
  })
  id_clase: number;

  @ApiProperty({
    description: 'Estado activo de la clase tras la baja lógica',
    example: false,
  })
  activo: boolean;

  @ApiProperty({
    description:
      'Cantidad de reservas futuras confirmadas canceladas preventivamente',
    example: 2,
  })
  reservas_canceladas: number;
}
