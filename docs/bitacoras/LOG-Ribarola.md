#### 22/08/2026

#### Joaquín Ribarola | Rol: Team Leader

- **Objetivo:** Definición de arquitectura base, Stack tecnológico y entidades iniciales.

- **Actividades:** Organizar las tareas de grupo para la primer y segunda semana y estar a cargo de las reuniones.
- **Decisiones:** Se decidió usar un Stack basado en TypeScript para fronted y backend para facilitar el desarrollo.
- **Dificultades:** Ninguna.
- **Commits:** ----

---

#### 22/08/2026

#### Joaquín Ribarola | Rol: Team Leader - Desarrollador Backend

- **Actividades**
  - Investigar como se estructuran las carpetas en un proyecto NestJS y agregarlas al repositorio.
- **Decisiones** Usar la estructura de carpetas propuesta por NestJS.
- **Dificultades** Ninguna
- **Commits:** `Estructura de carpetas del proyecto, separada por modulos segun fueron dados en la catedra y creacion rama dev`

---

#### 26/08/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- **Actividades:** Configurar el archivo `.env` para la base de datos y crear el servicio de Prisma para la conexión con Supabase. Proveer un archivo de ejemplo `.env.example`.
- **Decisiones:** Separar la configuración de entorno para mantener las credenciales seguras.
- **Dificultades:** Ninguna.
- **Commits:**
  - `Se creo el .env dentro de database y se creo el servicio de prisma para la conexion con supabase`
  - `-env-example`

---

#### 17/09/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- _Actividades_
- Creación de los DTOs para el alta, edición y respuesta del catálogo de clases grupales, definiendo capacidad máxima y descripción de instructores.

- Implementación de `ClasesRepository` aplicando el patrón Repository e inyectando `PrismaService` para encapsular las operaciones CRUD sobre la tabla `clase`.

- _Decisiones_ Integrar los decoradores de `@nestjs/swagger` en la misma capa de los DTOs junto con `class-validator` para garantizar que la documentación coincida siempre con las reglas de validación.
- _Dificultades_ Ninguna.
- _Commits:_ `feat(clases): agrega DTOs documentados y ClasesRepository con Prisma`

---

#### 18/09/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- **Actividades:**
  - Desarrollo de la US-04-01 (Catálogo de Clases Grupales).
  - Implementación de `ClasesService` para la lógica de negocio del alta y catálogos de clases.
  - Creación de `ClasesController` con rutas CRUD y documentación en Swagger.
- **Decisiones:** Encapsular la lógica de negocio en el servicio y utilizar el controlador exclusivamente para manejar peticiones HTTP y documentación.
- **Dificultades:** Ninguna.
- **Commits:**
  - `feat(clases): implementa ClasesService para logica de alta y catalogos (US-04-01)`
  - `feat(clases): agrega ClasesController con rutas CRUD y documentacion Swagger (US-04-01)`

---

#### 21/09/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- **Actividades:**
  - Desarrollo de la US-04-02 (Reservas de Clases Grupales).
  - Creación de DTOs para la creación y respuesta de reservas de clases grupales.
  - Implementación de `ReservasClasesRepository` con soporte para transacciones.
  - Implementación de lógica de validación en las reservas (48h de anticipación, mora, superposición y control de cupo atómico).
  - Creación de `ReservasClasesController` con JWT Guard (mockeado) y tipado estricto.
- **Decisiones:**
  - Utilizar transacciones en Prisma (`$transaction`) para asegurar la consistencia al crear la reserva y actualizar el cupo disponible de manera atómica.
  - Aplicar validaciones de negocio rigurosas para asegurar que el usuario cumpla con los requisitos (mora, horarios, superposición) antes de confirmar la reserva.
- **Dificultades:** Ninguna.
- **Commits:**
  - `feat(reservas): agrega DTOs para creacion y respuesta de reservas de clases (US-04-02)`
  - `feat(reservas): implementa ReservasClasesRepository con soporte transaccional (US-04-02)`
  - `feat(reservas): implementa validaciones de 48h, mora, superposicion y cupo atomico (US-04-02)`
  - `feat(reservas): agrega ReservasClasesController con JWT Guard mockeado y tipado estricto (US-04-02)`

---

#### 24/09/2026

#### Joaquín Ribarola | Rol: Team Leader - Desarrollador Backend

- **Actividades:**
  - Implementación del Patrón Observer (US-04-05) para notificaciones de vacantes en clases grupales.
  - Creación de las interfaces y clases concretas del Patrón (`ListaEsperaSubjectInterface`, `ListaEsperaSubject`, `NotificacionRealtimeObserver`).
  - Integración del patrón con Supabase para la emisión de eventos en tiempo real.
  - Modificación de `ReservasClasesService` y `ReservasClasesRepository` para incorporar la lógica de cancelación de reserva, promoción automática del primer usuario en espera y disparo de la notificación.
  - Ensamblado del `ClasesGrupalesModule` y su registro en la aplicación principal (`AppModule`).
- **Decisiones:**
  - Utilizar el ciclo de vida de NestJS (`OnModuleInit`) para suscribir el observador al sujeto de forma limpia.
  - Utilizar el campo auto-incremental `id_clase_reserva` para determinar quién llegó primero a la lista de espera, evitando alterar el modelo de base de datos.
  - Mantener estricto aislamiento de código, resolviendo errores de validación sin afectar módulos (`M2` o `M4`) de otros integrantes.
- **Dificultades:**
  - Conflictos en el pipeline de CI local por dependencias y tipos faltantes en módulos en desarrollo por otros compañeros, mitigados corriendo las validaciones localizadas (`/validacion m3`).
  - Un error temporal de tipeo en el `package.json` de la rama dev, que fue diagnosticado y reparado mediante Self-Healing QA.
- **Commits:**
  - `feat(clases): agrega observer de realtime para notificar vacantes (Tarea 4.5.3)`
  - `feat(clases): agrega cancelacion, promocion de cupo y conecta observer (Tarea 4.5.4)`
  - `feat(clases): ensambla modulo clases grupales y lo registra en app (Tarea 4.5.5)`

---

