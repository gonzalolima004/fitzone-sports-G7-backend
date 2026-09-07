# ADR-009: Adoptar una arquitectura de Monolito Modular

* **Estado:** Aceptado
* **Fecha:** 2026-09-01

## Contexto
FitZone está compuesto por cinco módulos funcionales principales: usuarios y membresías, gimnasio y acceso, clases grupales, canchas deportivas y pagos/facturación. Aunque existen diferentes áreas funcionales, todas forman parte de un mismo sistema y comparten información y operaciones transaccionales. El proyecto tiene un tiempo limitado de implementación. Por lo tanto, introducir múltiples servicios independientes implicaría costos adicionales de infraestructura, comunicación, despliegue y monitoreo.

## Decisión
Vamos a implementar FitZone como un monolito modular utilizando NestJS. Cada dominio funcional estará organizado como un módulo independiente dentro del backend, manteniendo responsabilidades y dependencias claras entre ellos. Los módulos compartirán el mismo proceso de ejecución y la misma base de datos PostgreSQL, pero se buscará mantener el desacoplamiento lógico entre los dominios.

## Consecuencias
Positivas: simplifica el desarrollo y despliegue del sistema; reduce la complejidad de infraestructura; facilita las transacciones que involucran múltiples operaciones; permite compartir la misma base de datos de manera directa; facilita avanzar rápidamente durante el proyecto; los módulos pueden mantenerse separados lógicamente; en el futuro, un módulo que requiera escalar independientemente podría extraerse como servicio.

Negativas: un problema en el proceso principal puede afectar a diferentes módulos; el despliegue se realiza sobre el sistema completo; los módulos comparten recursos de ejecución; a medida que el sistema crezca, será necesario controlar cuidadosamente las dependencias entre módulos; una futura migración hacia microservicios requeriría trabajo de separación.

## Alternativas consideradas
(a) Arquitectura de microservicios: descartada porque aumenta la complejidad operacional y de comunicación entre servicios. Además, las reservas requieren transacciones y consistencia fuertes. (b) Monolito sin modularización: descartado porque dificultaría mantener separadas las responsabilidades de los cinco módulos funcionales. (c) Serverless: descartado porque se consideró que el dominio requiere una estructura de aplicación persistente y transacciones coordinadas entre diferentes operaciones.

