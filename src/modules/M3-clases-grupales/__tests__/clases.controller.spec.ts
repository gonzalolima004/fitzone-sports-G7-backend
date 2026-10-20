import { Test, TestingModule } from '@nestjs/testing';
import { ClasesController } from '../controllers/clases.controller';
import { ClasesService } from '../services/clases.service';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateClaseDto } from '../dto/create-clase.dto';
import { UpdateClaseDto } from '../dto/update-clase.dto';

describe('ClasesController', () => {
  let controller: ClasesController;

  const mockClase = {
    id_clase: 1,
    id_sede: 1,
    nombre: 'Spinning Funcional',
    capacidad_maxima: 20,
    activo: true,
  };

  const mockClasesService = {
    crearClase: jest.fn(),
    obtenerClasesPorSede: jest.fn(),
    obtenerClasePorId: jest.fn(),
    actualizarClase: jest.fn(),
    reemplazarClase: jest.fn(),
    eliminarClase: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClasesController],
      providers: [
        {
          provide: ClasesService,
          useValue: mockClasesService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ClasesController>(ClasesController);
  });

  it('POST /clases debe llamar a service.crearClase', async () => {
    const dto: CreateClaseDto = {
      id_sede: 1,
      nombre: 'Spinning Funcional',
      capacidad_maxima: 20,
    };
    mockClasesService.crearClase.mockResolvedValue(mockClase);

    const result = await controller.crearClase(dto);

    expect(mockClasesService.crearClase).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockClase);
  });

  it('GET /clases debe llamar a service.obtenerClasesPorSede', async () => {
    mockClasesService.obtenerClasesPorSede.mockResolvedValue([mockClase]);

    const result = await controller.obtenerClasesPorSede(1, '2026-10-12');

    expect(mockClasesService.obtenerClasesPorSede).toHaveBeenCalledWith(
      1,
      '2026-10-12',
    );
    expect(result).toEqual([mockClase]);
  });

  it('GET /clases/:id debe llamar a service.obtenerClasePorId', async () => {
    mockClasesService.obtenerClasePorId.mockResolvedValue(mockClase);

    const result = await controller.obtenerClasePorId(1);

    expect(mockClasesService.obtenerClasePorId).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockClase);
  });

  it('PATCH /clases/:id debe llamar a service.actualizarClase', async () => {
    const updateDto: UpdateClaseDto = { nombre: 'Spinning Modificado' };
    mockClasesService.actualizarClase.mockResolvedValue({
      ...mockClase,
      ...updateDto,
    });

    const result = await controller.actualizarClase(1, updateDto);

    expect(mockClasesService.actualizarClase).toHaveBeenCalledWith(
      1,
      updateDto,
    );
    expect(result.nombre).toBe('Spinning Modificado');
  });

  it('PUT /clases/:id debe llamar a service.reemplazarClase', async () => {
    const replaceDto: CreateClaseDto = {
      id_sede: 1,
      nombre: 'Spinning Total',
      capacidad_maxima: 22,
    };
    mockClasesService.reemplazarClase.mockResolvedValue({
      ...mockClase,
      ...replaceDto,
    });

    const result = await controller.reemplazarClase(1, replaceDto);

    expect(mockClasesService.reemplazarClase).toHaveBeenCalledWith(
      1,
      replaceDto,
    );
    expect(result.capacidad_maxima).toBe(22);
  });

  it('DELETE /clases/:id debe llamar a service.eliminarClase', async () => {
    const responseDto = {
      mensaje: 'Clase dada de baja exitosamente.',
      id_clase: 1,
      activo: false,
      reservas_canceladas: 1,
    };
    mockClasesService.eliminarClase.mockResolvedValue(responseDto);

    const result = await controller.eliminarClase(1);

    expect(mockClasesService.eliminarClase).toHaveBeenCalledWith(1);
    expect(result).toEqual(responseDto);
  });
});
