import { Injectable } from '@nestjs/common';
import { ListaEsperaSubject } from './lista-espera-subject.interface';
import {
  ListaEsperaObserver,
  VacanteLiberadaEvento,
} from './lista-espera-observer.interface';

@Injectable()
export class ConcretoListaEsperaSubject implements ListaEsperaSubject {
  private observers: ListaEsperaObserver[] = [];

  attach(observer: ListaEsperaObserver): void {
    const isExist = this.observers.includes(observer);
    if (!isExist) {
      this.observers.push(observer);
    }
  }

  detach(observer: ListaEsperaObserver): void {
    const observerIndex = this.observers.indexOf(observer);
    if (observerIndex !== -1) {
      this.observers.splice(observerIndex, 1);
    }
  }

  async notify(evento: VacanteLiberadaEvento): Promise<void> {
    for (const observer of this.observers) {
      await observer.update(evento);
    }
  }
}
