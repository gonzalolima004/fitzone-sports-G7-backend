import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  UsuariosRepository,
  UsuarioConRoles,
} from '../repositories/usuarios.repository';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosRepository: UsuariosRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    // 1. Buscar usuario por email (el repositorio incluye las relaciones)
    const usuario: UsuarioConRoles | null =
      await this.usuariosRepository.findByEmail(dto.email);

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // 2. Verificar que la contraseña coincida con el hash de la base de datos
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      usuario.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // 3. Extraer el rol (asumimos el primer rol de la relación, o 'socio' por defecto)
    const rol: string = usuario.usuario_rol?.[0]?.rol?.nombre ?? 'socio';

    // 4. Armar el payload del JWT
    const payload = {
      sub: usuario.id_usuario,
      email: usuario.email,
      rol: rol,
    };

    // 5. Retornar los datos con la estructura que configuramos en Vue
    return {
      token: this.jwtService.sign(payload),
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: rol,
      },
    };
  }
}
