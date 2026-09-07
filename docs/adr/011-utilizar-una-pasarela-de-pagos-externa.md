# ADR-011: Utilizar una pasarela de pagos externa

* **Estado:** Aceptado
* **Fecha:** 2026-09-01

## Contexto
FitZone comercializa membresías, clases grupales y reservas de canchas deportivas, lo que exige procesar pagos con tarjetas de crédito, débito y otros medios electrónicos. Procesar y almacenar datos bancarios o de tarjetas directamente en nuestros servidores obligaría a la plataforma a cumplir de manera estricta con los estándares de seguridad PCI DSS (Payment Card Industry Data Security Standard), lo cual implica costos elevados de auditoría, certificaciones de infraestructura y riesgos significativos ante posibles vulnerabilidades de seguridad.

## Decisión
Vamos a integrar una pasarela de pagos externa mediante su API/SDK y webhooks de notificación. El flujo de cobro se delegará al proveedor de pagos, el backend de FitZone únicamente recibirá notificaciones asíncronas para confirmar el estado de la transacción y actualizar las reservas o membresías correspondientes, sin almacenar números de tarjeta completos en nuestras bases de datos.

## Consecuencias
Positivas: transfiere la gestión de la infraestructura de seguridad de tarjetas y herramientas antifraude a un proveedor especializado; ofrece a los usuarios múltiples medios de pago locales e internacionales ya integrados.

Negativas: introduce dependencia directa con la disponibilidad del servicio del proveedor externo; implica pagar comisiones por cada transacción realizada a través de la pasarela; requiere implementar un manejo robusto de webhooks.

## Alternativas consideradas
(a) Desarrollar procesamiento propio de tarjetas y certificar PCI DSS: descartada por los altísimos costos de infraestructura, auditoría y el riesgo de seguridad que implica. (b) Operar exclusivamente mediante transferencias bancarias manuales: descartada porque degrada la experiencia de usuario y ralentiza la confirmación de reservas.