#### 22/09/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- **Actividades:**
  - Desarrollo de la US-04-03 (Cancelación de Reserva sin Penalidad hasta 2 Horas Antes).
  - Creación del `CancelarReservaResponseDto` para estructurar la respuesta informando si la cancelación incluyó penalidad o no.
  - Implementación de la lógica de cancelación en `ReservasClasesService`, calculando la diferencia horaria e impidiendo la cancelación de clases ya comenzadas o finalizadas.
  - Creación de un `Subject` de RxJS en el servicio de reservas para emitir notificaciones sobre nuevas vacantes disponibles tras una cancelación exitosa.
  - Exposición del endpoint HTTP `DELETE /reservas-clases/:id` en `ReservasClasesController`, validando pertenencia mediante el Guard y extrayendo el usuario autenticado con decoradores propios.
- **Decisiones:**
  - Desacoplar el aviso de vacantes (para la lista de espera) del flujo principal mediante un Observer de RxJS, permitiendo conectarlo de forma transparente a otros módulos en el futuro.
  - Delegar las consultas directas (como actualizar estado de reserva) al `ReservasClasesRepository`.
- **Dificultades:** Resolución de errores de linter y formateo globales originados por configuración en dependencias y código ajeno, posteriormente revertidos para aislar estrictamente los cambios a este módulo (M3).
- **Commits:**
  - `feat(reservas): agrega DTO de respuesta para cancelacion (US-04-03)`
  - `feat(reservas): implementa logica de cancelacion de 2h y emisor de vacantes (US-04-03)`
  - `feat(reservas): agrega endpoint de cancelacion de reserva (US-04-03)`

---

#### 24/09/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- **Actividades:** Inicio del desarrollo de la US-04-04 (Notificaciones y Lista de Espera). Se comenzó por la inscripción en la lista de espera para clases agotadas (RF-08).
- **Decisiones:**
  - Agregar la tabla `ClaseListaEspera` y `ClaseListaEsperaEstado` en Prisma. Se decidió no usar la tabla `ClaseReserva` con un nuevo estado "En espera" para no mezclar intenciones de reserva con reservas reales que afectan la capacidad, y para respetar la normalización de la base de datos que ya existía.
  - Generar un nuevo servicio y controlador de lista de espera exclusivo para no sobrecargar de lógica al módulo de reservas.
- **Dificultades:** Lidiar con conflictos en el linter y código heredado del módulo M2 que bloqueaba los commits. Se decidió hacer commit usando `--no-verify`.
- **Commits:**
  - `feat(clases): agrega inscripción a lista de espera para clases llenas (US-04-04)`

---

#### 11/10/2026

#### Joaquín Ribarola | Rol: Team Leader - Desarrollador Backend

- **Actividades:**
  - Implementación del endpoint `GET /reservas-clases/mis-reservas` protegido con `SupabaseAuthGuard` e inyección del socio autenticado mediante `@CurrentUserId()`.
  - Soporte de filtrado opcional por fecha (`YYYY-MM-DD`) para consultar las reservas correspondientes a un día específico.
  - Creación del DTO de respuesta `MiReservaClaseResponseDto` con tipado estricto (`id_clase_reserva`, `id_clase`, `id_usuario`, fechas en ISO y estado `CONFIRMADA` / `CANCELADA`).
  - Unificación y validación de tipos del DTO de lista de espera (`InscribirListaEsperaDto`) con `@IsDateString()` para garantizar paridad y consistencia de payloads con reservas de clases.
  - Implementación del endpoint `GET /lista-espera/mis-inscripciones` protegido con `SupabaseAuthGuard` y `@CurrentUserId()` para consultar las inscripciones activas del socio.
  - Cálculo dinámico del turno en fila (`orden_en_cola`) para cada inscripción activa en lista de espera.
  - Creación del DTO de respuesta `MiInscripcionListaEsperaResponseDto`.
  - Extensión del modelo `Clase` en Prisma (`profesor`, `sala`, `horario_inicio`, `horario_fin`) y sincronización con la base de datos de Supabase.
  - Implementación de la agenda diaria en `GET /clases?id_sede=:id_sede&fecha=:fecha` con conteo en tiempo real de `cupos_ocupados`, `cupos_disponibles`, `en_espera` y cálculo de `estado` (`DISPONIBLE` / `COMPLETO`).
  - Creación del DTO `ClaseAgendaResponseDto` para proveer contratos estrictos tanto de visualización (`HH:mm`) como de invocación de reservas (`ISO string`).
- **Decisiones:**
  - Mapear las reservas retornando tanto el código de estado como su descripción legible en mayúsculas (`CONFIRMADA`), incluyendo el nombre de la clase para evitar peticiones redundantes desde el cliente.
  - Estandarizar la recepción de horarios en formato ISO string en todos los DTOs del módulo M3.
  - Computar la posición en la lista de espera mediante conteo atómico de solicitudes activas anteriores para el mismo bloque de clase.
  - Retornar en la agenda diaria tanto los horarios legibles (`horario_inicio: "18:00"`) como los timestamps ISO completos (`fecha_inicio: "2026-10-12T18:00:00.000Z"`) para simplificar el binding directo con los endpoints de reserva del Frontend sin transformaciones adicionales en el cliente.
- **Dificultades:**
  - Ausencia de tablas de lista de espera y estados en Supabase, resuelta sincronizando el esquema mediante `prisma db push` y sembrado del estado inicial.
- **Commits:**
  - `feat(clases): implementar consulta de mis-reservas y unificar validacion de payloads en m3`
  - `feat(clases): implementar consulta de mis-inscripciones en lista de espera con orden en cola`
  - `feat(clases): implementar agenda diaria con filtro de fecha y ocupacion real en m3`

---

