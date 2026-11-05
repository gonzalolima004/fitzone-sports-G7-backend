import { Injectable } from '@nestjs/common';
import { MotivoSinDescuento } from '../dto/cotizacion-turno.dto';

export interface CachedCotizacionContext {
  costoBase: number;
  esSocio: boolean;
  aplicaDescuentoSocio: boolean;
  motivoSinDescuento: MotivoSinDescuento;
}

export interface ICotizacionCacheService {
  get(key: string): Promise<CachedCotizacionContext | null>;
  set(
    key: string,
    value: CachedCotizacionContext,
    ttlMs?: number,
  ): Promise<void>;
  del(key: string): Promise<void>;
  clear(): Promise<void>;
}

interface CacheEntry {
  value: CachedCotizacionContext;
  expiresAt: number;
}

/**
 * SERVICIO DE CACHÉ DE COTIZACIÓN (Adapter Pattern / Cache Provider)
 *
 * Encapsula la gestión de caché en memoria con política de desalojo LRU
 * (Least Recently Used) y límite estricto de capacidad para prevenir fugas de memoria.
 *
 * Está pensado para después ver si usamos Redis y que no sea difícil el
 * cambio en caso de que sí
 */
@Injectable()
export class CotizacionCacheService implements ICotizacionCacheService {
  private maxEntries = 500;
  private defaultTtlMs = 30_000;
  private readonly store = new Map<string, CacheEntry>();

  constructor() {}

  /**
   * Permite reconfigurar límites
   */
  configurar(maxEntries: number, defaultTtlMs: number): this {
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlMs;
    return this;
  }

  get(key: string): Promise<CachedCotizacionContext | null> {
    const entry = this.store.get(key);
    if (!entry) {
      return Promise.resolve(null);
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      // Expirado: eliminar para liberar memoria
      this.store.delete(key);
      return Promise.resolve(null);
    }

    // Política LRU: refrescar posición para marcar como recientemente usado
    this.store.delete(key);
    this.store.set(key, entry);

    return Promise.resolve(entry.value);
  }

  set(
    key: string,
    value: CachedCotizacionContext,
    ttlMs?: number,
  ): Promise<void> {
    const ttl = ttlMs ?? this.defaultTtlMs;
    const expiresAt = Date.now() + ttl;

    // Si ya existe la clave, eliminarla primero para actualizar orden LRU
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      // Capacidad máxima alcanzada: desalojar la entrada más antigua (LRU)
      for (const oldestKey of this.store.keys()) {
        this.store.delete(oldestKey);
        break;
      }
    }

    this.store.set(key, { value, expiresAt });
    return Promise.resolve();
  }

  del(key: string): Promise<void> {
    this.store.delete(key);
    return Promise.resolve();
  }

  clear(): Promise<void> {
    this.store.clear();
    return Promise.resolve();
  }

  /**
   * Retorna la cantidad actual de elementos en caché
   */
  get size(): number {
    return this.store.size;
  }
}
