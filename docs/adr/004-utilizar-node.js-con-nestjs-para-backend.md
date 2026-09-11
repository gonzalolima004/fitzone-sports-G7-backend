# ADR-004: Utilizar Node.js con NestJS para el backend

* **Estado:** Aceptado
* **Fecha:** 2026-09-01

## Contexto
FitZone requiere un backend que exponga una API para múltiples clientes, incluyendo una aplicación web administrativa y una aplicación móvil. El backend debe implementar los módulos de usuarios y membresías, acceso, clases, canchas, pagos y facturación. También debe permitir organizar el código de manera modular y aplicar patrones de diseño. El equipo necesita además una tecnología que permita avanzar rápidamente debido al tamaño y duración limitada del proyecto.

## Decisión
Vamos a utilizar Node.js como entorno de ejecución y NestJS como framework para desarrollar el backend de FitZone. El backend expondrá una API REST y organizará las funcionalidades mediante módulos independientes, utilizando las capacidades de inyección de dependencias y estructuración proporcionadas por NestJS.

## Consecuencias
Positivas: nestJS proporciona una estructura clara para organizar módulos, controladores y servicios; cuenta con inyección de dependencias integrada; posee un ecosistema amplio de librerías para APIs, testing y autenticación; facilita el desarrollo de una API REST.

Negativas: el equipo debe familiarizarse con las convenciones y arquitectura de NestJS;agrega una capa de abstracción respecto de Node.js puro; el ecosistema de Node.js contiene una gran cantidad de dependencias que deben mantenerse actualizadas.


## Alternativas consideradas
(a) Node.js con Express: descartado porque proporciona menos estructura arquitectónica de manera predeterminada y requiere definir más convenciones del proyecto. (b) Java con Spring Boot: descartado para este proyecto debido a que implicaría utilizar un stack diferente al elegido y se consideró que NestJS permite una mayor velocidad de desarrollo para el equipo, debido a que no todo el equipo conoce Java.