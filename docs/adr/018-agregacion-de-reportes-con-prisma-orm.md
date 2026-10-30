# ADR-018: Consultas de reportes con Prisma ORM y combinación por sede en memoria

* **Estado:** Aceptado
* **Fecha:** 2026-10-23

## Contexto
Los reportes consolidados del Gerente Central (`M6-reportes`: ingresos y ocupación por sede) estaban escritos en SQL nativo con `$queryRaw`. El ADR-005 establece Prisma como ORM del backend y la regla de la cátedra es no mezclar estilos de acceso a datos; además, el SQL nativo no es tipado ni lo verifica el compilador. La dificultad es que Prisma no agrupa por un campo de una tabla relacionada: un pago llega a una sede por dos caminos (membresía → usuario → sede y reserva de cancha → cancha → sede) y las reservas se vinculan con la sede a través de la cancha o de la clase.

## Decisión
Vamos a reescribir `ReportesRepository` con Prisma Client manteniendo la firma de sus métodos (patrón Repository, ADR-014):
- **Ingresos:** `pago.findMany` con filtros tipados (rango de fechas con límite final exclusivo, estado del pago sin distinguir mayúsculas, caminos por concepto y filtro por sede), seleccionando solo los campos necesarios. La suma por sede se hace en memoria con `Prisma.Decimal` para no perder precisión. Prisma resuelve las relaciones con una cantidad fija de consultas (una por nivel, con `IN`), sin importar la cantidad de pagos: no hay problema N+1.
- **Ocupación:** los tres conteos se resuelven en la base con `groupBy` (asistencias por `id_sede`; reservas confirmadas de canchas y clases por `id_cancha` e `id_clase`), que luego se traducen a su sede y se combinan por sede en memoria.
- Antes de migrar se escribieron pruebas de integración contra PostgreSQL temporal (PGlite) con datos conocidos; ambas implementaciones devuelven los mismos resultados.

## Consecuencias
Positivas: un único estilo de acceso a datos en el backend; consultas tipadas y verificadas por el compilador; el service y el controller no cambiaron, lo que muestra el beneficio del patrón Repository; los resultados quedan cubiertos por pruebas de integración sin mocks.

Negativas: el reporte de ingresos trae una fila por pago del período y suma en el servidor. Para reportes mensuales de una cadena de 25+ sedes el volumen es manejable, pero con millones de pagos por período convendría volver a agregar en la base (vista o consulta dedicada) o precalcular totales. La ocupación pasa de una consulta a hasta seis, ejecutadas en paralelo cuando es posible.

## Alternativas consideradas
(a) Mantener `$queryRaw`: descartada por mezclar estilos de acceso a datos y por no estar tipada. (b) Agrupar los pagos con dos `groupBy` (por `id_membresia` y por `id_cancha_reserva`) y luego traducir a sede: transfiere menos filas pero agrega consultas y código; puede adoptarse si el volumen crece. (c) Una vista SQL mapeada en Prisma: requiere una migración del esquema compartido, fuera del alcance de la tarea.
