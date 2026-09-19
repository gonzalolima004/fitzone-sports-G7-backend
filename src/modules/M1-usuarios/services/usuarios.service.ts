import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UsuariosRepository } from '../repositories/usuarios.repository';
import { Prisma, Usuario } from '@prisma/client';
import { ActualizarUsuarioDto } from '../dto/actualizar-usuario.dto';
import { CreateUsuarioDto } from '../dto/crear-usuario.dto';
import * as bcrypt from 'bcryptjs';
import { plainToInstance } from 'class-transformer';
import { UsuarioResponseDto } from '../dto/usuario-response.dto';

@Injectable()
export class UsuariosService {
  private readonly SALT_ROUNDS = 10;

  constructor(private readonly repository: UsuariosRepository) {}

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

    const passwordHasheada = await bcrypt.hash(
      dto.contrasenia,
      this.SALT_ROUNDS,
    );

    //NOTA: Debe coincidir con el correcto en la base.
    const ID_ESTADO_ACTIVO = 1;

    const usuarioData: Prisma.UsuarioCreateInput = {
      dni: dto.dni,
      email: dto.email,
      password: passwordHasheada,
      nombre: dto.nombre,
      apellido: dto.apellido,
      telefono: dto.telefono,
      foto_url: dto.foto_url,
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

    const usuario = this.repository.create(usuarioData);
    return plainToInstance(UsuarioResponseDto, usuario);
  }

  async findAll(id_sede?: number): Promise<UsuarioResponseDto[]> {
    const usuarios = await this.repository.findAll(id_sede);
    return plainToInstance(UsuarioResponseDto, usuarios);
  }
  async findById(id: number): Promise<UsuarioResponseDto> {
    const user = await this.repository.findById(id);
    if (!user)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    return plainToInstance(UsuarioResponseDto, user);
  }

  async update(
    id: number,
    dto: ActualizarUsuarioDto,
  ): Promise<UsuarioResponseDto> {
    await this.findById(id); // Verifica que exista

    const { contrasenia, ...restoDatos } = dto;

    const datosAActualizar: Prisma.UsuarioUpdateInput = restoDatos;

    if (contrasenia) {
      datosAActualizar.password = await bcrypt.hash(
        contrasenia,
        this.SALT_ROUNDS,
      );
    }

    //NOTA: Queda pendiente la modificación de roles por complejidad
    // y porque falta actualizar el esquema de la base de datos.

    const usuario = await this.repository.update(id, datosAActualizar);
    return plainToInstance(UsuarioResponseDto, usuario);
  }

  async remove(id: number): Promise<Usuario> {
    await this.findById(id); // Verifica que exista
    return this.repository.softDelete(id);
  }
}
