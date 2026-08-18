/**
 * ARCHIVO: usuarios.controller.ts
 * PROPÓSITO: Es el "Recepcionista" de la ruta /usuarios.
 * Recibe las peticiones HTTP (GET, POST, PATCH, DELETE) desde el cliente,
 * extrae los datos (Body, Params) y se los pasa al servicio. NO DEBE TENER LÓGICA DE NEGOCIO.
 */
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

// EJEMPLO: El decorador @Controller('usuarios') define la URL base.
// Es decir, todas estas rutas responderán en http://localhost:3000/usuarios
@Controller('usuarios')
export class UsuariosController {
  // NestJS inyecta automáticamente el servicio para que podamos usarlo aquí
  constructor(private readonly usuariosService: UsuariosService) {}

  // Petición POST -> http://localhost:3000/usuarios
  // El decorador @Body() extrae y valida automáticamente los datos según CreateUsuarioDto
  @Post()
  // Usamos async/await porque el servicio ahora interactúa con una base de datos real
  async create(@Body() createUsuarioDto: CreateUsuarioDto) {
    // Delega el trabajo pesado al servicio y espera la respuesta
    return await this.usuariosService.create(createUsuarioDto);
  }

  // Petición GET -> http://localhost:3000/usuarios
  @Get()
  async findAll() {
    return await this.usuariosService.findAll();
  }

  // Petición GET -> http://localhost:3000/usuarios/5
  // El decorador @Param('id') extrae el "5" de la URL. 
  // El "+" antes de id (+id) convierte el string "5" a un número 5.
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.usuariosService.findOne(+id);
  }

  // Petición PATCH -> http://localhost:3000/usuarios/5
  // Recibe tanto el ID por parámetro, como los datos parciales por el body
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return await this.usuariosService.update(+id, updateUsuarioDto);
  }

  // Petición DELETE -> http://localhost:3000/usuarios/5
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.usuariosService.remove(+id);
  }
}
