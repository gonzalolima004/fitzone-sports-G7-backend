export interface VacanteLiberadaEvento {
  id_clase: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  id_usuario_promovido?: number;
}

export interface ListaEsperaObserver {
  update(evento: VacanteLiberadaEvento): Promise<void> | void;
}
