import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';

@Injectable()
export class AccesosRepository {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Registra un nuevo ingreso físico a una sede.
     */
    async crearIngreso(id_usuario: number, id_sede: number) {
        return this.prisma.registroAcceso.create({
            data: {
                id_usuario,
                id_sede,
                fecha_ingreso: new Date(),
            },
            include: {
                usuario: true,
            },
        });
    }

    /**
     * Busca si el usuario posee un ingreso activo en alguna sede (fecha_egreso es NULL).
     */
    async buscarAccesoActivoPorUsuario(id_usuario: number) {
        return this.prisma.registroAcceso.findFirst({
            where: {
                id_usuario,
                fecha_egreso: null,
            },
        });
    }

    /**
     * Registra el cierre de egreso/salida del usuario en la sede.
     */
    async registrarEgreso(id_registro_acceso: number) {
        return this.prisma.registroAcceso.update({
            where: { id_registro_acceso },
            data: {
                fecha_egreso: new Date(),
            },
        });
    }
}