import { ApiProperty } from '@nestjs/swagger';

export class AccesoResponseDto {
    @ApiProperty({ description: 'ID del registro de acceso generado' })
    readonly id_registro_acceso: number;

    @ApiProperty({ description: 'Nombre completo del usuario' })
    readonly nombreUsuario: string;

    @ApiProperty({ description: 'Indica si el acceso fue autorizado o denegado' })
    readonly accesoPermitido: boolean;

    @ApiProperty({ description: 'Fecha y hora exacta del registro de ingreso' })
    readonly fechaIngreso: Date;

    constructor(
        id_registro_acceso: number,
        nombreUsuario: string,
        accesoPermitido: boolean,
        fechaIngreso: Date,
    ) {
        this.id_registro_acceso = id_registro_acceso;
        this.nombreUsuario = nombreUsuario;
        this.accesoPermitido = accesoPermitido;
        this.fechaIngreso = fechaIngreso;
    }
}