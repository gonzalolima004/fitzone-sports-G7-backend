import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';

// IMPORTANTE: Ajusta esta ruta a la ubicación real de tu guard
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';

interface RequestWithUser extends Request {
  user: unknown;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión y obtener token JWT' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // --- NUEVO ENDPOINT PROACTIVO ---
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar si el perfil interno existe' })
  verifyProfile(@Req() req: RequestWithUser) {
    // Si la petición logra llegar aquí adentro, significa que el Guard la aprobó
    // por lo tanto, el usuario SÍ existe en la base de datos local.
    return { success: true, user: req.user };
  }
}
