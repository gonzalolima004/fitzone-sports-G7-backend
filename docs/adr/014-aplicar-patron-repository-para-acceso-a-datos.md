# ADR-014: Aplicar el patrón Repository para el acceso a datos

- **Estado:** Aceptado
- **Fecha:** 2026-09-01
- **Autor:** Marcos Ramón Caraballo y Angelina María Vialle
- **Sprint:** 1

## Contexto
El backend de FitZone requiere interactuar con la base de datos para realizar operaciones CRUD y consultas complejas. Mezclar la lógica de negocio directamente con las consultas del ORM (Prisma/PostgreSQL) en los servicios de la aplicación acopla fuertemente el dominio técnico del almacenamiento con la lógica de negocio. Esto dificulta la realización de pruebas unitarias y complica eventuales migraciones o cambios en las fuentes de datos.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Uso directo del ORM (Prisma Service) en los servicios** | Desarrollo inicial rápido sin necesidad de escribir capas de abstracción intermedias. | Acopla la lógica de negocio a la tecnología de base de datos y complica enormemente el mocking para tests unitarios. | Descartado por atar el dominio de la aplicación a detalles de persistencia de bajo nivel. |
| **Active Record Pattern** | Combina los datos y el comportamiento de acceso dentro de la misma entidad de dominio. | Promueve modelos anémicos o sobrecargados de lógica de base de datos en aplicaciones complejas. | Menos adecuado para la arquitectura modular limpia planteada en NestJS. |
| **Patrón Repository con Interfaces** | Abstrae completamente el mecanismo de persistencia mediante contratos claros consumidos por los servicios. | Requiere escribir código repetitivo adicional (interfaces y adaptadores de repositorio). | **Seleccionada** porque aísla el negocio y facilita la creación de pruebas unitarias sin depender de una base de datos real. |

## Decisión
Vamos a implementar el patrón Repository para encapsular el acceso a la capa de persistencia. Se definirán interfaces de repositorio para cada entidad principal del dominio, y sus implementaciones concretas utilizarán el ORM para consultar la base de datos. La capa de aplicación y servicios consumirá únicamente estas abstracciones.

## Consecuencias
- **Positivas:** Desacopla el negocio de la base de datos, centraliza las consultas y simplifica sustancialmente las pruebas unitarias mediante la sustitución de mocks.
- **Negativas:** Incrementa la cantidad de clases y archivos de código base.
- **Deuda asumida:** Evitar filtrar tipos u objetos específicos del ORM hacia las capas superiores de la aplicación a través de los repositorios.

## Requisitos relacionados
Unidad II, Unidad V
