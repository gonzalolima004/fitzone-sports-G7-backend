# ADR-014: Aplicar el patrón Repository para el acceso a datos

* **Estado:** Aceptado
* **Fecha:** 2026-09-01

## Contexto
El backend de FitZone requiere interactuar con la base de datos para realizar operaciones CRUD y consultas complejas. Mezclar la lógica de negocio directamente con las consultas del ORM (Prisma/PostgreSQL) en los servicios de la aplicación acopla fuertemente el dominio técnico del almacenamiento con la lógica de negocio. Esto dificulta la realización de pruebas unitarias y complica eventuales migraciones o cambios en las fuentes de datos.

## Decisión
Vamos a implementar el patrón Repository para encapsular el acceso a la capa de persistencia. Se definirán interfaces de repositorio para cada entidad principal del dominio, y sus implementaciones concretas utilizarán el ORM para consultar la base de datos. La capa de aplicación y servicios consumirá únicamente estas abstracciones.

## Consecuencias
Positivas: desacopla la lógica de negocio del framework de persistencia o del ORM utilizado; facilita la creación de pruebas unitarias sin necesidad de conectarse a la base de datos; centraliza las consultas a la base de datos en clases dedicadas, promoviendo la reutilización de código de acceso a datos.

Negativas: agrega una capa de abstracción adicional y más código base para cada entidad; puede limitar el uso directo de funcionalidades avanzadas específicas del ORM si no se exponen adecuadamente en la interfaz del repositorio.

## Alternativas consideradas
(a) Acceder directamente al ORM desde los servicios de aplicación: descartada porque acopla la lógica de negocio a la base de datos y dificulta el testing unitario aislado.
