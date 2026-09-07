# ADR-006: Utilizar Supertest para pruebas de integración de la API

* **Estado:** Aceptado
* **Fecha:** 2026-09-01

## Contexto
FitZone necesita verificar que el backend funcione correctamente no solamente a nivel de funciones individuales, sino también en la interacción entre controladores, servicios, validaciones y persistencia. Existen funcionalidades críticas como la creación y cancelación de reservas, validación de membresías y procesamiento de pagos que deben verificarse mediante solicitudes HTTP similares a las que realizará el frontend. El proyecto contempla una etapa específica de testing e integración y requiere contar con pruebas automatizadas.

## Decisión
Vamos a utilizar Supertest para realizar pruebas automatizadas de integración sobre la API HTTP del backend. Las pruebas enviarán solicitudes a los endpoints de NestJS y verificarán códigos de respuesta, headers y cuerpos de las respuestas, además del comportamiento esperado de los casos de uso. Supertest se utilizará junto con el framework de testing configurado para el proyecto.

## Consecuencias
Positivas: permite probar los endpoints de la API de manera cercana a su utilización real; facilita verificar rutas, parámetros, cuerpos y códigos HTTP; permite detectar problemas en la integración entre diferentes componentes del backend; se integra bien con aplicaciones Node.js y NestJS.

Negativas: las pruebas de integración son más lentas que las pruebas unitarias; requieren configurar correctamente el entorno de prueba; las pruebas que utilizan persistencia pueden necesitar una base de datos de testing; aislada; mantener muchos tests de endpoints puede aumentar el costo de mantenimiento.

## Alternativas consideradas
(a) Probar únicamente servicios mediante tests unitarios: descartado porque no permite verificar completamente el comportamiento de la API HTTP. (b) Realizar pruebas manuales mediante Postman: descartado como estrategia principal porque no proporciona el mismo nivel de automatización. (c) Utilizar otra herramienta de testing HTTP: descartada porque Supertest se integra directamente con el ecosistema Node.js/NestJS elegido.