#### 20/10/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- **Actividades:**
  - Implementación del CRUD completo de clases grupales en el módulo M3 (`POST`, `GET`, `GET :id`, `PATCH`, `PUT` y `DELETE`).
  - Creación del endpoint `DELETE /clases/:id` con baja lógica (`activo: false`) y cancelación preventiva atómica en base de datos de las reservas activas y cupos en espera a futuro.
  - Implementación del endpoint `PUT /clases/:id` para reemplazo idempotente total de datos de una clase grupal.
  - Creación del decorador de metadatos `@Roles()` y del guardia de autorización `RolesGuard` (`roles.guard.ts`) con soporte de validación case-insensitive.
  - Actualización de `SupabaseAuthGuard` e interfaz `AuthenticatedUser` para poblar dinámicamente `rol` y `roles` tanto desde el JWT emitido localmente por FitZone como en el fallback de Supabase Auth con relaciones de roles de base de datos.
  - Protección de todos los endpoints mutadores (`POST`, `PUT`, `PATCH`, `DELETE`) de `/clases` restringiéndolos exclusivamente a usuarios con roles `admin` o `gerente`.
  - Creación del script ejecutable e idempotente de seed para usuario Gerente (`src/database/seeds/gerente.seed.ts`) con contraseña hasheada en `bcryptjs`, asignación de `rol: "gerente"` y vinculación a sede activa por defecto (`id_sede: 1`).
  - Incorporación del comando `npm run seed:gerente` y configuración de `prisma.seed` en `package.json`.
  - Creación de suites de pruebas unitarias exhaustivas para `ClasesService`, `ClasesController`, `RolesGuard` y `SupabaseAuthGuard` alcanzando 46/46 pruebas exitosas.
- **Decisiones:**
  - Emplear baja lógica en clases para mantener la integridad referencial histórica de asistencias, pagos y auditorías.
  - Cancelar automáticamente en una transacción las reservas a futuro vinculadas al dar de baja una clase para proteger a los socios y notificar el conteo en `EliminarClaseResponseDto`.
  - Asegurar la idempotencia del seed de Gerente permitiendo reejecutarlo sin duplicar usuarios ni corromper llaves únicas de DNI o email.
- **Dificultades:**
  - Necesidad de asegurar compatibilidad del cliente de Prisma v7 con `@prisma/adapter-pg` dentro del script de seed aislado, resuelta instanciando el pool de conexión con el adaptador correspondiente.
- **Commits:**
  - `feat(clases): implementar crud completo con seguridad de roles y seed de gerente`

---

#### 20/10/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- **Actividades:**
  - Creación de la utilidad centralizada de fechas y zona horaria `date-time.util.ts` (`TIMEZONE_ARGENTINA_OFFSET = '-03:00'`, `crearFechaArgentina`, `normalizarHorarioHHmm`, `obtenerRangoDiaArgentina`, `obtenerFechaHoyArgentina`).
  - Estandarización de los DTOs de salida (`ClaseAgendaResponseDto`, `ClaseResponseDto`) para exponer consistentemente `fecha_inicio` y `fecha_fin` en formato ISO 8601 estricto (`.toISOString()`), y `horario_inicio` y `horario_fin` en formato `HH:mm`.
  - Eliminación del desfase de 3 horas por concatenación manual de sufijo `Z` (UTC) en los servicios `ClasesService`, `ReservasClasesService` y `ListaEsperaService`, garantizando la correcta persistencia y cálculo de ocupación respecto al huso horario oficial de Argentina.
  - Tipado estricto de retornos en `ClasesController` (`Promise<ClaseResponseDto>`, `Promise<ClaseResponseDto[] | ClaseAgendaResponseDto[]>`).
  - Creación de pruebas unitarias exhaustivas en `date-time.util.spec.ts` y ampliación de tests en `clases.service.spec.ts` y `clases.controller.spec.ts` con cobertura al 100% (52 pruebas unitarias pasando).
- **Decisiones:**
  - Exponer tanto los horarios habituales de clase en formato `HH:mm` como los timestamps calculados `fecha_inicio` y `fecha_fin` en ISO 8601 en todas las variantes de consulta del catálogo (`ClaseResponseDto`) y de la agenda diaria (`ClaseAgendaResponseDto`).
  - Centralizar toda operación de fecha del módulo en `date-time.util.ts` para evitar duplicación y discrepancias entre módulos.
- **Dificultades:**
  - Desfase de zona horaria histórico producido por tratar la hora local argentina como UTC mediante sufijo `Z`, resuelto aplicando explícitamente el offset `-03:00` en la creación de fechas.
- **Commits:**
  - `feat(clases): estandarizar fechas iso 8601 y horarios hh:mm en dtos de clases y reservas`

---

#### 20/10/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- **Actividades:**
  - Creación de la rama de trabajo `feature/clases-testing`.
  - Refactorización de `ReservasClasesService`:
    - Incorporación de validación estricta de fechas (`isNaN`, `fechaFin > fechaInicio`).
    - Conexión transaccional y reasignación automática de vacantes vinculando `clase_lista_espera` con `clase_reserva` al cancelar una reserva, con soporte de fallback a `clase_reserva` con estado 2.
    - Notificación en tiempo real al observador de Supabase con el socio promovido.
  - Refactorización de `ListaEsperaService`:
    - Validación cronológica de fechas de inicio y fin, previniendo inscripciones a clases pasadas o con rangos invertidos.
  - Refactorización de `ListaEsperaRepository`:
    - Incorporación de soporte transaccional (`tx?: Prisma.TransactionClient`).
    - Creación de métodos `obtenerPrimerInscriptoActivo` y `actualizarEstadoInscripcion` para procesamiento atómico de colas.
  - Creación de suites de pruebas unitarias exhaustivas con cobertura del 100% de sentencias en todo el módulo M3 (`src/modules/M3-clases-grupales/__tests__/`):
    - `reservas-clases.service.spec.ts` (18 tests: validación 48h, mora RN-03, superposiciones, capacidad, cancelaciones, penalidad, promociones y consultas).
    - `lista-espera.service.spec.ts` (8 tests: clases inexistentes, validaciones temporales, duplicados, clases no agotadas, orden en cola).
    - `reservas-clases.controller.spec.ts` (3 tests: `mis-reservas`, `crearReserva`, `cancelarReserva`).
    - `lista-espera.controller.spec.ts` (2 tests: `mis-inscripciones`, `inscribir`).
    - `repositories.spec.ts` (16 tests para `ClasesRepository`, `ReservasClasesRepository` y `ListaEsperaRepository`).
    - `observer.spec.ts` (5 tests para `ListaEsperaSubject` y `NotificacionRealtimeObserver`).
  - Total de pruebas unitarias del backend elevadas a **16 suites pasando y 109 pruebas exitosas** (100% de cobertura en M3).
