import {
  Controller,
  Delete,
  Get,
  Patch,
  ParseIntPipe,
  Param,
  Body,
  Post,
} from '@nestjs/common';
import { SedeService } from '../services/sede.service';
import { CreateSedeDto } from '../dto/create-sede.dto';
import { UpdateSedeDto } from '../dto/update-sede.dto';

@Controller('sedes')
export class SedeController {
  constructor(private readonly sedeService: SedeService) {}

  @Get()
  async findAll() {
    return this.sedeService.findAll();
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id_sede: number) {
    return this.sedeService.findById(id_sede);
  }

  @Post()
  async create(@Body() data: CreateSedeDto) {
    return this.sedeService.create(data);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id_sede: number,
    @Body() data: UpdateSedeDto,
  ) {
    return this.sedeService.update(id_sede, data);
  }

  @Delete(':id')
  async logicalDelete(@Param('id', ParseIntPipe) id_sede: number) {
    return this.sedeService.logicalDelete(id_sede);
  }
}
