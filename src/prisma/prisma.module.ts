import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// El decorador @Global() hace que PrismaService esté disponible en toda 
// la aplicación sin tener que importar este módulo en cada funcionalidad.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