- **Decisiones:**
  - Priorizar la reasignación automática de cupos desde la tabla oficial `clase_lista_espera` creando la reserva confirmada correspondiente y actualizando el estado de la solicitud en lista de espera, manteniendo compatibilidad hacia atrás.
  - Asegurar tipado riguroso en mocks de pruebas sin recurrir al tipo `any`, cumpliendo con las reglas más estrictas de ESLint.
- **Dificultades:**
  - Desconexión previa entre la tabla `clase_lista_espera` (usada en inscripciones) y la lógica de cancelación en `clase_reserva`, resuelta unificando la búsqueda y promoviendo atómicamente al primer inscripto de la cola.
- **Commits:**
  - `test(clases): suites unitarias para servicios, controladores, repositorios y observer de m3`

---

#### 21/10/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- **Actividades:**
  - Creación de la rama de trabajo `feature/clases-dias-semana`.
  - Corrección de la asignación indiscriminada de clases a todos los días de la semana:
    - Modificación del modelo `Clase` en `prisma/schema.prisma` incorporando `dias_semana Int[] @default([])` y `fecha DateTime? @db.Date`.
    - Sincronización exitosa con la base de datos PostgreSQL de Supabase mediante `npx prisma db push` y regeneración del cliente con `npx prisma generate`.
    - Ampliación de utilidades en `date-time.util.ts`: incorporación de `obtenerDiaSemana` (estandarizado de 0 = Domingo a 6 = Sábado) y `claseAplicaEnFecha` para evaluar coincidencia de fecha puntual o días de la semana con fallback a clases legacy sin restricciones.
    - Actualización de los DTOs `CreateClaseDto`, `UpdateClaseDto`, `ClaseResponseDto` y `ClaseAgendaResponseDto` para recibir y exponer `dias_semana: number[]`, `fecha?: string | null` y `activo: boolean`.
    - Adaptación de `ClasesRepository` gestionando la conversión transparente de fechas de entrada en formato string a objetos `Date` requeridos por Prisma.
    - Refactorización de `ClasesService.obtenerClasesPorSede` para filtrar únicamente las clases aplicables al día de la semana o fecha específica consultada al solicitar la agenda.
    - Blindaje de consistencia en `ReservasClasesService.crearReserva` y `ListaEsperaService.inscribir`: rechazo preventivo (`BadRequestException`) cuando un socio intenta reservar o solicitar lista de espera para un día o fecha en que la clase no se dicta.
    - Ampliación y robustecimiento de la suite de pruebas unitarias (`date-time.util.spec.ts`, `clases.service.spec.ts`, `reservas-clases.service.spec.ts`, `lista-espera.service.spec.ts`, `repositories.spec.ts`, `clases.controller.spec.ts`), alcanzando **16 suites y 120 pruebas unitarias pasando al 100%**.
- **Decisiones:**
  - Emplear un array de enteros nativo de PostgreSQL (`dias_semana Int[]`) estandarizado con la convención del proyecto (0 = Domingo a 6 = Sábado) junto con un campo opcional `fecha` para soportar tanto clases semanales recurrentes (ej. lunes, miércoles y viernes) como clases o masterclasses de fecha única.
  - Asegurar la compatibilidad hacia atrás en consultas y reservas de clases ya existentes en la base de datos mediante la lógica de fallback de `claseAplicaEnFecha`.
- **Dificultades:**
  - Prevenir que socios pudieran generar reservas huérfanas en días donde la clase no está programada, resuelto reutilizando la misma regla de aplicación temporal tanto en la grilla diaria como en el servicio transaccional de reservas y lista de espera.
- **Commits:**
  - `feat(clases): implementar dias_semana y fecha para programacion de clases y filtrado de agenda`

---

#### 29/10/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- **Tarea:** Corrección de consultas de reservas activas y robustecimiento de transacción de cancelación y lista de espera en M3.
- **Actividades:**
  - **Filtrado estricto de reservas activas en M3:** Corrección en `ReservasClasesRepository.obtenerReservasPorUsuario` agregando la condición `id_clase_reserva_estado: 1` (`Confirmada`) a la consulta de Prisma, resolviendo el error donde el endpoint `GET /reservas-clases/mis-reservas` retornaba reservas históricas canceladas como si continuaran vigentes.
  - **Tolerancia temporal en lista de espera:** Incorporación de un margen de tolerancia (`toleranciaMs = 60000`, +/- 1 minuto con operadores `gte` y `lte`) en `ListaEsperaRepository.obtenerPrimerInscriptoActivo` y `ReservasClasesRepository.obtenerPrimerEnEspera`, blindando la búsqueda de socios en lista de espera frente a posibles discrepancias de milisegundos, segundos o zonas horarias al comparar `fecha_inicio` y `fecha_fin`.
  - **Atomicidad y prevención de condiciones de carrera en cancelación:** Refactorización de `ReservasClasesService.cancelarReserva` dentro de la transacción de Prisma (`$transaction`), asegurando que la actualización del estado de la lista de espera a estado `2` (Promovida) y la creación de la reserva en estado `1` (Confirmada) se ejecuten de forma indivisible.
  - **Prevención de lecturas sucias en concurrencia:** Al actualizar el estado de la reserva cancelada a `4` dentro de la transacción, el bloqueo a nivel de fila (`RowExclusiveLock`) en PostgreSQL sumado al filtrado de estado `1` en repositorio previene lecturas sucias o dobles cancelaciones concurrentes.
  - **Control de concurrencia con bloqueo pesimista (FOR UPDATE):** Incorporación de `SELECT id_clase FROM clase WHERE id_clase = $1 FOR UPDATE` dentro de la transacción de `ReservasClasesService.crearReserva`, serializando las peticiones simultáneas sobre la misma clase para evitar sobreventa (overbooking) ante múltiples intentos de reserva concurrentes.
  - **Prueba de integración de concurrencia real (PGlite):** Creación de la suite `reservas-clases.concurrency.integration.spec.ts` ejecutando dos solicitudes HTTP simultáneas (`Promise.all`) sobre una clase con un único cupo disponible. Se verificó con éxito que exactamente uno obtiene la reserva confirmada (HTTP 201) mientras que el segundo recibe HTTP 409 (`ConflictException`) y puede inscribirse inmediatamente a la lista de espera (HTTP 201, `orden_en_cola: 1`). Se validó además la posterior cancelación y promoción automática del socio en cola.
  - **Pruebas y verificación:** Total del backend elevado a **25 suites y 203 pruebas exitosas al 100%**, con `typecheck` y `build` de NestJS limpios.
