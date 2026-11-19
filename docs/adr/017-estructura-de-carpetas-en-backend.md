# ADR-017: Estructura de las carpetas en el backend

- **Estado:** Aceptado
- **Fecha:** 2026-09-06
- **Autor:** Marcos Ramón y Angelina María Vialle
- **Sprint:** 1

## Contexto
FitZone Sports abarca múltiples dominios funcionales, los cuales presentan reglas de negocio heterogéneas, frecuencias de actualización distintas y diferentes niveles de concurrencia. Adicionalmente, el cronograma del proyecto exige el desarrollo simultáneo de estas características por distintos programadores sobre un mismo repositorio de código, dentro de un plazo fijo de entrega y bajo estándares de mantenibilidad y escalabilidad.  

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Arquitectura en capas tradicional horizontal (`controllers/`, `services/`, `models/` globales)** | Estructura clásica muy conocida en aplicaciones pequeñas. | Todo el código de diferentes dominios se mezcla en las mismas carpetas globales a medida que el sistema crece. | Dificulta la mantenibilidad y genera conflictos de código constantes entre los integrantes del equipo. |
| **Arquitectura de Microservicios distribuidos** | Aislamiento extremo de cada módulo en servicios de red independientes. | Sobrecomplejidad masiva innecesaria en infraestructura, orquestación y comunicación de red para los objetivos del proyecto. | Descartado por inviable y desproporcionado para los plazos y la escala académica. |
| **Monolito modular por dominios de negocio** | Agrupa controladores, servicios, DTOs y entidades dentro de cada módulo funcional aislado. | Exige disciplina estricta para evitar saltarse los límites e importar elementos entre módulos de forma incorrecta. | **Seleccionada** porque ofrece alta cohesión, bajo acoplamiento y permite trabajar en paralelo sin conflictos de fusión. |

## Decisión
Vamos a organizar cada dominio funcional del negocio dentro de su propio módulo aislado conteniendo sus propios controllers, services, DTOs, entidades y repositorios. La comunicación entre módulos se realizará a través de interfaces bien definidas o servicios exportados, prohibiendo la importación directa de elementos internos de otros contextos.  

## Consecuencias
- **Positivas:** Delimita claramente las responsabilidades del dominio, permite el trabajo en paralelo de los desarrolladores sin conflictos recurrentes en Git y facilita una futura extracción a microservicios si fuese necesario.
- **Negativas:** Requiere disciplina estricta del equipo para prohibir importaciones circulares o cruzadas indebidas entre los límites de los módulos.
- **Deuda asumida:** Refactorizar elementos compartidos que accidentalmente se dupliquen en las fronteras de los módulos.

## Requisitos relacionados
Unidad II, Unidad V