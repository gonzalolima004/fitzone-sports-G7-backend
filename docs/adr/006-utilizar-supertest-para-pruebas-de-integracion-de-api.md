# ADR-006: Utilizar Supertest para pruebas de integración de la API

- **Estado:** Aceptado
- **Fecha:** 2026-09-01
- **Autor:** Marcos Ramón Caraballo y Angelina María Vialle
- **Sprint:** 1


## Contexto
FitZone necesita verificar que el backend funcione correctamente no solamente a nivel de funciones individuales, sino también en la interacción entre controladores, servicios, validaciones y persistencia. Existen funcionalidades críticas como la creación y cancelación de reservas, validación de membresías y procesamiento de pagos que deben verificarse mediante solicitudes HTTP similares a las que realizará el frontend. El proyecto contempla una etapa específica de testing e integración y requiere contar con pruebas automatizadas.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Pruebas unitarias exclusivas de servicios** | Ejecución extremadamente rápida. | No permiten comprobar el comportamiento real del transporte HTTP, rutas ni middlewares. | Insuficiente para garantizar la calidad de la pasarela de la API. |
| **Pruebas manuales con Postman / Insomnia** | Simplicidad visual inmediata. | No son automatizables ni integrables dentro de un pipeline de integración continua. | Inaceptable frente a los requisitos de testing automatizado de la cátedra. |
| **Supertest junto a Jest** | Permite realizar peticiones HTTP reales sobre la app de NestJS evaluando códigos, cabeceras y respuestas. | Requieren configuración de entorno de pruebas y son más lentas que las unitarias. | **Seleccionada** por su integración perfecta con NestJS y su capacidad de validar endpoints completos. |

## Decisión
Vamos a utilizar Supertest para realizar pruebas automatizadas de integración sobre la API HTTP del backend. Las pruebas enviarán solicitudes a los endpoints de NestJS y verificarán códigos de respuesta, headers y cuerpos de las respuestas, además del comportamiento esperado de los casos de uso. Supertest se utilizará junto con el framework de testing configurado para el proyecto.

## Consecuencias
- **Positivas:** Permite validar contratos de API, códigos de estado y respuestas reales de forma automatizada.
- **Negativas:** Mayor tiempo de ejecución en comparación con los tests unitarios puros.
- **Deuda asumida:** Mantener un entorno de base de datos aislado para la ejecución limpia de las pruebas de integración.

## Requisitos relacionados
Unidad V, RNF-01 a RNF-04
