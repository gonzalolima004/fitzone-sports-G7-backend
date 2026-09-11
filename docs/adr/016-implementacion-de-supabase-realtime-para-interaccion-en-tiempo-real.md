# ADR-016: Implementación de Supabase Realtime para interacción en tiempo real

* **Estado:** Aceptado
* **Fecha:** 2026-09-06

## Contexto
El sistema cuenta con flujos interactivos que requieren actualizaciones inmediatas en la interfaz del usuario sin necesidad de recargar la página o realizar peticiones periódicas. Ejemplos clave de esto son: la liberación de cupos en listas de espera de clases grupales, el cambio de estado de disponibilidad de las canchas y la actualización en vivo del aforo de socios dentro de cada sede para el personal de recepción.

## Decisión
Vamos a utilizar Supabase Realtime para la transmisión de eventos y reservas en tiempo real desde el cliente frontend. Escucharemos los cambios de la base de datos mediante el cliente WebSocket nativo de Supabase. 

## Consecuencias
Positivas: experiencia de usuario fluida: los cambios en listas de espera y disponibilidad se reflejan en la interfaz de forma instantánea; reducción de carga en el backend: se elimina la necesidad de procesar miles de peticiones de polling dirigidas a la API en NestJS; simplicidad de implementación: se aprovecha la capacidad nativa de WebSockets de Supabase sin necesidad de montar y mantener un servidor dedicado de WebSockets o Socket.io.

Negativas: gestión de conexiones abiertas: requiere controlar adecuadamente la apertura y cierre de suscripciones en el frontend para evitar fugas de memoria o agotar el límite de conexiones concurrentes; lógica de autorización en tiempo real: es necesario configurar correctamente las políticas RLS en la base de datos.

## Alternativas consideradas
HTTP Short / Long Polling: Descartada por el consumo ineficiente de ancho de banda y la sobrecarga sobre la base de datos relacional.
