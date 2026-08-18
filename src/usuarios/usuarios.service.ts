/**
 * ARCHIVO: usuarios.service.ts
 * PROPÓSITO: Es el "Cerebro" (Lógica de Negocio).
 * Aquí se escriben las reglas de negocio y se interactúa con la Base de Datos usando Prisma.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuariosService {
  // Inyectamos PrismaService para poder hablar con la base de datos
  constructor(private readonly prisma: PrismaService) {}

  // Las funciones ahora son 'async' porque la base de datos tarda milisegundos en responder
  async create(createUsuarioDto: CreateUsuarioDto) {
    // 1. Prisma inserta el registro en la tabla 'usuario' automáticamente
    // OJO: Asume que en tu schema.prisma tienes un modelo llamado "Usuario"
    const nuevoUsuario = await this.prisma.usuario.create({
      data: createUsuarioDto,
    });
    
    return nuevoUsuario;
  }

  async findAll() {
    // Busca todos los registros de la tabla 'usuario'
    return this.prisma.usuario.findMany();
  }

  async findOne(id: number) {
    // Busca un usuario por su ID (llave primaria)
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });
    
    // Si Prisma nos devuelve null, lanzamos un error 404
    if (!usuario) {
      throw new NotFoundException(`El usuario con ID #${id} no fue encontrado`);
    }
    
    return usuario;
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    // 1. Verificamos que exista (nuestra función findOne ya hace eso y lanza error si no)
    await this.findOne(id);
    
    // 2. Le pedimos a Prisma que actualice ese ID con los nuevos datos
    const usuarioActualizado = await this.prisma.usuario.update({
      where: { id },
      data: updateUsuarioDto,
    });
    
    return usuarioActualizado;
  }

  async remove(id: number) {
    // 1. Verificamos que exista
    await this.findOne(id);
    
    // 2. Le pedimos a Prisma que lo borre
    await this.prisma.usuario.delete({
      where: { id },
    });
    
    return { mensaje: `Usuario #${id} eliminado correctamente` };
  }
}
