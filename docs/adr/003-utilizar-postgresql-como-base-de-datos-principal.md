# ADR-003: Utilizar PostgreSQL como base de datos principal

* **Estado:** Aceptado
* **Fecha:** 2026-09-01

## Contexto
FitZone necesita almacenar información estructurada sobre usuarios, membresías, sedes, clases, canchas, reservas y pagos. El sistema necesita relaciones entre múltiples entidades, integridad referencial y transacciones que permitan mantener los datos consistentes ante operaciones concurrentes.

## Decisión
Vamos a utilizar PostgreSQL como base de datos relacional de FitZone. PostgreSQL será responsable de almacenar los datos persistentes del sistema y proporcionará las capacidades de relaciones, restricciones, índices y transacciones necesarias para los módulos de la aplicación.

## Consecuencias
Positivas: proporciona soporte robusto para transacciones ACID; permite definir relaciones y restricciones de integridad; es adecuado para información altamente estructurada; permite utilizar índices para optimizar consultas de disponibilidad facilita el manejo de concurrencia necesario para las reservas; es una tecnología madura y ampliamente utilizada; se integra con Prisma y Supabase.


Negativas: requiere diseñar y mantener un esquema relacional; algunas modificaciones del esquema requieren migraciones; escalar horizontalmente puede ser más complejo que simplemente agregar instancias de una aplicación stateless; el equipo debe conocer conceptos de bases de datos relacionales y SQL.

## Alternativas consideradas
(a) MongoDB: descartado porque el dominio posee numerosas relaciones y requiere integridad referencial y transacciones consistentes.(b) MySQL: considerado como alternativa relacional, pero se seleccionó PostgreSQL por su conjunto de funcionalidades, integración con el ecosistema elegido y disponibilidad mediante Supabase.