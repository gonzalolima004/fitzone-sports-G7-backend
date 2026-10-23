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

  /**
   * Extrae la responsabilidad de verificar contra base de datos
   * y desencriptar usando bcrypt.
   */
  private async validateLocalUser(
    email: string,
    pass: string,
  ): Promise<UsuarioConRoles> {
    const usuario = await this.usuariosRepository.findByEmail(email);

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const isPasswordValid = await bcrypt.compare(pass, usuario.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    return usuario;
  }

  async login(dto: LoginDto) {
    // 1. Validar usuario y obtener entidad real
    const usuario = await this.validateLocalUser(dto.email, dto.password);

    // 2. Extraer el rol primario o fallback
    const rol: string = usuario.usuario_rol?.[0]?.rol?.nombre ?? 'socio';

    // 3. Armar el payload
    const payload = {
      sub: usuario.id_usuario,
      email: usuario.email,
      rol: rol,
    };

    // 4. Retornar sesión JWT y DTO del usuario
    return {
      token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id_usuario,
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: rol,
      },
    };
  }
}
