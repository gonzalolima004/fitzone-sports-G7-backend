import { Injectable } from '@nestjs/common';
import { Prisma, Usuario } from '@prisma/client';
import { PrismaService } from '../../../database/prisma-service/prisma.service';

@Injectable()
export class UsuariosRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly defaultIncludes = {
    sede: true,
    estado: true,
    roles: {
      include: {
        rol: true,
      },
    },
  };

  async create(data: Prisma.UsuarioCreateInput): Promise<Usuario> {
    return this.prisma.usuario.create({
      data,
      include: this.defaultIncludes,
    });
  }

  //NOTA: Podemos incluir búsquedas por dni, correo y/o nombre.
  // Es decir buscar por término.
  async findByDni(dni: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { dni },
      include: this.defaultIncludes,
    });
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { email },
      include: this.defaultIncludes,
    });
  }

  async findById(id: number): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { id_usuario: id },
      include: this.defaultIncludes,
    });
  }

  //NOTA Deberían ser todos uuid que es string
  async findAll(id_sede?: number): Promise<Usuario[]> {
    return this.prisma.usuario.findMany({
      where: id_sede ? { id_sede } : {},
      include: this.defaultIncludes,
    });
  }

  async update(id: number, data: Prisma.UsuarioUpdateInput): Promise<Usuario> {
    return this.prisma.usuario.update({
      where: { id_usuario: id },
      data,
      include: this.defaultIncludes,
    });
  }

  //NOTA debe corresponder con el id del estado desactivado.
  // Podría incluir que busque el estado como paso anterior por si lo cambian en el futuro.
  async softDelete(id: number): Promise<Usuario> {
    return this.prisma.usuario.update({
      where: { id_usuario: id },
      data: { id_usuario_estado: 3 },
      include: this.defaultIncludes,
    });
  }
}
