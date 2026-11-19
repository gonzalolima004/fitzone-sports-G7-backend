# ADR-009: Adoptar una arquitectura de Monolito Modular

- **Estado:** Aceptado
- **Fecha:** 2026-09-01
- **Autor:** Marcos Ramón Caraballo y Angelina María Vialle
- **Sprint:** 1

## Contexto
FitZone está compuesto por cinco módulos funcionales principales: usuarios y membresías, gimnasio y acceso, clases grupales, canchas deportivas y pagos/facturación. Aunque existen diferentes áreas funcionales, todas forman parte de un mismo sistema y comparten información y operaciones transaccionales. El proyecto tiene un tiempo limitado de implementación. Por lo tanto, introducir múltiples servicios independientes implicaría costos adicionales de infraestructura, comunicación, despliegue y monitoreo.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Microservicios distribuidos** | Escalabilidad individual de componentes de red. | Complejidad masiva en infraestructura, latencia de red y transacciones distribuidas complejas. | Descartado por sobrecomplejidad operacional injustificada para la escala del proyecto. |
| **Monolito plano sin modularización** | Desarrollo inicial sumamente directo. | Código altamente acoplado y propenso al caos a medida que crecen los requerimientos funcionales. | Inviable para mantener separadas las responsabilidades de los cinco módulos. |
| **Monolito Modular** | Mantiene la simplicidad operativa de un monolito agrupando dominios lógicos independientes. | Exige disciplina estricta para evitar acoplamientos cruzados entre módulos. | **Seleccionada** por equilibrar la simplicidad de despliegue con una separación limpia de dominios. |

## Decisión
Vamos a implementar FitZone como un monolito modular utilizando NestJS. Cada dominio funcional estará organizado como un módulo independiente dentro del backend, manteniendo responsabilidades y dependencias claras entre ellos. Los módulos compartirán el mismo proceso de ejecución y la misma base de datos PostgreSQL, pero se buscará mantener el desacoplamiento lógico entre los dominios.

## Consecuencias
- **Positivas:** Simplifica drásticamente el despliegue, facilita las transacciones entre dominios y acelera el desarrollo.
- **Negativas:** Los módulos comparten recursos de ejecución y se debe vigilar estrictamente que no existan dependencias circulares.
- **Deuda asumida:** Mantener el aislamiento interno por módulo para permitir una futura extracción si fuera necesario.

## Requisitos relacionados
RN-02, RNF-04, Unidad II

