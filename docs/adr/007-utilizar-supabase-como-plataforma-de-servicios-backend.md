# ADR-007: Utilización de Supabase como plataforma de servicios backend

- **Estado:** Aceptado
- **Fecha:** 2026-09-01
- **Autor:** Marcos Ramón Caraballo y Angelina María Vialle
- **Sprint:** 1

## Contexto
FitZone necesita una infraestructura que permita disponer de una base de datos PostgreSQL y servicios complementarios sin que el equipo tenga que administrar manualmente toda la infraestructura de servidores. El proyecto tiene un tiempo de desarrollo limitado. Por lo tanto, se busca reducir el trabajo operativo y concentrar los esfuerzos en la implementación de la lógica de negocio. La plataforma también debe integrarse con el backend desarrollado con Node.js/NestJS.

## Alternativa consideradas 
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Administrar PostgreSQL en un servidor VPS propio** | Control total y absoluto de la infraestructura y configuración de la base de datos. | Alto costo operativo en tiempo y complejidad de mantenimiento para el equipo. | Descartado por el esfuerzo administrativo que desvía el foco del desarrollo del negocio. |
| **Otro proveedor Cloud administrado (ej. AWS RDS / Google Cloud SQL)** | Servicios empresariales altamente escalables y de gran madurez en la industria. | Mayor complejidad de configuración y costos elevados o modelos de capas gratuitas más restrictivos. | Se buscaba una integración nativa más rápida con el stack de desarrollo inicial. |
| **Supabase (Backend-as-a-Service / BaaS)** | Base de datos PostgreSQL administrada, servicios de autenticación y almacenamiento integrados. | Genera dependencia parcial de un proveedor externo y de sus límites de servicio. | **Seleccionada** por su excelente integración con PostgreSQL, facilidad de puesta en marcha y reducción de tiempos. |

## Decisión
Vamos a utilizar Supabase como plataforma administrada para los servicios de backend que requiera FitZone, utilizando principalmente PostgreSQL y los servicios de autenticación asociados. El backend NestJS será responsable de la lógica de negocio y utilizará los servicios de Supabase cuando corresponda.

## Consecuencias
- **Positivas:** Reduce sustancialmente la infraestructura que el equipo debe administrar, agiliza la configuración inicial y acelera la disponibilidad del entorno de desarrollo.
- **Negativas:** Introduce dependencia de un proveedor externo y su disponibilidad operativa.
- **Deuda asumida:** Documentar las limitaciones de la capa gratuita y los planes de contingencia ante caídas del proveedor.

## Requisitos relacionados
Unidad II, RNF-03

