import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import mercadopagoConfig from './config/mercadopago.config';
import supabaseConfig from './config/supabase.config';
import { SupabaseModule } from './common/supabase/supabase.module';
import { PrismaModule } from './database/prisma-service/prisma.module';
import { AccesosModule } from './modules/M2-accesos/accesos.module';
import { CanchasModule } from './modules/M4-canchas/canchas.module';
import { PagosModule } from './modules/M5-pagos/pagos.module';
import { UsuariosModule } from './modules/M1-usuarios/usuarios.module';
import { SedesModule } from './modules/M0-sedes/sedes.module';
import { ClasesGrupalesModule } from './modules/M3-clases-grupales/clases-grupales.module';
import { ReportesModule } from './modules/M6-reportes/reportes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mercadopagoConfig, supabaseConfig],
    }),
    PrismaModule,
    SupabaseModule,
    UsuariosModule,
    AccesosModule,
    ClasesGrupalesModule,
    CanchasModule,
    PagosModule,
    SedesModule,
    ReportesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
