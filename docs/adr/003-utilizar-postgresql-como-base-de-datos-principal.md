# ADR-003: Utilizar PostgreSQL como base de datos principal

- **Estado:** Aceptado
- **Fecha:** 2026-09-01
- **Autor:** Marcos Ramón Caraballo y Angelina María Vialle
- **Sprint:** 1

## Contexto
FitZone necesita almacenar información estructurada sobre usuarios, membresías, sedes, clases, canchas, reservas y pagos. El sistema necesita relaciones entre múltiples entidades, integridad referencial y transacciones que permitan mantener los datos consistentes ante operaciones concurrentes.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **MongoDB** | Esquema dinámico flexible para documentos JSON. | Carece de soporte transaccional relacional robusto y restricciones estrictas de integridad. | Descartado por no asegurar la consistencia transaccional requerida. |
| **MySQL** | Motor relacional popular y de fácil configuración. | Menor potencia nativa en características avanzadas de indexación y restricciones complejas en comparación con la plataforma elegida. | Se prefirió PostgreSQL por su perfecta integración con Supabase. |
| **PostgreSQL** | Soporte ACID robusto, restricciones nativas, índices avanzados y excelente rendimiento concurrente. | Requiere gestionar esquemas relacionales y migraciones estrictas. | **Seleccionada** por su madurez, potencia transaccional e integración con Supabase. |

## Decisión
Vamos a utilizar PostgreSQL como base de datos relacional de FitZone. PostgreSQL será responsable de almacenar los datos persistentes del sistema y proporcionará las capacidades de relaciones, restricciones, índices y transacciones necesarias para los módulos de la aplicación.

## Consecuencias
- **Positivas:** Garantía absoluta de transacciones ACID, soporte nativo de concurrencia y excelente rendimiento en consultas complejas.
- **Negativas:** Obliga a gestionar migraciones estructuradas ante cualquier cambio en el esquema.
- **Deuda asumida:** Optimizar índices a medida que crezca el volumen histórico de reservas y accesos.

## Requisitos relacionados
RNF-03, Unidad II