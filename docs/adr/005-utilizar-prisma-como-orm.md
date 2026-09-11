# ADR-005: Utilizar Prisma como ORM

* **Estado:** Aceptado
* **Fecha:** 2026-09-01

## Contexto
El backend de FitZone necesita acceder a PostgreSQL desde diferentes módulos de la aplicación. La aplicación contiene numerosas entidades y relaciones, por lo que realizar manualmente todas las consultas SQL aumentaría la cantidad de código de acceso a datos y podría generar inconsistencias entre módulos. Además, el esquema de base de datos debe evolucionar durante el desarrollo y los cambios deben poder controlarse mediante migraciones.


## Decisión
Vamos a utilizar Prisma como ORM para gestionar el acceso del backend a PostgreSQL. El esquema de Prisma será utilizado para representar las entidades persistentes y sus relaciones, mientras que Prisma Client será utilizado desde la capa de acceso a datos. Las operaciones que requieran un control específico sobre transacciones o consultas complejas podrán utilizar las capacidades correspondientes de Prisma.

## Consecuencias
Positivas: reduce la cantidad de SQL escrito manualmente. Por lo tanto reduce ciertos errores comunes al construir consultas; proporciona tipado estático para las operaciones de acceso a datos; facilita trabajar con relaciones entre entidades;
permite gestionar migraciones del esquema; se integra naturalmente con TypeScript.

Negativas: el proyecto queda parcialmente acoplado a Prisma; el equipo debe conocer el funcionamiento del ORM además de SQL; algunas consultas complejas pueden requerir SQL específico; cambiar posteriormente de ORM puede requerir modificaciones en la capa de persistencia.

## Alternativas consideradas
(a) TypeORM: descartado porque se prefirió Prisma por su experiencia de desarrollo y generación de un cliente fuertemente tipado. (b) SQL directo: descartado porque aumentaría el código de persistencia y dificultaría mantener una interfaz consistente de acceso a datos