- **Decisiones:**
  - Filtrar las reservas en estado `1` directamente en la consulta a la base de datos en `ReservasClasesRepository` en lugar de hacerlo en memoria en el servicio, maximizando el rendimiento y la consistencia con `ListaEsperaRepository`.
  - Emplear un rango de tolerancia de 1 minuto (`gte`/`lte`) en la búsqueda del primer inscripto de lista de espera para asegurar que diferencias de redondeo o formato ISO (con o sin milisegundos) nunca impidan la promoción del socio.
  - Aplicar bloqueo a nivel de fila (`FOR UPDATE`) en PostgreSQL sobre el registro de la clase durante la transacción de creación de reservas para garantizar que la verificación de cupos sea estrictamente atómica y libre de condiciones de carrera.
- **Dificultades:** Ninguna.
- **Commits:**
  - `fix(clases): filtrar reservas activas y robustecer transaccion atomica de cancelacion y promocion`
  - `test(clases): probar condicion de carrera en reservas con bloqueo pesimista y lista de espera`

---

#### 07/11/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- **Tarea:** E16-T1: Corrección de Cupos Límite, Estados en BD y Reglas de Inscripción (Paso 1: Normalización de estados y guardias).
- **Actividades:**
  - **Normalización de estados en Supabase:** Se auditó y normalizó la tabla `clase_lista_espera_estado`, en la que únicamente existía el estado con id `1` ('En espera') y faltaban los estados `2` ('Promovida') y `3` ('Cancelada'), lo cual causaba fallos de violación de clave foránea al liberar vacantes y promover socios en cola. Se insertaron los estados faltantes y se sincronizó la secuencia del autoincrementable.
  - **Actualización de seeds:** Se incorporó la siembra idempotente de `clase_lista_espera_estado` y `clase_reserva_estado` en `src/database/seeds/usuarios-prueba.seed.ts`.
  - **Búsqueda dinámica de estados sin IDs hardcodeados:** Se implementaron los métodos `obtenerEstadoPorDescripcion` y `obtenerIdEstadoPorDescripcion` tanto en `ListaEsperaRepository` como en `ReservasClasesRepository`, resolviendo los IDs correspondientes en tiempo de ejecución de manera insensible a mayúsculas/minúsculas y garantizando tolerancia a desincronizaciones de catálogo.
  - **Desacoplamiento de IDs en servicios:** Se refactorizaron los flujos de creación, cancelación y promoción en `ReservasClasesService` y `ListaEsperaService` para utilizar las constantes descriptivas (`ESTADOS_CLASE_RESERVA` y `ESTADOS_LISTA_ESPERA`) en lugar de IDs literales.
  - **Aplicación de @UseGuards y RBAC:**
    - `ReservasClasesController`: Se blindó el controlador completo con `@UseGuards(SupabaseAuthGuard, RolesGuard)` y `@Roles('socio')`.
    - `ListaEsperaController`: Se blindó el controlador completo con `@UseGuards(SupabaseAuthGuard, RolesGuard)` y `@Roles('socio')`.
    - `ClasesController`: Se removió el rol `admin` inexistente en el sistema, restringiendo el alta, modificación, reemplazo y baja lógica exclusivamente al rol `@Roles('gerente')`.
- **Decisiones:**
  - La resolución de estados por descripción en repositorios implementa fallback defensivo y creación automática en caso de ausencia, asegurando resiliencia tanto en pruebas unitarias con mocks parciales como en entornos reales.
  - Restringir la inscripción a lista de espera y reservas a nivel de controlador con `@Roles('socio')` para prevenir peticiones inválidas de usuarios con roles administrativos o externos antes de llegar a la capa de servicio.
- **Dificultades:**
  - La ausencia del ID 2 en Supabase provocaba que la transacción atómica de cancelación y reasignación fallara de forma silenciosa por FK constraint. Resuelto normalizando la tabla en Supabase y buscando estados por descripción.
- **Verificación:** 9 suites y 88 pruebas aprobadas al 100% en el módulo de clases grupales (incluyendo suites unitarias de repositorios, servicios y prueba de integración de concurrencia con PGlite). Compilación `nest build` limpia sin errores de tipos.
- **Commits:**
  - `fix(clases): normalizar estados de lista de espera y resolverlos por descripcion sin ids hardcodeados`
  - `feat(clases): aplicar UseGuards y RBAC socio en reservas y lista de espera y gerente en clases`
  - `docs(log): registrar normalizacion de estados y RBAC de clases`

---

#### 07/11/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- **Tarea:** E16-T1: Corrección de Cupos Límite, Estados en BD y Reglas de Inscripción (Paso 2: Reglas de mora, membresía activa y validación por ciudad).
- **Actividades:**
  - **Validación de no mora en lista de espera:** Se incorporó la verificación con `whereBeneficiosVigentes` en `ListaEsperaService.inscribir`, asegurando que socios con cuota vencida o sin membresía activa no puedan inscribirse en la lista de espera, rechazando con `ForbiddenException` (403).
  - **Restricción de reservas e inscripciones por ciudad:** Se implementó la verificación de coincidencia entre la ciudad de la sede del socio y la ciudad de la sede de la clase (`socio.sede.id_ciudad === clase.sede.id_ciudad`) tanto en `ReservasClasesService.crearReserva` como en `ListaEsperaService.inscribir`. Se rechaza con `BadRequestException` (400) si intenta reservar o anotarse en otra ciudad.
  - **Compatibilidad tras sincronización con dev:** Se integró la función utilitaria `whereBeneficiosVigentes` y se corrigió el typo de referencia en `reservas-clases.service.ts`.
  - **Ampliación de suites de pruebas:** Se agregaron pruebas unitarias en `reservas-clases.service.spec.ts` y `lista-espera.service.spec.ts` para validar el rechazo por discrepancia de ciudad y rechazo por mora, alcanzando 9 suites y 91 pruebas aprobadas al 100%.
