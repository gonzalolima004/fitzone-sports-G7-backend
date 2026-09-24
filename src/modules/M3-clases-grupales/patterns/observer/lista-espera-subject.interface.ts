import {
  ListaEsperaObserver,
  VacanteLiberadaEvento,
} from './lista-espera-observer.interface';

export interface ListaEsperaSubject {
  attach(observer: ListaEsperaObserver): void;
  detach(observer: ListaEsperaObserver): void;
  notify(evento: VacanteLiberadaEvento): Promise<void> | void;
}
