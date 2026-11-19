# ADR-010: Control de concurrencia para reservas de canchas

- **Estado:** Reemplazado por ADR-020
- **Fecha:** 2026-09-01
- **Autor:** Marcos Ramón Caraballo y Angelina María Vialle
- **Sprint:** 1

## Contexto
FitZone permite a los usuarios realizar reservas de canchas deportivas para días y rangos horarios específicos. Dado que múltiples usuarios pueden intentar reservar la misma cancha en el mismo horario de forma simultánea, existe el riesgo de que ocurran condiciones de carrera, lo que derivaría en reservas duplicadas para un mismo espacio. Para garantizar la consistencia en la disponibilidad de las canchas, es fundamental definir un mecanismo en el backend que impida que dos transacciones concurrentes confirmen la reserva de la misma cancha para el mismo intervalo de tiempo.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Bloqueo pesimista en aplicación** | Control explícito desde la capa de servicios. | Mantiene conexiones y filas bloqueadas largo tiempo, degradando el rendimiento bajo alta concurrencia. | Descartado por afectar negativamente la escalabilidad en Supabase. |
| **Validación lógica únicamente en el Service de NestJS** | Simple de programar con condicionales comunes. | No previene condiciones de carrera exactas si dos peticiones ingresan en el mismo milisegundo. | Insuficiente para garantizar la regla de no sobreventa (RN-02). |
| **Restricciones de unicidad / exclusión a nivel de base de datos** | Garantía atómica nativa en PostgreSQL ante inserciones concurrentes idénticas. | Requiere capturar excepciones específicas en el backend para traducirlas a errores HTTP. | **Seleccionada** por ofrecer seguridad transaccional absoluta y rendimiento óptimo. |

## Decisión
Vamos a controlar la concurrencia a nivel de base de datos aplicando restricciones (constraints) en el esquema de Prisma. De esta forma, delegamos la garantía de atomicidad e integridad relacional directamente al motor de PostgreSQL de Supabase. Cuando dos solicitudes intenten insertar un registro para la misma cancha y hora de inicio, la base de datos rechazará la segunda transacción lanzando una excepción de clave duplicada, la cual será capturada por NestJS para retornar un error HTTP al cliente.

## Consecuencias
- **Positivas:** Garantía absoluta de consistencia contra condiciones de carrera y alto rendimiento mediante índices B-Tree nativos.
- **Negativas:** Exige manejo explígeno de excepciones de base de datos en el backend para informar adecuadamente al cliente.
- **Deuda asumida:** Adaptar la restricción si en el futuro se permiten duraciones de reserva flexibles o superpuestas.

## Requisitos relacionados
RN-02, Unidad III