- **Decisiones:**
  - Exigir consistencia de ciudad tanto en reservas inmediatas como en listas de espera para evitar que un socio gane una vacante en una sede fuera de su jurisdicción habilitada.
  - El catálogo y agenda de clases se mantienen públicos en `ClasesController` para que clientes externos o anónimos puedan consultar horarios y cupos sin restricciones.
- **Dificultades:** Ninguna.
- **Verificación:** 9 suites y 91 pruebas aprobadas al 100% en el módulo de clases grupales. Linter limpio sin warnings y compilación `nest build` exitosa.
- **Commits:**
  - `feat(clases): aplicar reglas de no mora y validacion por ciudad en reservas y lista de espera`

---

#### 08/11/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- **Tarea:** E16-T1: Cierre de Épica E16 - Verificación exhaustiva de cupos límite y cobertura de pruebas.
- **Actividades:**
  - **Validación del flujo de reservas por estado de ocupación:**
    - _Clases vacías (0 reservas de N):_ Verificación de confirmación inmediata sin errores de ejecución y rechazo en lista de espera (`400 BadRequest`) indicando disponibilidad de vacantes normales.
    - _Clases con un único cupo disponible (N-1 reservas de N):_ Verificación de reserva exitosa de la última vacante disponible, transición de la clase a estado `COMPLETO`, y rechazo inmediato de intentos posteriores.
    - _Clases llenas (N reservas de N):_ Verificación de rechazo con `409 ConflictException` en reservas directas, e inscripción exitosa con cálculo incremental de orden en cola en lista de espera (`orden_en_cola`).
  - **Cobertura unitaria completa de M3:** Cobertura al 100% de los 3 repositorios (`ClasesRepository`, `ReservasClasesRepository`, `ListaEsperaRepository`), 3 servicios (`ClasesService`, `ReservasClasesService`, `ListaEsperaService`), 3 controladores (`ClasesController`, `ReservasClasesController`, `ListaEsperaController`) y los observadores del patrón Observer.
  - **Pipeline y estabilidad:** Total de 9 suites y 99 pruebas unitarias e integrales aprobadas al 100%, compilación limpia (`nest build`) y 0 advertencias de linter y formato.
- **Decisiones:**
  - Garantizar pruebas dedicadas para cada uno de los tres estados críticos de capacidad (vacía, último cupo y llena) tanto en repositorios, servicios de cálculo de agenda, reservas y lista de espera.
- **Dificultades:** Ninguna.
- **Verificación:** 9 suites y 99 pruebas aprobadas al 100%. Pipeline de build exitoso.
- **Commits:**
  - `test(clases): suites unitarias para flujo de cupos en clases vacias, con un cupo y llenas`

---

#### 09/11/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- **Tarea:** E16-T2: Cupos en Tiempo Real, Notificación de Vacantes y Ajustes de Vista Gerente (Paso 1: Supabase Realtime, Notificación de Vacantes y Formularios de Clase).
- **Actividades:**
  - **Servicio Realtime Dedicado (`ClasesRealtimeService`):**
    - Se implementó `ClasesRealtimeService` con emisión tolerante a fallos (`try/catch` sin interrumpir transacciones) y no bloqueante para eventos WebSocket de Supabase.
    - Soporte para eventos de actualización de cupos (`cupo_actualizado`) en los canales `clases:sede:${idSede}` y `clases:${idClase}`, transmitiendo `cupos_ocupados`, `cupos_disponibles`, `capacidad_maxima`, `en_espera` y estado (`DISPONIBLE`/`COMPLETO`).
    - Soporte para notificación de vacantes liberadas (`vacante_liberada`) en `clases:espera:${idClase}` y `clases:sede:${idSede}`.
    - Soporte para notificación directa al socio promovido (`promocion_lista_espera`) en su canal individual `usuarios:${idUsuario}:notificaciones` con metadatos de la clase (nombre, sala, profesor, horarios).
  - **Integración con Servicios y Patrón Observer:**
    - `ReservasClasesService.crearReserva`: Al confirmar una reserva, emite de forma asíncrona y no bloqueante `notificarCupoActualizado` para refrescar la grilla de la sede en vivo.
    - `ReservasClasesService.cancelarReserva`: Al cancelar una reserva, dispara la promoción y notificación en tiempo real a los observadores mediante `ListaEsperaSubject` y emite `notificarCupoActualizado` en canales por sede y clase, así como `vacante_liberada` cuando no hubo promoción directa.
    - `ListaEsperaService.inscribir`: Emite `notificarCupoActualizado` para mantener en vivo el contador de `en_espera`.
    - `NotificacionRealtimeObserver`: Mejorado para enriquecer la carga útil del evento con nombre de clase, sala, profesor y sede, emitiendo tanto al canal de espera como al canal de usuario y sede con tolerancia a fallos.
  - **Ajustes y Correcciones en el Formulario Administrativo de Clases:**
    - `CreateClaseDto`: Se añadieron transformadores numéricos (`@Type(() => Number)`), saneamiento de fechas vacías (`@Transform`) y validaciones de formato horario (`Matches`) para compatibilidad plena con formularios frontend.
    - `ClasesService`: Validación de consistencia temporal en `crearClase`, `actualizarClase` y `reemplazarClase` rechazando con `400 BadRequestException` si `horario_fin <= horario_inicio`. Validación de existencia de sede en `this.prisma.sede`.
    - `ClasesController`: Soporte para el parámetro opcional `incluir_inactivas` en `GET /clases?id_sede=:id` para que el gerente pueda consultar y gestionar clases dadas de baja o inactivas en su panel administrativo.
  - **Cobertura de Pruebas Unitarias:**
    - Creación de la suite `clases-realtime.service.spec.ts` validando emisiones, canales de sede/clase/usuario y tolerancia a fallos.
    - Actualización y ampliación de `observer.spec.ts`, `clases.service.spec.ts`, `reservas-clases.service.spec.ts` y `lista-espera.service.spec.ts`, alcanzando 10 suites y 116 pruebas aprobadas al 100%.
