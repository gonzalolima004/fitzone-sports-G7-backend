# ADR-013: Utilizar el patrón Observer para la gestión de lista de espera

* **Estado:** Aceptado
* **Fecha:** 2026-09-01

## Contexto
En FitZone, las clases grupales o los turnos de canchas poseen un cupo limitado. Cuando un usuario cancela una reserva, la plaza queda disponible y el sistema debe notificar o reasignar ese lugar a los usuarios anotados en la lista de espera. Si la lógica de cancelación asume directamente el envío de correos, notificaciones push, actualización de estados o reasignaciones automáticas, el servicio de reservas quedará fuertemente acoplado a múltiples sub-dominios, dificultando su mantenimiento y evolución.

## Decisión
Vamos a utilizar el patrón Observer para reaccionar ante la liberación de cupos y gestionar la lista de espera. Cuando un usuario cancele una reserva, el servicio emitirá un evento. Los módulos interesados actuarán como observadores, escuchando dicho evento para procesar la asignación del cupo al siguiente usuario y notificarle sin acoplarse directamente al flujo principal de cancelación.

## Consecuencias
Positivas: desacopla el servicio principal de reservas de la lógica de notificaciones y gestión de listas de espera; permite agregar nuevos comportamientos o reacciones ante la cancelación de un turno sin modificar el servicio de cancelación; mejora la modularidad y mantenibilidad de la aplicación.

Negativas: el flujo de ejecución se vuelve indirecto, lo que exige un buen seguimiento de eventos durante la depuración; si las acciones de los observadores requieren orden estricto o manejo de fallas, se debe diseñar cuidadosamente la gestión de eventos.

## Alternativas consideradas
(a) Llamar directamente a los servicios de lista de espera y notificaciones desde el método de cancelación: descartada porque genera un alto acoplamiento entre módulos y viola la separación de responsabilidades. (b) Ejecutar un proceso en segundo plano que revise periódicamente cancelaciones: descartada porque no ofrece una respuesta inmediata al usuario en lista de espera ante una cancelación.

