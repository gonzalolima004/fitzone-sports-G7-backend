# ADR-004: Utilizar Node.js con NestJS para el backend

- **Estado:** Aceptado
- **Fecha:** 2026-09-01
- **Autor:** Marcos Ramón Caraballo y Angelina María Vialle
- **Sprint:** 1

## Contexto
FitZone requiere un backend que exponga una API para múltiples clientes, incluyendo una aplicación web administrativa y una aplicación móvil. El backend debe implementar los módulos de usuarios y membresías, acceso, clases, canchas, pagos y facturación. También debe permitir organizar el código de manera modular y aplicar patrones de diseño. El equipo necesita además una tecnología que permita avanzar rápidamente debido al tamaño y duración limitada del proyecto.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Node.js con Express** | Minimalista y de aprendizaje rápido. | Carece de una arquitectura estandarizada por defecto, obligando a definir convenciones desde cero. | Descartado por la falta de estructura modular integrada. |
| **Java con Spring Boot** | Altamente empresarial, robusto y tipado de fábrica. | El equipo no poseía experiencia homogénea en Java, lo que retrasaría los plazos del proyecto. | Descartado para priorizar la velocidad de entrega del equipo. |
| **Node.js con NestJS** | Arquitectura modular estricta, inyección de dependencias nativa y gran ecosistema para APIs. | Curva de aprendizaje inicial para asimilar los decoradores y conceptos del framework. | **Seleccionada** por su alta estructuración, velocidad de desarrollo y robustez modular. |

## Decisión
Vamos a utilizar Node.js como entorno de ejecución y NestJS como framework para desarrollar el backend de FitZone. El backend expondrá una API REST y organizará las funcionalidades mediante módulos independientes, utilizando las capacidades de inyección de dependencias y estructuración proporcionadas por NestJS.

## Consecuencias
- **Positivas:** Código altamente organizado, modular y fácil de mantener, con soporte integrado para pruebas y validaciones.
- **Negativas:** Añade una capa de abstracción sobre Node.js puro y requiere asimilar las convenciones del framework.
- **Deuda asumida:** Mantener actualizadas las dependencias del ecosistema NestJS.

## Requisitos relacionados
Unidad II