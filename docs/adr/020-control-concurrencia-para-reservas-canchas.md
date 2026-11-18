# ADR-020: Control avanzado de concurrencia mediante bloqueo pesimista y restricciones de base de datos para reservas de canchas

- **Estado:** Aceptado
- **Fecha:** 2026-11-05
- **Autor:** Marcos Ramón y Angelina María Vialle
- **Sprint:** 7

## Contexto
El sistema *FitZone Sports* permite a los usuarios reservar canchas deportivas en días y rangos horarios específicos. Ante múltiples solicitudes simultáneas sobre un mismo espacio, existe el riesgo crítico de condiciones de carrera que provoquen reservas duplicadas. Si bien el ADR-010 original delegaba toda la protección exclusivamente en restricciones de unicidad a nivel de base de datos, la necesidad de gestionar transacciones financieras complejas, validaciones previas de estado y bloqueo preventivo de recursos bajo alta concurrencia requiere una estrategia híbrida y más robusta.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Restricciones de unicidad puras a nivel de base de datos (ADR-010 original)** | Garantía atómica nativa en PostgreSQL y alto rendimiento en inserciones. | Insuficiente cuando se requiere evaluar reglas de negocio complejas, preventivas y de bloqueo explícito antes de realizar el intento de inserción. | Reemplazado por resultar limitado frente a flujos de reserva que combinan pagos y estados previos. |
| **Bloqueo pesimista exclusivo en la aplicación** | Control total desde los servicios de NestJS sin depender de características avanzadas del motor relacional. | Mantiene conexiones y filas bloqueadas durante demasiado tiempo, degradando severamente el rendimiento y la escalabilidad de las conexiones en Supabase. | Descartado por su impacto negativo sobre el rendimiento general del sistema. |
| **Estrategia híbrida: Bloqueo pesimista selectivo (`SELECT ... FOR UPDATE`) combinado con restricciones de unicidad** | Previene conflictos lógicos anticipadamente y asegura una doble malla de seguridad transaccional a nivel de almacenamiento. | Incrementa ligeramente la complejidad en la gestión de transacciones dentro del servicio backend. | **Seleccionada** porque une lo mejor de ambos mundos: previene bloqueos lógicos innecesarios y garantiza consistencia absoluta. |

## Decisión
Se reemplaza el enfoque anterior estableciendo una estrategia híbrida de control de concurrencia para las reservas de canchas. El backend en NestJS utilizará un bloqueo pesimista selectivo (`SELECT ... FOR UPDATE`) dentro de una transacción controlada al momento de iniciar la validación de disponibilidad y precios, complementándose de forma robusta con las restricciones de exclusión y unicidad a nivel de esquema en PostgreSQL/Prisma para rechazar cualquier intento concurrente remanente con una excepción de clave duplicada.

## Consecuencias
- **Positivas:** Seguridad transaccional y de negocio reforzada, previniendo condiciones de carrera complejas tanto a nivel lógico como físico en la base de datos.
- **Negativas:** Mayor complejidad en la gestión de transacciones explícitas dentro de los servicios del backend y riesgo potencial de contención si las transacciones se prolongan innecesariamente.
- **Deuda asumida:** Monitorear los tiempos de espera de las transacciones bloqueadas para evitar cuellos de botella bajo picos masivos de reservas.

## Requisitos relacionados
RN-02, Unidad III