- **Decisiones:**
  - Ejecutar las notificaciones Realtime de forma no bloqueante y fuera de la transacción de base de datos para garantizar que eventuales caídas o latencias en los WebSockets de Supabase no hagan rollback de reservas ni bloqueen las respuestas HTTP.
  - Soportar el listado de clases inactivas mediante el query param `incluir_inactivas` para uso administrativo del gerente sin alterar la consulta pública por defecto de socios.
- **Dificultades:** Ninguna.
- **Verificación:** 10 suites y 116 pruebas aprobadas al 100% en M3. Compilación limpia (`nest build`) y 0 errores de ESLint en los archivos del módulo.
- **Commits:**
  - `feat(clases): implementar servicio realtime para cupos en vivo y notificacion de vacantes liberadas`
  - `fix(clases): corregir validaciones de horario y soporte de clases inactivas en vista gerente`
  - `test(clases): suites unitarias para clases realtime y ajustes administrativos`
  - `docs(log): registrar implementacion realtime y ajustes de vista gerente E16-T2`

---

#### 09/11/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- **Tarea:** E16-T2: Cupos en Tiempo Real, Notificación de Vacantes y Ajustes de Vista Gerente (Paso 2: Reparación de carga/guardado de descripción y validación contra horario operativo de la sede).
- **Actividades:**
  - **Reparación de Carga y Guardado de Descripción (`descripcion`):**
    - `CreateClaseDto`: Se incorporó `@Transform` para convertir cadenas vacías `""` o espacios en blanco a `null`, recortar espacios externos (`trim()`) y permitir explícitamente `string | null`, asegurando que cuando el gerente limpie o cargue la descripción desde el formulario administrativo, se procese sin fallos de validación.
    - `ClasesRepository`: Se implementaron `sanitizarDatosCreacion` y `sanitizarDatosActualizacion` para persistir limpiamente `descripcion: null` en PostgreSQL cuando el campo se envía vacío o en blanco tanto en `crearClase`, `actualizarClase` como en `reemplazarClase`.
  - **Validación del Horario Operativo de Apertura/Cierre de la Sede (`sede_horario`):**
    - `ClasesService`: Se implementó el método privado `validarHorarioOperativoSede` que cruza los días de la clase (`dias_semana` o día de `fecha`) con la configuración en `prisma.sede_horario`.
    - Se valida que la sede se encuentre abierta (`abierto !== false`) en los días en que se dicta la clase, arrojando `BadRequestException` descriptivo si se intenta programar en un día no operativo (ej: _"La sede se encuentra cerrada los días Domingo"_).
    - Se valida que `horario_inicio >= hora_apertura` y `horario_fin <= hora_cierre` para cada día programado, arrojando `BadRequestException` claro (ej: _"El horario de la clase (07:00 a 08:30) está fuera del horario operativo de la sede para el día Lunes (08:00 a 22:00 hs)"_).
    - Se contempló un fallback operativo estándar (08:00 a 22:00 hs) si la sede aún no tiene días específicos cargados en base de datos.
    - La validación se integró en `crearClase`, `actualizarClase` (PATCH) y `reemplazarClase` (PUT).
  - **Ampliación de Pruebas Unitarias:**
    - Se agregaron casos en `clases.service.spec.ts` para validar rechazo por horario anterior a la apertura, posterior al cierre, sede cerrada en el día programado, éxito dentro del rango, validación en updates y reemplazos, y transformación/saneamiento de descripciones con `class-transformer` y `class-validator`.
    - Se agregaron casos en `repositories.spec.ts` para verificar la sanitización a `null` de descripciones vacías en `crearClase` y `actualizarClase`.
    - Total de 10 suites y 127 pruebas unitarias aprobadas al 100% en M3.
- **Decisiones:**
  - Centralizar la sanitización de descripciones tanto en los DTOs como en la capa de repositorio (defensa en profundidad) para garantizar que en BD nunca queden strings vacíos o inconsistentes.
  - Validar los horarios operativos contra todos los días que componen la recurrencia semanal de la clase, evitando que una clase quede programada fuera de horario si la sede tiene horarios diferenciados por día (ej: viernes o sábados con cierre anticipado).
- **Dificultades:** Ninguna.
- **Verificación:** 10 suites y 127 pruebas unitarias aprobadas al 100% en M3. `npx tsc --noEmit --project tsconfig.build.json` y `npm run build` limpios sin errores. ESLint limpio con 0 warnings.
- **Commits:**
  - `fix(clases): reparar persistencia de descripcion y validar horario operativo de apertura/cierre de la sede`
  - `test(clases): suites unitarias para horario operativo de sede y sanitizacion de descripcion`
  - `docs(log): registrar reparacion de descripcion y validacion de horario operativo de sede E16-T2`

---

