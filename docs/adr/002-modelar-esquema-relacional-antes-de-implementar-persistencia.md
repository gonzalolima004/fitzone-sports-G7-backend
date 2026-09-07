# ADR-002: Modelar el esquema relacional antes de implementar la persistencia

* **Estado:** Aceptado
* **Fecha:** 2026-09-01

## Contexto
FitZone Sports necesita gestionar información relacionada con usuarios, membresías, sedes, accesos, clases grupales, canchas deportivas, reservas, pagos y facturación. El sistema posee múltiples relaciones entre estas entidades y varias reglas de negocio dependen de la integridad de los datos. Por ejemplo, un usuario no puede encontrarse dentro de dos sedes simultáneamente y dos usuarios no pueden obtener una reserva exitosa para la misma cancha y horario. Además, el sistema debe permitir incorporar nuevas sedes sin modificar la estructura general de la aplicación. Por este motivo, resulta necesario definir previamente cómo se relacionarán las entidades y cuáles serán sus claves, restricciones y cardinalidades antes de comenzar la implementación física de la base de datos.

## Decisión
Vamos a diseñar el modelo relacional de FitZone antes de implementar la base de datos. El modelo definirá las principales entidades, atributos, claves primarias, claves foráneas, relaciones y restricciones de integridad necesarias para representar el dominio. Una vez confirmado el modelo, será utilizado como base para la implementación del esquema de PostgreSQL mediante migraciones.

## Consecuencias
Positivas: permite detectar errores en las relaciones entre entidades antes de escribir código; facilita mantener la integridad de los datos; proporciona una referencia común para backend y frontend; reduce cambios estructurales posteriores en la base de datos; facilita representar reglas de negocio mediante restricciones y relaciones; permite que el equipo discuta el dominio antes de implementar las entidades del ORM.

Negativas: requiere tiempo inicial de análisis y diseño; el modelo puede necesitar modificaciones si aparecen nuevos requisitos; existe riesgo de sobre-diseñar el modelo antes de conocer completamente todos los casos de uso.

## Alternativas consideradas
(a) Diseñar la base de datos directamente durante la implementación: descartada porque aumenta el riesgo de inconsistencias y cambios estructurales posteriores. (b) Utilizar una base de datos NoSQL sin un modelo relacional previo: descartada porque FitZone posee numerosas relaciones y requiere garantías de integridad y consistencia.