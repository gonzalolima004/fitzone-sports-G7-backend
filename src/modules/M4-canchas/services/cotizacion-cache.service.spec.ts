import { CotizacionCacheService } from './cotizacion-cache.service';

describe('CotizacionCacheService', () => {
  let cache: CotizacionCacheService;

  beforeEach(() => {
    cache = new CotizacionCacheService().configurar(3, 100); // Max 3 items, 100ms TTL para tests
  });

  it('debe retornar null en caso de MISS', async () => {
    const result = await cache.get('inexistente');
    expect(result).toBeNull();
  });

  it('debe guardar y retornar el elemento en caso de HIT', async () => {
    const data = {
      costoBase: 12000,
      esSocio: true,
      aplicaDescuentoSocio: true,
      motivoSinDescuento: null,
    };

    await cache.set('cancha_1', data);
    const result = await cache.get('cancha_1');

    expect(result).toEqual(data);
  });

  it('debe expirar el elemento una vez transcurrido el TTL', async () => {
    const data = {
      costoBase: 12000,
      esSocio: false,
      aplicaDescuentoSocio: false,
      motivoSinDescuento: 'ROL_EXTERNO' as const,
    };

    await cache.set('cancha_temp', data, 20); // 20ms TTL
    await new Promise((resolve) => setTimeout(resolve, 30));

    const result = await cache.get('cancha_temp');
    expect(result).toBeNull();
  });

  it('debe aplicar política LRU y desalojar el elemento menos recientemente usado al superar la capacidad', async () => {
    const makeItem = (id: number) => ({
      costoBase: id * 1000,
      esSocio: true,
      aplicaDescuentoSocio: true,
      motivoSinDescuento: null,
    });

    await cache.set('k1', makeItem(1));
    await cache.set('k2', makeItem(2));
    await cache.set('k3', makeItem(3));

    // Capacidad al máximo (3)
    expect(cache.size).toBe(3);

    // Accedemos a k1 para marcarlo como recientemente usado (k2 pasa a ser el más antiguo)
    await cache.get('k1');

    // Insertamos k4: debe desalojar k2
    await cache.set('k4', makeItem(4));

    expect(cache.size).toBe(3);
    expect(await cache.get('k2')).toBeNull(); // Desalojado por LRU
    expect(await cache.get('k1')).not.toBeNull();
    expect(await cache.get('k3')).not.toBeNull();
    expect(await cache.get('k4')).not.toBeNull();
  });

  it('debe permitir eliminar una clave específica o limpiar todo', async () => {
    const item = {
      costoBase: 1000,
      esSocio: true,
      aplicaDescuentoSocio: true,
      motivoSinDescuento: null,
    };

    await cache.set('a', item);
    await cache.set('b', item);

    await cache.del('a');
    expect(await cache.get('a')).toBeNull();
    expect(await cache.get('b')).not.toBeNull();

    await cache.clear();
    expect(cache.size).toBe(0);
    expect(await cache.get('b')).toBeNull();
  });
});
