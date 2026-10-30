import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PlanesService } from '../services/planes.service';
import { CrearPlanDto } from '../dto/crear-plan.dto';
import { ActualizarPlanDto } from '../dto/actualizar-plan.dto';
import { PlanResponseDto } from '../dto/plan-response.dto';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

// Los GET siguen siendo públicos (landing y pantalla de membresías).
// Alta, modificación y baja: solo gerente.
@ApiTags('Planes')
@Controller('planes')
@UseInterceptors(ClassSerializerInterceptor)
export class PlanesController {
  constructor(private readonly planesService: PlanesService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo plan (Solo gerente)' })
  @ApiResponse({ status: 201, description: 'Plan creado exitosamente.' })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol gerente.',
  })
  create(@Body() createPlanDto: CrearPlanDto): Promise<PlanResponseDto> {
    return this.planesService.create(createPlanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de planes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de planes obtenida correctamente.',
  })
  findAll(): Promise<PlanResponseDto[]> {
    return this.planesService.findAll();
  }
  @Get(':id')
  @ApiOperation({ summary: 'Obtener plan por ID' })
  @ApiResponse({ status: 200, description: 'Plan obtenido correctamente.' })
  @ApiResponse({ status: 404, description: 'Plan no encontrado.' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlanResponseDto | null> {
    return this.planesService.findOne(id);
  }
  @Patch(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar plan (Solo gerente)' })
  @ApiResponse({ status: 200, description: 'Plan actualizado correctamente.' })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol gerente.',
  })
  @ApiResponse({ status: 404, description: 'Plan no encontrado.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlanDto: ActualizarPlanDto,
  ): Promise<PlanResponseDto> {
    return this.planesService.update(id, updatePlanDto);
  }
  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('gerente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar plan (Solo gerente)' })
  @ApiResponse({ status: 200, description: 'Plan eliminado correctamente.' })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol gerente.',
  })
  @ApiResponse({ status: 404, description: 'Plan no encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<PlanResponseDto> {
    return this.planesService.remove(id);
  }
}
