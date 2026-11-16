import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  UsuariosRepository,
  UsuarioAuthPerfil,
} from '../repositories/usuarios.repository';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosRepository: UsuariosRepository,
    private readonly jwtService: JwtService,
  ) {}

  private async validateLocalUser(
    email: string,
    pass: string,
  ): Promise<UsuarioAuthPerfil> {
    const usuario = await this.usuariosRepository.findAuthProfileByEmail(email);

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
    const usuario = await this.validateLocalUser(dto.email, dto.password);
    const rol: string = usuario.usuario_rol?.[0]?.rol?.nombre ?? 'externo';

    const payload = {
      sub: usuario.id_usuario,
      email: usuario.email,
      rol,
    };

    return {
      token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id_usuario,
        id_usuario: usuario.id_usuario,
        dni: usuario.dni,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        telefono: usuario.telefono,
        foto_url: usuario.foto_url,
        id_sede: usuario.id_sede,
        sede: usuario.sede,
        rol,
      },
    };
  }
}
