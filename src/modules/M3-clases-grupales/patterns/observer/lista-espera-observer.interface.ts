export interface VacanteLiberadaEvento {
  id_clase: number;
  id_sede?: number;
  nombre_clase?: string;
  profesor?: string | null;
  sala?: string | null;
  fecha_inicio: Date;
  fecha_fin: Date;
  id_usuario_promovido?: number;
  mensaje?: string;
}

export interface ListaEsperaObserver {
  update(evento: VacanteLiberadaEvento): Promise<void> | void;
}
