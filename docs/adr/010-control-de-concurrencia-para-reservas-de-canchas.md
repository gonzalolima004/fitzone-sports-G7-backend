# ADR-010: Control de concurrencia para reservas de canchas

* **Estado:** Aceptado
* **Fecha:** 2026-09-01

## Contexto
FitZone permite a los usuarios realizar reservas de canchas deportivas para días y rangos horarios específicos. Dado que múltiples usuarios pueden intentar reservar la misma cancha en el mismo horario de forma simultánea, existe el riesgo de que ocurran condiciones de carrera, lo que derivaría en reservas duplicadas para un mismo espacio. Para garantizar la consistencia en la disponibilidad de las canchas, es fundamental definir un mecanismo en el backend que impida que dos transacciones concurrentes confirmen la reserva de la misma cancha para el mismo intervalo de tiempo.

## Decisión
Vamos a controlar la concurrencia a nivel de base de datos aplicando restricciones (constraints) en el esquema de Prisma. De esta forma, delegamos la garantía de atomicidad e integridad relacional directamente al motor de PostgreSQL de Supabase. Cuando dos solicitudes intenten insertar un registro para la misma cancha y hora de inicio, la base de datos rechazará la segunda transacción lanzando una excepción de clave duplicada, la cual será capturada por NestJS para retornar un error HTTP al cliente.

## Consecuencias
Positivas: garantía absoluta de consistencia: PostgreSQL previene la sobreventa de forma nativa a nivel de almacenamiento; bajo impacto en arquitectura y complejidad: no requiere agregar infraestructura adicional ni servicios externos; alto rendimiento: La restricción crea un índice B-Tree implícito en PostgreSQL, lo que agiliza significativamente las consultas de disponibilidad de canchas.

Negativas: manejo explícito de excepciones: requiere que el backend en NestJS capture explícitamente los errores de restricción violada de Prisma para traducir las fallas en respuestas HTTP legibles para el cliente; inflexibilidad si los rangos son variables: si en el futuro se permiten reservas con duraciones dinámicas o superpuestas que no coincidan exactamente en los campos de la tabla, la restricción simple no será suficiente y se deberá migrar a una restricción más compleja.

## Alternativas consideradas
(a) Bloqueo pesimista en aplicación: Descartada porque mantener transacciones largas abiertas bloqueando filas en PostgreSQL reduce la escalabilidad de las conexiones en Supabase bajo alta concurrencia. (b) Validación únicamente por software en el Service de NestJS: Descartada porque una simple consulta previa de verificación en el backend no previene la condición de carrera si dos peticiones entran exactamente al mismo tiempo.

