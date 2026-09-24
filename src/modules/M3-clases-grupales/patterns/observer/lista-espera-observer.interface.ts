export interface VacanteLiberadaEvento {
  id_clase: number;
  fecha_inicio: Date;
  fecha_fin: Date;
}

export interface ListaEsperaObserver {
  update(evento: VacanteLiberadaEvento): Promise<void> | void;
}
