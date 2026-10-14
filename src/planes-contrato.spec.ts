import { instanceToPlain } from 'class-transformer';
import { Prisma } from '@prisma/client';
import { PlanesService } from './modules/M1-usuarios/services/planes.service';
import { MembresiasRepository } from './modules/M1-usuarios/repositories/membresias.repository';

describe('Contrato serializado de planes', () => {
  const plan = {
    id_membresia_plan: 7,
    nombre: 'Mensual',
    duracion_dias: 30,
    precio: new Prisma.Decimal('25000.50'),
  };
  const repo = {
    findAllPlanes: jest.fn().mockResolvedValue([plan]),
    findOnePlan: jest.fn().mockResolvedValue(plan),
    createPlan: jest.fn().mockResolvedValue(plan),
    updatePlan: jest.fn().mockResolvedValue(plan),
    removePlan: jest.fn().mockResolvedValue(plan),
  };
  const service = new PlanesService(repo as unknown as MembresiasRepository);
  it('conserva id e id_plan y convierte precio a número al listar', async () => {
    expect(instanceToPlain(await service.findAll())).toEqual([
      {
        id: 7,
        id_plan: 7,
        nombre: 'Mensual',
        duracion_dias: 30,
        precio: 25000.5,
      },
    ]);
  });
  it('mantiene el mismo contrato en detalle, alta, edición y baja', async () => {
    const values = await Promise.all([
      service.findOne(7),
      service.create({ nombre: 'Mensual', duracion_dias: 30, precio: 25000.5 }),
      service.update(7, { precio: 25000.5 }),
      service.remove(7),
    ]);
    for (const value of values) {
      expect(instanceToPlain(value)).toMatchObject({
        id: 7,
        id_plan: 7,
        precio: 25000.5,
      });
      expect(JSON.stringify(value)).not.toContain('id_membresia_plan');
    }
  });
});
