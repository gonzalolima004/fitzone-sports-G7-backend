# ADR-012: Aplicar el patrón Strategy para el cálculo de precios

- **Estado:** Aceptado
- **Fecha:** 2026-09-02
- **Autor:** Marcos Ramón Caraballo y Angelina María Vialle
- **Sprint:** 1

## Contexto
El sistema debe calcular el precio de las reservas y membresías considerando variables dinámicas: tipo de cliente, franja horaria. Codificar estas reglas mediante estructuras condicionales anidadas en un único servicio incrementa la complejidad y dificulta la mantenibilidad ante cambios frecuentes en la lógica comercial.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Lógica condicional monolítica (`if-else` / `switch` anidados)** | Implementación inicial rápida y directa sin abstracciones adicionales. | Produce un acoplamiento alto, baja cohesión y código extremadamente rígido propenso a errores[cite: 37]. | Descartado por generar alta deuda técnica frente a la evolución de las reglas comerciales de la cadena[cite: 37]. |
| **Motor de reglas externo basado en base de datos (Rules Engine)** | Permite modificar reglas de precios al vuelo mediante metadatos sin compilar código. | Sobreingeniería innecesaria y alta complejidad de despliegue para la escala del sistema académico. | Demasiado complejo y difícil de auditar dentro de los plazos del proyecto. |
| **Patrón de diseño Strategy** | Encapsula cada algoritmo de cálculo en clases independientes con una interfaz común, facilitando su extensión[cite: 37]. | Incrementa la cantidad de clases e interfaces en la capa de dominio[cite: 37]. | **Seleccionada** porque permite aislar las reglas de negocio financieras y realizarles pruebas unitarias independientes de forma limpia[cite: 37]. |

## Decisión
Se implementará el patrón de diseño Strategy para el cálculo algorítmico de precios. Se definirá una interfaz base que será implementada por clases concretas, cada una encapsulando una regla de negocio específica. Un componente Factory o el propio contexto de ejecución instanciará dinámicamente la estrategia correspondiente según los parámetros de la petición.

## Consecuencias
- **Positivas:** Permite incorporar nuevos modelos de fijación de precios creando clases nuevas sin alterar el código base de reservas, incrementando la cohesión del módulo.
- **Negativas:** Aumenta el número de archivos e interfaces a gestionar en el dominio.
- **Deuda asumida:** Mantener documentada la factoría responsable de seleccionar la estrategia adecuada en tiempo de ejecución.

## Requisitos relacionados
RF-11, RN-03, Unidad III