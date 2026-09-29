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
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PlanesService } from '../services/planes.service';
import { CrearPlanDto } from '../dto/crear-plan.dto';
import { ActualizarPlanDto } from '../dto/actualizar-plan.dto';
import { PlanResponseDto } from '../dto/plan-response.dto';

@ApiTags('Planes')
@Controller('planes')
@UseInterceptors(ClassSerializerInterceptor)
export class PlanesController {
  constructor(private readonly planesService: PlanesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo plan' })
  @ApiResponse({ status: 201, description: 'Plan creado exitosamente.' })
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
  @ApiOperation({ summary: 'Actualizar plan' })
  @ApiResponse({ status: 200, description: 'Plan actualizado correctamente.' })
  @ApiResponse({ status: 404, description: 'Plan no encontrado.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlanDto: ActualizarPlanDto,
  ): Promise<PlanResponseDto> {
    return this.planesService.update(id, updatePlanDto);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar plan' })
  @ApiResponse({ status: 200, description: 'Plan eliminado correctamente.' })
  @ApiResponse({ status: 404, description: 'Plan no encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<PlanResponseDto> {
    return this.planesService.remove(id);
  }
}
