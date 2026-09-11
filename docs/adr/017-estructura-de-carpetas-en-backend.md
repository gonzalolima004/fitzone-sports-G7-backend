# ADR-017: Estructura de las carpetas en el backend

* **Estado:** Aceptado
* **Fecha:** 2026-09-06

## Contexto
FitZone Sports abarca múltiples dominios funcionales, los cuales presentan reglas de negocio heterogéneas, frecuencias de actualización distintas y diferentes niveles de concurrencia. Adicionalmente, el cronograma del proyecto exige el desarrollo simultáneo de estas características por distintos programadores sobre un mismo repositorio de código, dentro de un plazo fijo de entrega y bajo estándares de mantenibilidad y escalabilidad.  

## Decisión
Vamos a organizar cada dominio funcional del negocio dentro de su propio módulo aislado conteniendo sus propios controllers, services, DTOs, entidades y repositorios. La comunicación entre módulos se realizará a través de interfaces bien definidas o servicios exportados, prohibiendo la importación directa de elementos internos de otros contextos.  

## Consecuencias
Positivas: límites de dominio claros: Alta cohesión interna en cada módulo y bajo acoplamiento entre funcionalidades; trabajo en equipo en paralelo: permite que diferentes duplas de desarrolladores trabajen en módulos independientes sin generar conflictos de merge recurrentes en Git; Facilidad de evolución: si en el futuro un módulo específico requiere ser extraído como un microservicio independiente, la migración requerirá un esfuerzo mínimo gracias al aislamiento de su carpeta y modelo.

Negativas: curva de disciplina: el equipo debe ser estricto para no romper los límites del módulo mediante importaciones cruzadas indebidas; ligera duplicación inicial: puede requerir la creación de DTOs o interfaces repetidas en bordes de módulos para evitar dependencias circulares.

## Alternativas consideradas
(a) Arquitectura de Microservicios: Descartada por sobrecomplejidad innecesaria en la infraestructura, despliegue y comunicación de red para la escala actual del proyecto.
