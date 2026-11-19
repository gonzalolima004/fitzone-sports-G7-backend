# ADR-011: Utilizar una pasarela de pagos externa

- **Estado:** Aceptado
- **Fecha:** 2026-09-01
- **Autor:** Marcos Ramón Caraballo y Angelina María Vialle
- **Sprint:** 1

## Contexto
FitZone comercializa membresías, clases grupales y reservas de canchas deportivas, lo que exige procesar pagos con tarjetas de crédito, débito y otros medios electrónicos. Procesar y almacenar datos bancarios o de tarjetas directamente en nuestros servidores obligaría a la plataforma a cumplir de manera estricta con los estándares de seguridad PCI DSS (Payment Card Industry Data Security Standard), lo cual implica costos elevados de auditoría, certificaciones de infraestructura y riesgos significativos ante posibles vulnerabilidades de seguridad.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Desarrollo de procesamiento propio y certificación PCI DSS** | Control total de la pasarela de pagos. | Costos prohibitivos de auditoría, infraestructura y altísimo riesgo de seguridad ante vulnerabilidades. | Inviable para el alcance y presupuesto del proyecto académico. |
| **Transferencias bancarias manuales** | Cero dependencia de servicios de pasarela. | Degrada severamente la experiencia de usuario y enlentece la confirmación de turnos. | Descartado por ser un proceso lento y poco automatizable. |
| **Pasarela de pagos externa con Webhooks** | Delega la seguridad y tokenización al proveedor, integrándose mediante notificaciones asíncronas. | Dependencia de la disponibilidad del servicio externo y comisiones por transacción. | **Seleccionada** por seguridad, velocidad de integración y cumplimiento normativo. |

## Decisión
Vamos a integrar una pasarela de pagos externa mediante su API/SDK y webhooks de notificación. El flujo de cobro se delegará al proveedor de pagos, el backend de FitZone únicamente recibirá notificaciones asíncronas para confirmar el estado de la transacción y actualizar las reservas o membresías correspondientes, sin almacenar números de tarjeta completos en nuestras bases de datos.

## Consecuencias
- **Positivas:** Exime a la plataforma de almacenar datos bancarios sensibles y ofrece métodos de pago locales estandarizados.
- **Negativas:** Dependencia operativa de la disponibilidad del proveedor externo y necesidad de manejar webhooks robustos.
- **Deuda asumida:** Implementar mecanismos de reintentos (*retries*) para el procesamiento de notificaciones de pago perdidas.

## Requisitos relacionados
RNF-02, Unidad III