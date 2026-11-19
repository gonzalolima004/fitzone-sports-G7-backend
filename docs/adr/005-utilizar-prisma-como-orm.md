# ADR-005: Utilizar Prisma como ORM

- **Estado:** Aceptado
- **Fecha:** 2026-09-01
- **Autor:** Marcos Ramón Caraballo y Angelina María Vialle
- **Sprint:** 1

## Contexto
El backend de FitZone necesita acceder a PostgreSQL desde diferentes módulos de la aplicación. La aplicación contiene numerosas entidades y relaciones, por lo que realizar manualmente todas las consultas SQL aumentaría la cantidad de código de acceso a datos y podría generar inconsistencias entre módulos. Además, el esquema de base de datos debe evolucionar durante el desarrollo y los cambios deben poder controlarse mediante migraciones.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **SQL Nativo / Query Builder (ej. Knex)** | Control absoluto de cada sentencia SQL ejecutada. | Mayor cantidad de código repetitivo y ausencia de tipado automático estricto de entidades. | Descartado por incrementar el esfuerzo de desarrollo y mantenimiento de consultas. |
| **TypeORM** | ORM tradicional basado en decoradores de clases en TypeScript. | Experiencia de migraciones y tipado menos fluida en comparación con alternativas modernas. | Se prefirió Prisma por su DX superior y generación automática de tipos. |
| **Prisma ORM** | Esquema declarativo limpio, tipado estricto excelente y sistema de migraciones robusto. | Acoplamiento parcial al motor de Prisma. | **Seleccionada** por su integración nativa con TypeScript y prevención de errores de consulta. |


## Decisión
Vamos a utilizar Prisma como ORM para gestionar el acceso del backend a PostgreSQL. El esquema de Prisma será utilizado para representar las entidades persistentes y sus relaciones, mientras que Prisma Client será utilizado desde la capa de acceso a datos. Las operaciones que requieran un control específico sobre transacciones o consultas complejas podrán utilizar las capacidades correspondientes de Prisma.

## Consecuencias
- **Positivas:** Reducción drástica de código SQL manual, tipado estricto de extremo a extremo y control fluido de migraciones.
- **Negativas:** Dependencia del cliente de Prisma para operaciones complejas de base de datos.
- **Deuda asumida:** Gestionar adecuadamente consultas raw en casos donde el ORM presente limitaciones de rendimiento.

## Requisitos relacionados
Unidad II, RNF-03