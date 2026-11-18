# ADR-019: Estrategia de contenerización con Docker y despliegue Canary con procedimiento de reversión

- **Estado:** Aceptado
- **Fecha:** 2026-09-10
- **Autor:** Marcos Ramón y Angelina María Vialle
- **Sprint:** 3

## Contexto
El sistema debe garantizar una puesta en marcha reproducible y limpia en cualquier máquina mediante un único comando, tal como exigen los lineamientos de entrega. Adicionalmente, para entornos de producción o demostración avanzada, es necesario planificar una estrategia de despliegue seguro (Canary) que minimice riesgos ante nuevas versiones y cuente con un procedimiento claro de reversión (*rollback*).

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Instalación manual directa de dependencias en el sistema operativo** | Sin necesidad de comprender herramientas de virtualización de contenedores. | Propenso a discrepancias de entornos, versiones de Node.js y fallos en la puesta en marcha ("en mi máquina funciona"). | Invalida los criterios de admisibilidad del código definidos en los lineamientos. |
| **Despliegue monolítico tradicional de actualización directa (All-or-Nothing)** | Simplicidad operativa inicial sin enrutamiento avanzado de tráfico. | Expone a toda la base de usuarios a errores críticos de código de manera inmediata si la versión falla. | Alto riesgo operativo para una plataforma de 25+ sucursales. |
| **Contenerización Docker Compose + Estrategia de despliegue Canary con rollback** | Garantiza reproducibilidad exacta con `docker compose up --build` y permite liberar versiones de forma gradual evaluando estabilidad con opción de reversión rápida. | Requiere configurar servicios de red y balanceo adicionales para el tráfico progresivo. | **Seleccionada** por cumplir con los criterios obligatorios de admisibilidad y aportar robustez profesional de despliegue. |

## Decisión
Se utilizará **Docker y Docker Compose** para contenerizar la totalidad de la aplicación (backend, frontend y base de datos) asegurando el despliegue con un solo comando. Asimismo, para los entornos de actualización continua, se adoptará una estrategia de despliegue **Canary** (enrutando un porcentaje menor de tráfico a la nueva versión para supervisar métricas y errores) junto con un procedimiento automatizado de reversión inmediata al tag anterior en caso de fallos críticos.

## Consecuencias
- **Positivas:** Reproducibilidad garantizada en cualquier entorno limpio, despliegues seguros y controlados sin interrumpir la operación de la cadena de gimnasios.
- **Negativas:** Mayor complejidad en la configuración de redes Docker y scripts de orquestación para el tráfico Canary.
- **Deuda asumida:** Monitorear el consumo de recursos de los contenedores en ejecución simultánea durante las fases de prueba.

## Requisitos relacionados
Unidad V, RNF-04