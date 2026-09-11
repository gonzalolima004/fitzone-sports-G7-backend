# ADR-012: Aplicar el patrón Strategy para el cálculo de precios

* **Estado:** Aceptado
* **Fecha:** 2026-09-02

## Contexto
El sistema debe calcular el precio de las reservas y membresías considerando variables dinámicas: tipo de cliente, franja horaria. Codificar estas reglas mediante estructuras condicionales anidadas en un único servicio incrementa la complejidad y dificulta la mantenibilidad ante cambios frecuentes en la lógica comercial.

## Decisión
Se implementará el patrón de diseño Strategy para el cálculo algorítmico de precios. Se definirá una interfaz base que será implementada por clases concretas, cada una encapsulando una regla de negocio específica. Un componente Factory o el propio contexto de ejecución instanciará dinámicamente la estrategia correspondiente según los parámetros de la petición.

## Consecuencias
Positivas: se pueden integrar nuevos modelos de fijación de precios añadiendo clases sin modificar el código base de reservas; aumenta la cohesión del módulo financiero, permitiendo aislar y ejecutar pruebas unitarias exhaustivas sobre cada algoritmo de precios de forma independiente.

Negativas: incrementa la cantidad de clases e interfaces en la capa de dominio; exige desarrollar un mecanismo de selección en tiempo de ejecución responsable de orquestar la inyección de dependencias adecuada.

## Alternativas consideradas
(a) Lógica condicional monolítica: Descartada. Produce un alto acoplamiento y un código rígido, aumentando la deuda técnica frente a la evolución natural de las reglas de negocio.
