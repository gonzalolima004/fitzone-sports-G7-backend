# ADR-002: Modelar el esquema relacional antes de implementar la persistencia

- **Estado:** Aceptado
- **Fecha:** 2026-09-01
- **Autor:** Marcos Ramón Caraballo y Angelina María Vialle
- **Sprint:** 1

## Contexto
FitZone Sports necesita gestionar información relacionada con usuarios, membresías, sedes, accesos, clases grupales, canchas deportivas, reservas, pagos y facturación. El sistema posee múltiples relaciones entre estas entidades y varias reglas de negocio dependen de la integridad de los datos. Por ejemplo, un usuario no puede encontrarse dentro de dos sedes simultáneamente y dos usuarios no pueden obtener una reserva exitosa para la misma cancha y horario. Además, el sistema debe permitir incorporar nuevas sedes sin modificar la estructura general de la aplicación. Por este motivo, resulta necesario definir previamente cómo se relacionarán las entidades y cuáles serán sus claves, restricciones y cardinalidades antes de comenzar la implementación física de la base de datos.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Diseñar la base de datos sobre la marcha durante la codificación** | Menor planeación inicial. | Aumenta drásticamente el riesgo de inconsistencias y cambios estructurales tardíos. | Descartado por elevar la deuda técnica y provocar retrabajo en los modelos. |
| **Utilizar NoSQL sin modelado relacional previo** | Flexibilidad inicial en los documentos JSON. | Incompatible con la necesidad de transacciones ACID y relaciones estrictas del negocio. | Descartado porque el dominio exige integridad referencial rigurosa. |
| **Modelado relacional previo formal** | Detecta errores de diseño temprano, facilita el entendimiento común y estandariza las migraciones. | Exige tiempo de análisis previo antes de programar. | **Seleccionada** por garantizar la consistencia y alinear el backend y frontend. |

## Decisión
Vamos a diseñar el modelo relacional de FitZone antes de implementar la base de datos. El modelo definirá las principales entidades, atributos, claves primarias, claves foráneas, relaciones y restricciones de integridad necesarias para representar el dominio. Una vez confirmado el modelo, será utilizado como base para la implementación del esquema de PostgreSQL mediante migraciones.

## Consecuencias
- **Positivas:** Permite detectar fallas conceptuales de dominio de manera temprana, unifica el criterio del equipo y reduce cambios estructurales futuros.
- **Negativas:** Requiere una inversión inicial de tiempo en diseño y análisis.
- **Deuda asumida:** Ajustar el modelo ante cambios imprevistos en los requisitos de negocio.

## Requisitos relacionados
RN-01, RN-02, Unidad II