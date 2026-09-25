import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Body,
  Post,
  Patch,
  Delete,
} from '@nestjs/common';
import { CiudadService } from '../services/ciudad.service';
import { CreateCiudadDto } from '../dto/create-ciudad.dto';
import { UpdateCiudadDto } from '../dto/update-ciudad.dto';

@Controller('ciudades')
export class CiudadController {
  constructor(private readonly ciudadService: CiudadService) {}

  @Get()
  async findAll() {
    return this.ciudadService.findAll();
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id_ciudad: number) {
    return this.ciudadService.findById(id_ciudad);
  }

  @Post()
  async create(@Body() data: CreateCiudadDto) {
    return this.ciudadService.create(data);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id_ciudad: number,
    @Body() data: UpdateCiudadDto,
  ) {
    return this.ciudadService.update(id_ciudad, data);
  }

  @Delete(':id')
  async logicalDelete(@Param('id', ParseIntPipe) id_ciudad: number) {
    return this.ciudadService.logicalDelete(id_ciudad);
  }
}