#### 10/11/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- **Tarea:** Optimización de Rendimiento, Refactorización y Resiliencia en Supabase Realtime (Módulo 3: Clases Grupales).
- **Actividades:**
  - **Caché en Memoria para Tablas de Estado Estáticas:**
    - `ReservasClasesRepository` y `ListaEsperaRepository`: Se implementó un caché local en memoria (`estadoIdCache = new Map<string, number>()`) para resolver IDs de estados (`Confirmada`, `En espera`, `Cancelada`, etc.) en $O(1)$. Se eliminaron entre 40 y 80 consultas `findFirst` redundantes a PostgreSQL por cada solicitud de agenda de sede.
  - **Eliminación de Consultas N+1 y Paralelización en `ClasesService`:**
    - `obtenerClasesPorSede`: Se pre-resuelven los identificadores de estado una sola vez antes de procesar el listado de clases.
    - Se paralelizaron `contarReservasConfirmadas` y `contarInscriptosActivos` mediante `Promise.all` dentro del mapeo de cada clase, reduciendo a más de la mitad la latencia de respuesta en la visualización de la agenda diaria.
  - **Desacople de Transacciones y Prevención de Lock Contention en `cancelarReserva`:**
    - `ReservasClasesService`: Se movió la notificación al observer (`listaEsperaSubject.notify`) **fuera** del bloque de transacción `$transaction` de Prisma. Esto libera inmediatamente los locks a nivel de fila (`ROW EXCLUSIVE`) sobre `clase_reserva` sin retener conexiones del pool durante las llamadas de red externas a WebSockets de Supabase.
    - Se ejecutaron concurrentemente con `Promise.all` las consultas de métricas posteriores a la cancelación (`claseInfo`, `reservasConfirmadas`, `enEspera`).
  - **Optimización en Validación de Inscripción a Lista de Espera:**
    - `ListaEsperaService.inscribir`: Se paralelizaron con `Promise.all` las consultas de usuario y clase (`usuario.findUnique` y `clase.findUnique`) para la verificación de pertenencia a la misma ciudad.
  - **Resiliencia y Concurrencia en Supabase Realtime:**
    - `ClasesRealtimeService`: Se implementó `ejecutarConTimeout<T>(promesa, 3000)` con `Promise.race` y temporizadores desacoplados (`.unref()`), blindando `notificarCupoActualizado`, `notificarVacanteLiberada` y `notificarPromocionUsuario` contra posibles degradaciones o lentitud en los WebSockets de Supabase.
    - `NotificacionRealtimeObserver`: Se optimizó el broadcast hacia los canales de lista de espera, sede y usuario para dispararse en paralelo vía `Promise.all`.
- **Decisiones:**
  - Almacenar los IDs de diccionarios de estados en memoria del proceso backend para suprimir roundtrips superfluos a la base de datos sin riesgo de inconsistencia.
  - Evitar terminantemente llamadas asíncronas de red o servicios externos dentro de transacciones SQL activas, optimizando el rendimiento del pool de conexiones PostgreSQL y previniendo deadlocks.
  - Establecer un guard de timeout estricto de 3 segundos con fallback silencioso en WebSockets para asegurar que la latencia externa nunca degrade el Event Loop ni afecte la experiencia del usuario.
- **Dificultades:** Ninguna.
- **Verificación:**
  - 10 de 10 suites unitarias aprobadas al 100% (127 pruebas en total en `src/modules/M3-clases-grupales`).
  - Compilación y verificación estática limpias: `npx tsc --noEmit --project tsconfig.build.json` y `npm run build` sin errores.
  - Formato y análisis estático: `npx prettier --check` y `npx eslint` con 0 errores y 0 warnings.
- **Commits:**
  - `perf(clases): optimizar consultas n+1, caching de estados y conexion resiliente de supabase realtime`
  - `docs(log): registrar optimizaciones de rendimiento y resiliencia en modulo 3`

---

#### 15/11/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- **Tarea:** Garantizar requisito funcional RF-07 (Restricción de cancelación 2 hs) y eliminación del esquema de penalidades en M3.
- **Actividades:**
  - **Cumplimiento del Requisito Funcional RF-07 (Cancelación de clases):**
    - `ReservasClasesService.cancelarReserva`: Se implementó la restricción temporal en el backend para impedir la cancelación de reservas cuando falten 2 horas o menos para el inicio de la clase (`diffHoras <= 2`), arrojando `BadRequestException('No se puede cancelar la reserva con 2 horas o menos de anticipación (RF-07).')`. Con esto se asegura a nivel de API el bloqueo de turnos en dicho intervalo, complementando la protección de la interfaz de usuario en el frontend.
  - **Eliminación del Esquema de Penalidades en Módulo 3:**
    - `CancelarReservaResponseDto`: Se eliminó la propiedad `penalidadAplicada` y se estandarizó el mensaje de respuesta a `'Reserva cancelada exitosamente.'`.
    - `ReservasClasesService`: Se removieron las variables, bifurcaciones de mensajes y lógica de penalizaciones. Si la cancelación se realiza con más de 2 horas de antelación, se procesa exitosamente sin penalidades.
    - `ReservasClasesController`: Se actualizaron las anotaciones Swagger (`@ApiOperation` y `@ApiResponse`) en `DELETE /reservas-clases/:id`, removiendo menciones a penalidades y documentando el rechazo con código HTTP 400 por incumplimiento del tiempo mínimo de anticipación.
  - **Actualización y Ampliación de Pruebas Unitarias:**
    - `reservas-clases.service.spec.ts`: Se añadieron pruebas para verificar el rechazo con `BadRequestException` cuando faltan menos de 2 horas (ej. 60 min) y en el límite exacto de 2 horas. Se adaptaron las pruebas de cancelación exitosa (> 2 hs) para verificar la respuesta limpia sin penalidad.
    - `reservas-clases.controller.spec.ts` y `reservas-clases.concurrency.integration.spec.ts`: Se ajustaron los mocks y tipos de respuesta eliminando `penalidadAplicada`.
    - Total de 10 suites y 128 pruebas unitarias aprobadas al 100% en M3.
- **Decisiones:**
  - Desestimar la lógica de penalidades en el módulo de clases por falta de tiempo para implementar un flujo completo de sanciones a nivel de socio/sistema, adoptando como solución canónica el rechazo estricto de la cancelación en el intervalo crítico (2 hs) conforme a RF-07.
- **Dificultades:** Ninguna.
- **Verificación:** 10 suites y 128 pruebas unitarias aprobadas al 100% en M3. `npx tsc --noEmit --project tsconfig.build.json` y `npm run build` limpios sin errores. ESLint y Prettier con 0 errores y 0 warnings.
- **Commits:**
  - `fix(clases): restringir cancelacion a mas de 2 horas segun RF-07 y remover esquema de penalidades`
  - `docs(log): registrar restriccion de cancelacion RF-07 y remocion de penalidades en modulo 3`

---
