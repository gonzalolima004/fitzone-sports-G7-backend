# ADR-016: Implementación de Supabase Realtime para interacción en tiempo real

- **Estado:** Aceptado
- **Fecha:** 2026-09-06
- **Autor:** Marcos Ramón y Angelina María Vialle
- **Sprint:** 1

## Contexto
El sistema cuenta con flujos interactivos que requieren actualizaciones inmediatas en la interfaz del usuario sin necesidad de recargar la página o realizar peticiones periódicas. Ejemplos clave de esto son: la liberación de cupos en listas de espera de clases grupales, el cambio de estado de disponibilidad de las canchas y la actualización en vivo del aforo de socios dentro de cada sede para el personal de recepción.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **HTTP Short / Long Polling periódico** | Utiliza peticiones HTTP estándar fáciles de implementar sobre cualquier arquitectura. | Genera un consumo masivo de ancho de banda y una sobrecarga innecesaria sobre la base de datos relacional y el backend. | Descartado por su ineficiencia y mala escalabilidad ante múltiples clientes conectados. |
| **Servidor de WebSockets dedicado propio (ej. Socket.io en NestJS)** | Control absoluto sobre los eventos, canales y lógica de transmisión en tiempo real. | Exige mantener un servicio de WebSockets adicional persistente, complicando la infraestructura de despliegue y contenedores. | Sobrecarga de infraestructura innecesaria existiendo capacidades nativas en la plataforma base. |
| **Supabase Realtime (WebSockets nativos sobre PostgreSQL)** | Transmisión inmediata de cambios en la base de datos hacia el frontend sin sobrecargar el backend de NestJS. | Requiere administrar adecuadamente las suscripciones abiertas y configurar las políticas RLS de seguridad. | **Seleccionada** porque aprovecha la infraestructura nativa de la base de datos, reduciendo la carga en la API y entregando una experiencia fluida. |

## Decisión
Vamos a utilizar Supabase Realtime para la transmisión de eventos y reservas en tiempo real desde el cliente frontend. Escucharemos los cambios de la base de datos mediante el cliente WebSocket nativo de Supabase. 

## Consecuencias
- **Positivas:** Experiencia de usuario altamente fluida con actualización instantánea de aforos y disponibilidad, reduciendo drásticamente la carga de peticiones sobre la API.
- **Negativas:** Exige gestionar correctamente la apertura y cierre de canales en el frontend para prevenir fugas de memoria y agotar límites de conexiones concurrentes.
- **Deuda asumida:** Configurar de manera rigurosa las políticas de seguridad a nivel de filas (*Row Level Security*) para restringir qué datos se transmiten en tiempo real a cada usuario.

## Requisitos relacionados
RF-04, RF-08, RNF-01, Unidad IV
