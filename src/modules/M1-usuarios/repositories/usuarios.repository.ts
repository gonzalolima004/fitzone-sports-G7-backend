import { Injectable } from '@nestjs/common';
import { Prisma, Rol, Usuario } from '@prisma/client';
import { PrismaService } from '../../../database/prisma-service/prisma.service';

export type UsuarioConRoles = Prisma.UsuarioGetPayload<{
  include: typeof UsuariosRepository.prototype.defaultIncludes;
}>;

export type UsuarioAuthPerfil = Prisma.UsuarioGetPayload<{
  select: typeof UsuariosRepository.prototype.authProfileSelect;
}>;

@Injectable()
export class UsuariosRepository {
  constructor(private readonly prisma: PrismaService) {}

  public readonly defaultIncludes = {
    sede: {
      include: {
        ciudad: true,
      },
    },
    usuario_estado: true,
    membresia: {
      include: {
        membresia_estado: true,
      },
    },
    usuario_rol: {
      include: {
        rol: true,
      },
    },
  } satisfies Prisma.UsuarioInclude;

  public readonly authProfileSelect = {
    id_usuario: true,
    dni: true,
    email: true,
    password: true,
    nombre: true,
    apellido: true,
    telefono: true,
    foto_url: true,
    id_sede: true,
    id_usuario_estado: true,
    sede: {
      select: {
        id_sede: true,
        nombre: true,
        id_ciudad: true,
      },
    },
    usuario_rol: {
      select: {
        rol: {
          select: {
            id_rol: true,
            nombre: true,
          },
        },
      },
    },
  } satisfies Prisma.UsuarioSelect;

  async create(data: Prisma.UsuarioCreateInput): Promise<UsuarioConRoles> {
    return this.prisma.usuario.create({
      data,
      include: this.defaultIncludes,
    });
  }

  async findExistingByDniOrEmail(
    dni: string,
    email: string,
  ): Promise<{ id_usuario: number; dni: string; email: string } | null> {
    return this.prisma.usuario.findFirst({
      where: {
        OR: [{ dni }, { email }],
      },
      select: {
        id_usuario: true,
        dni: true,
        email: true,
      },
    });
  }

  async findRolByNombre(nombre: string): Promise<Rol | null> {
    return this.prisma.rol.findFirst({
      where: {
        nombre: {
          equals: nombre,
          mode: 'insensitive',
        },
      },
    });
  }

  async findAuthProfileByEmail(
    email: string,
  ): Promise<UsuarioAuthPerfil | null> {
    return this.prisma.usuario.findUnique({
      where: { email },
      select: this.authProfileSelect,
    });
  }

  async findByDni(dni: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { dni },
      include: this.defaultIncludes,
    });
  }

  async findByEmail(email: string): Promise<UsuarioConRoles | null> {
    return this.prisma.usuario.findUnique({
      where: { email },
      include: this.defaultIncludes,
    });
  }

  async findById(id: number): Promise<UsuarioConRoles | null> {
    return this.prisma.usuario.findUnique({
      where: { id_usuario: id },
      include: this.defaultIncludes,
    });
  }

  async findAll(id_sede?: number): Promise<UsuarioConRoles[]> {
    return this.prisma.usuario.findMany({
      where: id_sede ? { id_sede } : {},
      include: {
        usuario_rol: {
          include: { rol: true },
        },
        membresia: { include: { membresia_estado: true } },
        usuario_estado: true,
        sede: {
          include: {
            ciudad: true,
          },
        },
      },
    });
  }

  async update(
    id: number,
    data: Prisma.UsuarioUpdateInput,
  ): Promise<UsuarioConRoles> {
    return this.prisma.usuario.update({
      where: { id_usuario: id },
      data,
      include: this.defaultIncludes,
    });
  }

  //NOTA debe corresponder con el id del estado desactivado.
  // Podría incluir que busque el estado como paso anterior por si lo cambian en el futuro.
  async softDelete(
    id: number,
    ID_ESTADO_DESACTIVADO: number,
  ): Promise<UsuarioConRoles> {
    return this.prisma.usuario.update({
      where: { id_usuario: id },
      data: { id_usuario_estado: ID_ESTADO_DESACTIVADO },
      include: this.defaultIncludes,
    });
  }

  async findAllPaginated(
    where: Prisma.UsuarioWhereInput,
    skip: number,
    take: number,
  ) {
    return this.prisma.usuario.findMany({
      where,
      skip,
      take,
      include: {
        sede: true,
        usuario_estado: true,
        usuario_rol: { include: { rol: true } },
      },
      orderBy: { id_usuario: 'desc' },
    });
  }

  async count(where: Prisma.UsuarioWhereInput): Promise<number> {
    return this.prisma.usuario.count({ where });
  }

  async updateStatus(id: number, id_usuario_estado: number): Promise<Usuario> {
    return this.prisma.usuario.update({
      where: { id_usuario: id },
      data: {
        usuario_estado: {
          connect: { id_usuario_estado },
        },
      },
    });
  }
}
