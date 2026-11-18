# ADR-013: Utilizar el patrón Observer para la gestión de lista de espera

- **Estado:** Aceptado
- **Fecha:** 2026-09-01
- **Autor:** Marcos Ramón Caraballo y Angelina María Vialle
- **Sprint:** 1

## Contexto
En FitZone, las clases grupales o los turnos de canchas poseen un cupo limitado. Cuando un usuario cancela una reserva, la plaza queda disponible y el sistema debe notificar o reasignar ese lugar a los usuarios anotados en la lista de espera. Si la lógica de cancelación asume directamente el envío de correos, notificaciones push, actualización de estados o reasignaciones automáticas, el servicio de reservas quedará fuertemente acoplado a múltiples sub-dominios, dificultando su mantenimiento y evolución.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Llamadas síncronas directas desde el servicio de cancelación** | Secuencia de ejecución lineal fácil de seguir a simple vista. | Acopla fuertemente el módulo de reservas con notificaciones y listas de espera, violando la separación de responsabilidades. | Descartado por generar un diseño frágil ante cambios o fallas en servicios secundarios. |
| **Proceso periódico en segundo plano (Polling / Cron Job)** | Desacopla totalmente los procesos mediante tareas diferidas en el tiempo. | No ofrece respuesta en tiempo real al usuario en lista de espera, generando demoras inaceptables en la asignación de plazas. | Inviable para un sistema interactivo que requiere inmediatez en la liberación de cupos. |
| **Patrón Observer / Sistema de Eventos** | Emite un evento de cancelación al que los módulos interesados se suscriben de manera desacoplada. | El flujo de control se vuelve indirecto, exigiendo un seguimiento cuidadoso de la trazabilidad de eventos. | **Seleccionada** por su alta modularidad, bajo acoplamiento y facilidad para extender reacciones futuras. |

## Decisión
Vamos a utilizar el patrón Observer para reaccionar ante la liberación de cupos y gestionar la lista de espera. Cuando un usuario cancele una reserva, el servicio emitirá un evento. Los módulos interesados actuarán como observadores, escuchando dicho evento para procesar la asignación del cupo al siguiente usuario y notificarle sin acoplarse directamente al flujo principal de cancelación.

## Consecuencias
- **Positivas:** Desacopla el servicio de reservas de las notificaciones y listas de espera, mejorando notablemente la mantenibilidad y permitiendo añadir nuevos comportamientos sin modificar el núcleo.
- **Negativas:** El flujo de ejecución deja de ser estrictamente lineal, lo que exige rigor al depurar la traza de eventos.
- **Deuda asumida:** Establecer un manejo centralizado de excepciones en los subscriptores para evitar que un fallo en una notificación interrumpa la transacción principal.

## Requisitos relacionados
RF-07, RF-08, Unidad III

