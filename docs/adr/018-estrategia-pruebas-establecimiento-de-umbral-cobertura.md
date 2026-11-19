# ADR-018: Estrategia de pruebas y establecimiento de un umbral mínimo de cobertura del 80%

- **Estado:** Aceptado
- **Fecha:** 2026-11-16
- **Autor:** Marcos Ramón Caraballo y Angelina María Vialle
- **Sprint:** 8

## Contexto
Para garantizar la calidad del software exigida por la cátedra y evitar regresiones en los módulos críticos de *FitZone Sports* (como reservas, concurrencia y control de acceso), es indispensable definir una estrategia formal de pruebas automatizadas abarcando pruebas unitarias, de integración y End-to-End, respaldadas por un porcentaje mínimo de cobertura exigible.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Ausencia de pruebas automatizadas o testing informal** | Desarrollo inicial más rápido sin escribir código de test. | Imposible de validar objetivamente ante la rúbrica de la cátedra y altamente propenso a fallos ocultos. | Inaceptable frente a los criterios de admisibilidad y rúbrica de evaluación (Unidad V). |
| **Umbral de cobertura bajo (inferior al 50%)** | Menor esfuerzo en la redacción de scripts de prueba. | Deja sin verificar flujos críticos de negocio y lógica de concurrencia en reservas. | Insuficiente para cumplir los estándares de calidad profesional exigidos. |
| **Pirámide de pruebas completa con umbral estricto del 80%** | Asegura cobertura sólida en unidades, integración con Supertest y E2E con Cypress, bloqueando despliegues si no se alcanza la meta. | Exige disciplina constante del equipo para redactar tests junto con cada nueva funcionalidad. | **Seleccionada** por alinearse rigurosamente con los lineamientos de la cátedra y asegurar un producto confiable. |

## Decisión
Se adoptará una estrategia de pruebas basada en la pirámide de testing (Jest para unitarias e integración con Supertest, y Cypress para E2E), estableciendo un **umbral mínimo de cobertura de código del 80%**, el cual será verificado automáticamente en el pipeline de desarrollo.

## Consecuencias
- **Positivas:** Alto nivel de confianza en la estabilidad del sistema, detección temprana de errores y cumplimiento estricto de los requisitos de evaluación de la cátedra.
- **Negativas:** Incrementa el tiempo total de desarrollo debido al esfuerzo requerido para redactar y mantener la suite de pruebas.
- **Deuda asumida:** Mantener actualizados los mocks y escenarios de prueba ante modificaciones en los esquemas de datos.

## Requisitos relacionados
Unidad V, RNF-01 a RNF-04, Checklist de autoevaluación