import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  UsuariosRepository,
  UsuarioConRoles,
} from '../repositories/usuarios.repository';
import { Prisma, Usuario } from '@prisma/client';
import { ActualizarUsuarioDto } from '../dto/actualizar-usuario.dto';
import { CreateUsuarioDto } from '../dto/crear-usuario.dto';
import * as bcrypt from 'bcryptjs';
import { plainToInstance } from 'class-transformer';
import { UsuarioResponseDto } from '../dto/usuario-response.dto';

@Injectable()
export class UsuariosService {
  private readonly SALT_ROUNDS = 10;
  private readonly SUPABASE_PLACEHOLDER = 'SUPABASE_MANAGED_AUTH';

  constructor(private readonly repository: UsuariosRepository) {}

  /**
   * Abstrae la responsabilidad de gestionar si es auth delegada (Supabase)
   * o si se requiere hashear una contraseña local.
   */
  private async generatePasswordHash(rawPassword?: string): Promise<string> {
    if (rawPassword) {
      return await bcrypt.hash(rawPassword, this.SALT_ROUNDS);
    }
    return this.SUPABASE_PLACEHOLDER;
  }

  async create(dto: CreateUsuarioDto): Promise<UsuarioResponseDto> {
    const existeDni = await this.repository.findByDni(dto.dni);
    if (existeDni) {
      throw new ConflictException(
        `El DNI '${dto.dni}' ya se encuentra registrado.`,
      );
    }

    const existeEmail = await this.repository.findByEmail(dto.email);
    if (existeEmail) {
      throw new ConflictException(
        `El correo electronico '${dto.email}' ya se encuentra registrado.`,
      );
    }

    const passwordHasheada = await this.generatePasswordHash(dto.contrasenia);
    const ID_ESTADO_ACTIVO = 1;

    const usuarioData: Prisma.UsuarioCreateInput = {
      dni: dto.dni,
      email: dto.email,
      password: passwordHasheada,
      nombre: dto.nombre,
      apellido: dto.apellido,
      telefono: dto.telefono,
      foto_url: dto.foto_url || null,
      sede: { connect: { id_sede: Number(dto.id_sede) } },
      qr_url: null,
      ...(dto.roles && dto.roles.length > 0
        ? {
            usuario_rol: {
              create: dto.roles.map((id_rol) => ({
                rol: { connect: { id_rol } },
              })),
            },
          }
        : {}),
      usuario_estado: { connect: { id_usuario_estado: ID_ESTADO_ACTIVO } },
    };

    const usuario = await this.repository.create(usuarioData);
    return plainToInstance(UsuarioResponseDto, usuario);
  }

  async findAll(id_sede?: number): Promise<UsuarioResponseDto[]> {
    const usuarios = await this.repository.findAll(id_sede);
    return plainToInstance(UsuarioResponseDto, usuarios);
  }

  async findById(id: number): Promise<UsuarioResponseDto> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return plainToInstance(UsuarioResponseDto, user);
  }

  async findByEmail(email: string): Promise<UsuarioResponseDto> {
    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Usuario con email no encontrado');
    }
    return plainToInstance(UsuarioResponseDto, user);
  }

  async findEntityByEmail(email: string): Promise<UsuarioConRoles | null> {
    return await this.repository.findByEmail(email);
  }

  async update(
    id: number,
    dto: ActualizarUsuarioDto,
  ): Promise<UsuarioResponseDto> {
    await this.findById(id); // Verifica que exista

    const { contrasenia, id_sede, id_usuario_estado, roles, ...restoDatos } =
      dto;

    const datosAActualizar: Prisma.UsuarioUpdateInput = {
      ...restoDatos,
    };

    if (contrasenia) {
      datosAActualizar.password = await this.generatePasswordHash(contrasenia);
    }

    // Transformar el ID plano a un objeto de conexión de Prisma
    if (id_sede !== undefined) {
      datosAActualizar.sede = {
        connect: { id_sede: Number(id_sede) },
      };
    }

    // Conexión relacional para el estado del usuario
    if (id_usuario_estado !== undefined) {
      datosAActualizar.usuario_estado = {
        connect: { id_usuario_estado: Number(id_usuario_estado) },
      };
    }

    // Actualización de roles si se envían
    if (roles && roles.length > 0) {
      datosAActualizar.usuario_rol = {
        deleteMany: {},
        create: roles.map((id_rol) => ({
          rol: { connect: { id_rol } },
        })),
      };
    }

    const usuario = await this.repository.update(id, datosAActualizar);
    return plainToInstance(UsuarioResponseDto, usuario);
  }

  async remove(id: number): Promise<Usuario> {
    await this.findById(id); // Verifica que exista
    return this.repository.softDelete(id);
  }
}
