import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
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
  private readonly ROL_EXTERNO_NOMBRE = 'externo';

  constructor(private readonly repository: UsuariosRepository) {}

  private async generatePasswordHash(rawPassword?: string): Promise<string> {
    if (rawPassword) {
      return await bcrypt.hash(rawPassword, this.SALT_ROUNDS);
    }
    return this.SUPABASE_PLACEHOLDER;
  }

  async create(dto: CreateUsuarioDto): Promise<UsuarioResponseDto> {
    const usuarioExistente = await this.repository.findExistingByDniOrEmail(
      dto.dni,
      dto.email,
    );

    if (usuarioExistente) {
      if (usuarioExistente.dni === dto.dni) {
        throw new ConflictException(
          `El DNI '${dto.dni}' ya se encuentra registrado.`,
        );
      }
      throw new ConflictException(
        `El correo electronico '${dto.email}' ya se encuentra registrado.`,
      );
    }

    const rolExterno = await this.repository.findRolByNombre(
      this.ROL_EXTERNO_NOMBRE,
    );

    if (!rolExterno) {
      throw new InternalServerErrorException(
        'El rol por defecto "externo" no se encuentra configurado en la base de datos.',
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
      usuario_rol: {
        create: [
          {
            rol: { connect: { id_rol: rolExterno.id_rol } },
          },
        ],
      },
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
    await this.findById(id);

    const datosAActualizar: Prisma.UsuarioUpdateInput = {};

    if (dto.nombre !== undefined) {
      datosAActualizar.nombre = dto.nombre;
    }
    if (dto.apellido !== undefined) {
      datosAActualizar.apellido = dto.apellido;
    }
    if (dto.telefono !== undefined) {
      datosAActualizar.telefono = dto.telefono;
    }
    if (dto.foto_url !== undefined) {
      datosAActualizar.foto_url = dto.foto_url;
    }
    if (dto.id_sede !== undefined) {
      datosAActualizar.sede = {
        connect: { id_sede: Number(dto.id_sede) },
      };
    }
    if (dto.id_usuario_estado !== undefined) {
      datosAActualizar.usuario_estado = {
        connect: { id_usuario_estado: Number(dto.id_usuario_estado) },
      };
    }

    const usuario = await this.repository.update(id, datosAActualizar);
    return plainToInstance(UsuarioResponseDto, usuario);
  }

  async updateFotoUrl(
    id: number,
    fotoUrl: string,
  ): Promise<UsuarioResponseDto> {
    await this.findById(id);
    const usuario = await this.repository.update(id, { foto_url: fotoUrl });
    return plainToInstance(UsuarioResponseDto, usuario);
  }

  async remove(id: number): Promise<Usuario> {
    await this.findById(id);
    return this.repository.softDelete(id);
  }
}
