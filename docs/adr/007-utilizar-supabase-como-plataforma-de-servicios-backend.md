# ADR-007: Utilizar Supabase como plataforma de servicios backend

* **Estado:** Aceptado
* **Fecha:** 2026-09-01

## Contexto
FitZone necesita una infraestructura que permita disponer de una base de datos PostgreSQL y servicios complementarios sin que el equipo tenga que administrar manualmente toda la infraestructura de servidores. El proyecto tiene un tiempo de desarrollo limitado. Por lo tanto, se busca reducir el trabajo operativo y concentrar los esfuerzos en la implementación de la lógica de negocio. La plataforma también debe integrarse con el backend desarrollado con Node.js/NestJS.

## Decisión
Vamos a utilizar Supabase como plataforma administrada para los servicios de backend que requiera FitZone, utilizando principalmente PostgreSQL y los servicios de autenticación asociados. El backend NestJS será responsable de la lógica de negocio y utilizará los servicios de Supabase cuando corresponda.

## Consecuencias
Positivas: reduce la cantidad de infraestructura que el equipo debe administrar; facilita el desarrollo y configuración inicial del proyecto; permite centralizar determinados servicios de infraestructura; reduce el tiempo necesario para poner en funcionamiento el entorno; se integra con las tecnologías seleccionadas para el backend.

Negativas: genera dependencia de un proveedor externo; algunas características pueden quedar condicionadas por las capacidades y límites de Supabase; migrar posteriormente a infraestructura propia puede requerir trabajo adicional; la disponibilidad del sistema depende parcialmente de la disponibilidad de los servicios externos utilizados.


## Alternativas consideradas
(a)  Administrar PostgreSQL directamente en un servidor propio: descartado por el costo operativo y la complejidad adicional para el equipo. (b) Utilizar otro proveedor cloud administrado: considerado, pero se seleccionó Supabase por su integración con PostgreSQL y los servicios que ofrece para el proyecto.


