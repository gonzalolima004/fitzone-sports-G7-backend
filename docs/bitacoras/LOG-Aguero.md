# Bitácora — Agüero, Facundo Luis — Rol: desarrollador backend y frontend; líder técnico del 01/10 al 14/10

Esta bitácora cubre mi trabajo en el repositorio backend. Lo que hice en el frontend, incluidas la planificación y el seguimiento como líder técnico, está en `src/docs/bitacoras/LOG-Aguero.md` del repositorio frontend.

Las horas de cada entrada son estimadas: no las fuimos registrando, así que, como pidió el profesor, las calculé a partir de la estimación de las tarjetas de Trello y de los commits de cada sesión.

## Sprint 2 — Unidad II — Semana del 2026-08-24

### 2026-08-24 al 2026-09-05 · 6 h

**Actividad**
Participé con Marcos Caraballo, Angelina Vialle y Matías Sillen en las reuniones del equipo para modelar el sistema completo en Visual Paradigm: diagramas de contexto (C1), de contenedores (C2) y de componentes (C3).

**Decisión**
- Adoptamos Supabase como contenedor para la base de datos PostgreSQL, el almacenamiento de comprobantes y las notificaciones en tiempo real (ver [ADR-007](../adr/007-utilizar-supabase-como-plataforma-de-servicios-backend.md)).
- Separamos el frontend en una SPA en Vue.js y un contenedor de contenido estático con Nginx.
- Organizamos el backend en NestJS con módulos claros: canchas, pagos con webhooks de Mercado Pago, accesos y clases grupales con lista de espera (ver [ADR-004](../adr/004-utilizar-node.js-con-nestjs-para-backend.md) y [ADR-009](../adr/009-adoptar-arquitectura-de-monolito-modular.md)).

**Problema o bloqueo**
Nos costó definir cómo interactúa el cliente web con la API de NestJS y, a la vez, con los servicios en tiempo real de Supabase.

**Commits**
Sin commits: el modelo quedó en el [proyecto de Visual Paradigm](https://online.visual-paradigm.com/share.jsp?id=343730393234342d31) del equipo.

---

## Sprint 3 — Unidad III — Semana del 2026-09-14

### 2026-09-14 · 3 h

**Actividad**
Configuré el cliente de Prisma, creé el `PrismaService` y verifiqué la conexión del backend con PostgreSQL.

**Decisión**
Definí `PrismaModule` como módulo global e implementé `PrismaService` como singleton, para reutilizar una única conexión a la base de datos. Las credenciales de la base se leen de variables de entorno.

**Problema o bloqueo**
Al instanciar el cliente de Prisma apareció un error de compatibilidad con la versión del proyecto. Lo resolví agregando el adaptador de Prisma para PostgreSQL.

**Commits**
- `fddbc73` feat(database): configure Prisma singleton connection

---

### 2026-09-17 · 4 h

**Actividad**
Integré en `dev` el PR #8 del singleton de Prisma. Configuré Swagger para generar la documentación inicial de la API y ver los endpoints en `/api/docs`, y configuré `ValidationPipe` para validar los datos que recibe la API y rechazar las propiedades que no están definidas en los DTO.

**Decisión**
Configuré `ValidationPipe` de forma global, para mantener el mismo criterio de validación en todos los módulos.

**Problema o bloqueo**
Mientras configuraba Swagger hice cambios accidentales en `main.ts`. Usé Git para restaurar el archivo al último estado confirmado y seguí desde una versión estable.

**Commits**
- `16cd43e` merge del PR #8 (singleton de Prisma) en `dev`
- `98e2b9d` feat(api): configure Swagger and global validation

---

### 2026-09-19 · 1,5 h

**Actividad**
Creé los DTO de Ciudad y Sede para el alta y la actualización, con `class-validator` y `PartialType`.

**Decisión**
Usé `PartialType` en los DTO de actualización para reutilizar las validaciones de los DTO de creación y permitir modificaciones parciales.

**Problema o bloqueo**
Tuve que corregir errores menores de sintaxis y de formato en los DTO antes de hacer el commit.

**Commits**
- `4d5e705` feat(sedes): add ciudad and sede DTOs

---

## Sprint 4 — Unidad III — Semana del 2026-09-21

### 2026-09-22 · 1,5 h

**Actividad**
Implementé los repositorios de Ciudad y Sede con Prisma y el patrón Repository: consulta, alta, actualización y borrado lógico.

**Decisión**
- Dejé el acceso a datos encapsulado en los repositorios y la validación de existencia de los recursos en la capa de servicios (ver [ADR-014](../adr/014-aplicar-patron-repository-para-acceso-a-datos.md)).
- Usé borrado lógico para Ciudad y Sede con el campo `activo`, para no eliminar registros físicamente.

**Problema o bloqueo**
Ninguno.

**Commits**
- `e9b9081` feat(sedes): agregar ciudad y sede repositories

---

### 2026-09-24 · 2 h

**Actividad**
Implementé los servicios de Ciudad y Sede, con validaciones de existencia y de la relación entre Sede y Ciudad, y los controladores REST con endpoints GET, POST, PATCH y DELETE. Creé `SedesModule`, registré sus controladores, servicios y repositorios, y lo integré en `AppModule`.

**Decisión**
- Antes de crear una Sede o de modificar su `id_ciudad`, el servicio verifica que exista la Ciudad asociada.
- Mantuve Ciudad y Sede dentro del módulo `M0-sedes`, porque las dos entidades forman parte de la gestión de sedes.

**Problema o bloqueo**
Ninguno.

**Commits**
- `a545e72` feat(sedes): agregar servicios de ciudad y sede
- `699c7ad` feat(sedes): agregar controllers y módulo de sedes

---

### 2026-09-25 · 1 h

**Actividad**
Documenté en Swagger los endpoints de ciudades y sedes, con operaciones, parámetros y respuestas HTTP posibles, revisé los archivos con ESLint y Prettier y registré el avance en la bitácora.

**Decisión**
Ninguna.

**Problema o bloqueo**
- `npm run start:dev` no compilaba por errores en los módulos `M2-accesos` y `M5-pagos`, ajenos a `M0-sedes`, así que no pude levantar la API completa. Verifiqué los archivos de `M0-sedes` con ESLint y Prettier, sin errores.
- A `package.json` le faltaba una coma en la configuración de Jest (`transformIgnorePatterns`) y el archivo no era un JSON válido; la agregué.

**Commits**
- `a87c4e6` docs(sedes): documentar endpoints con Swagger
- `3620f5f` fix(config): corregir sintaxis de package.json
- `f228353` docs(log): registrar implementación de sedes y ciudades

---

## Sprint 4 — Unidad IV — Semana del 2026-09-28

### 2026-09-28 · 6 h

**Actividad**
En la rama `feature/auth-supabase` implementé la autenticación con Supabase Auth: `SupabaseService`, `SupabaseAuthGuard`, la interfaz `AuthenticatedUser` y los decoradores `CurrentUser` y `CurrentUserId`. Para completar el flujo tuve que ajustar otros módulos:
- M1 Usuarios: agregué `findByEmail()` para encontrar al usuario local autenticado, corregí los nombres de las relaciones de Prisma en `defaultIncludes` (`usuario_estado` y `usuario_rol`) y agregué el `await` a `repository.create()` antes de transformar la respuesta.
- M2 Accesos: importé `UsuariosModule` para que `SupabaseAuthGuard` pueda resolver `UsuariosService`.
- Dependencias: agregué `jsonwebtoken`, que necesita el sistema de QR de Accesos.

Probé los casos sin token (401), con token inválido (401), con token de Supabase válido sin usuario local (403) y con usuario local (200); `npm run typecheck` sin errores.

**Decisión**
Vinculé el usuario de Supabase con el de FitZone por el email (la adopción de Supabase Auth está en [ADR-008](../adr/008-utilizar-supabase-auth-para-autenticacion.md)). Queda para definir con el equipo si más adelante se guarda el UUID de Supabase en la tabla de usuarios.

**Problema o bloqueo**
- La conexión directa de Supabase usaba IPv6 y no era accesible desde mi red local; usé el Session Pooler.
- La base no tenía datos iniciales de sede, `usuario_estado` ni rol, y el código supone que `id_usuario_estado` 1 es activo y 3 es desactivado, pero no hay un seed que cree esos valores. Queda pendiente agregar seeds para los datos maestros.
- Las relaciones de Prisma con nombres inválidos impedían consultar usuarios; las corregí.
- A `package.json` le volvió a faltar la coma en la configuración de Jest; la agregué otra vez.

**Commits**
- `856ce59` fix(config): corregir sintaxis de package.json
- `f54818b` feat(auth): agregar usuario autenticado y decoradores
- `827e83d` feat(usuarios): agregar busqueda por email para autenticacion
- `d750ff5` feat(auth): configurar servicio global de Supabase
- `af55251` feat(auth): implementar guard de autenticacion con Supabase
- `fc907c7` fix(deps): agregar jsonwebtoken para accesos
- `0180def` fix(auth): importar UsuariosModule en AccesosModule
- `4a3389c` chore(config): documentar variables de Supabase y QR
- `69feaf1` fix(usuarios): corregir relaciones Prisma en includes
- `7b39955` fix(usuarios): esperar creacion antes de mapear respuesta
- `eef2e07` docs(log): registrar integracion de Supabase Auth
- `22380f0` docs(log): registrar fecha log

---

### 2026-09-29 · 2,5 h

**Actividad**
Empecé el reporte consolidado de ingresos multi-sede: los DTO de consulta y de respuesta, la consulta de ingresos aprobados por sede, que consolida los pagos de membresías y de reservas de canchas con filtros por rango de fechas, sede y concepto, y el servicio que arma el reporte.

**Decisión**
Ninguna.

**Problema o bloqueo**
A `package.json` le volvió a faltar la coma en la configuración de Jest; la agregué antes de seguir.

**Commits**
- `52348c5` fix(config): corregir sintaxis de package.json
- `dc4ff87` feat(reportes): agregar DTOs de consulta y respuesta de ingresos
- `5f6a35a` feat(reportes): agregar agregacion de ingresos por sede
- `9bcd37a` feat(reportes): agregar servicio de consolidacion de ingresos

---

### 2026-09-30 · 4,5 h

**Actividad**
- Terminé el reporte de ingresos: expuse `GET /reportes/ingresos` e integré `ReportesModule` al sistema.
- Hice el reporte de métricas de ocupación por sede: DTO de consulta y de respuesta, asistencias a partir de `RegistroAcceso`, cantidad de reservas confirmadas de canchas y de clases grupales, filtros por rango de fechas y sede, el servicio y `GET /reportes/ocupacion`, reutilizando la configuración de `ReportesModule`.
- Integré en `dev` los PR de las dos tareas (#48 y #49).

**Decisión**
En ocupación incluí las sedes sin actividad con valores en cero y conté solo las reservas confirmadas.

**Problema o bloqueo**
El PR #46 del reporte de ingresos quedó fusionado en `main` en lugar de `dev`. Lo revertí en `main` con el PR #47 y volví a abrir la tarea hacia `dev` en el PR #48.

**Commits**
- `ba144e6` feat(reportes): exponer endpoint de reporte de ingresos
- `4baaa2f` merge(dev): integrar cambios actualizados en reporte de ingresos
- `f009fbc` merge del PR #46 (quedó en `main` por error)
- `adfe296` Revert "Merge pull request #46 from gonzalolima004/feature/e1-tarea-5-reporte-ingresos"
- `864b7f6` merge del PR #47 (revert en `main`)
- `eba1298` merge del PR #48 en `dev`
- `713478e` feat(reportes): agregar DTOs de metricas de ocupacion
- `96aaf27` feat(reportes): agregar consultas de metricas de ocupacion
- `c979384` fix(reportes): incluir sedes sin asistencias en metricas
- `14c2b3f` feat(reportes): agregar servicio de metricas de ocupacion
- `b38d41b` feat(reportes): exponer endpoint de metricas de ocupacion
- `a9a7472` fix(reportes): contar solo reservas confirmadas en ocupacion
- `2b9a61a` docs(log): registrar tareas 5 y 6 de reportes
- `5fbeda8` merge del PR #49 en `dev`

---

## Sprint 5 — Unidad IV — Semana del 2026-10-12

### 2026-10-14 · 2,5 h

**Actividad**
Corregí la consulta de ocupación, que hacía falta para terminar la pantalla de reportes del frontend:
- Completé la consulta SQL de `ReportesRepository`, que estaba incompleta.
- Agregué por separado las asistencias y las reservas confirmadas de canchas y de clases, para no duplicar totales por las uniones.
- Incluí las sedes con reservas aunque no tengan asistencias; usé filtros parametrizados y fechas con límite final exclusivo.
- Agregué pruebas del servicio y un script de verificación de la consulta sobre PostgreSQL temporal con PGlite.

Verificación: build y typecheck aprobados, 9 pruebas aprobadas y la consulta comprobada con fechas límite, estados, filtros, resultados vacíos y reservas sin asistencia.

**Decisión**
- Mantuve el contrato del endpoint y el esquema: no apliqué migraciones ni modifiqué datos compartidos.
- El reporte devuelve solo las sedes con actividad en el período; las métricas que faltan dentro de esas sedes se expresan con cero.
- Publiqué la corrección en `feature/e1-fix-consulta-ocupacion` (PR #56).

**Problema o bloqueo**
- La consulta anterior tenía una CTE incompleta y no incorporaba bien las reservas de clases.
- Mi instalación local no tenía `@nestjs/jwt`, que el equipo ya había declarado; instalé las dependencias para poder compilar.
- No probé una sesión completa contra la base compartida.

**Commits**
- `d2ac371` fix(reportes): completar metricas de ocupacion por sede
- `444ac31` docs(log): registrar correccion de ocupacion y seguimiento TL
- `0f0f93a` merge de `dev` en `feature/e1-fix-consulta-ocupacion`
- `ee2ebaf` merge del PR #56 en `dev`

---

### 2026-10-14 · 1 h

**Actividad**
Como líder técnico revisé la dependencia entre la pantalla de ocupación del frontend y el backend, y separé la corrección y sus pruebas en una entrega que se pudiera revisar. Integré en `dev` los PR #52 (clases), #53 (calendario y horarios) y #55 (consulta de planes) de mis compañeros. Antes de fusionar #53 traje `dev` a la rama y agregué la validación de límites de fechas y turnos; antes de fusionar #55 traje `dev` y corregí la respuesta para conservar los identificadores de los planes. También reconcilié en `dev` el revert del PR #46 que había quedado en `main`, conservando los reportes integrados.

**Decisión**
Validar la corrección de ocupación antes de la aceptación del frontend y dejar registradas las limitaciones para el traspaso al siguiente líder técnico el 15/10.

**Problema o bloqueo**
Quedaron pendientes la revisión de los compañeros, la aceptación integrada y los acuerdos de la reunión del 14/10 a las 15:00.

**Commits**
- `242ee50` merge del PR #52 en `dev`
- `9dcad62` fix(calendario): integrar dev y validar limites de fechas y turnos
- `9693295` merge del PR #53 en `dev`
- `21818a6` fix(planes): preservar identificadores en respuesta e integrar dev
- `0e4e3f3` merge del PR #55 en `dev`
- `253fe89` merge: reconcile main revert preserving integrated reports

---

## Sprint 6 — Unidad V — Semana del 2026-10-19

### 2026-10-23 · 2 h

**Actividad**
Tarea: proteger los endpoints de reportes para el rol gerente.
- Protegí `GET /reportes/ingresos` y `GET /reportes/ocupacion` con `SupabaseAuthGuard` y `RolesGuard`, aplicados en `ReportesController` junto con `@Roles('gerente', 'admin')`, con el mismo patrón que `clases.controller.ts`.
- Documenté en Swagger el candado (`@ApiBearerAuth`) y las respuestas 401 y 403, y corregí el tipo de respuesta del 400 de ingresos.
- Escribí pruebas de integración HTTP con Supertest sobre los guards reales: 401 sin token o con `Authorization` mal formado, 403 para socio y recepcionista, 200 para gerente y admin, y 400 por rango de fechas inválido.
- Armé una base PostgreSQL temporal en memoria (PGlite con `pglite-prisma-adapter`), creada con el DDL de `schema.prisma` y un escenario de datos conocido (`test/utils/escenario-reportes.ts`), que pueden reutilizar las pruebas de los demás módulos.

Verificación: 20 suites y 151 pruebas aprobadas (13 nuevas) y ESLint sin errores en los archivos modificados.

**Decisión**
- Apliqué los guards a nivel de clase, para que cualquier endpoint futuro de reportes quede protegido por defecto.
- Incluí `admin` junto con `gerente` por consistencia con los demás controladores protegidos; si el equipo define que es solo para gerente, se cambia la constante `ROLES_REPORTES`.
- Generé los tokens de prueba con el mismo `JwtService` de la aplicación, para no depender de Supabase ni de la red, y sin mocks, como acordó el equipo.
- No hizo falta cambiar el frontend: el panel ya envía el token con el interceptor de Axios y las pantallas de ingresos y ocupación muestran el mensaje del servidor ante un 403.

**Problema o bloqueo**
- PGlite carga módulos nativos de Node con `import()` dinámico, que Jest no admite sin `--experimental-vm-modules`. Agregué una regla de transformación para los archivos `.cjs` en la configuración de Jest, para que `yarn test` funcione sin opciones extra.
- El `typecheck` de `dev` fallaba por un error previo en `M4-canchas/repositories/canchas.repository.ts` (`activo` no existe en `CanchaTipo` de `schema.prisma`). No era de esta tarea: se lo informé al líder técnico y verifiqué que mis archivos compilaran sin errores.
- Quedó pendiente la prueba manual en Swagger (`/api/docs`) con las cuentas compartidas de socio y gerente.

**Commits**
- `8356d75` feat(reportes): proteger endpoints con rol gerente
- `e68a09a` test(reportes): agregar pruebas de acceso por rol
- `daf7a31` docs(log): registrar proteccion de reportes por rol

---

### 2026-10-23 · 1,5 h

**Actividad**
Tarea: panel de gerente, CRUD de sedes y membresías y sede dinámica (parte backend).
- Revisé los CRUD de `/sedes`, `/ciudades` (M0-sedes) y `/planes` (M1-usuarios): las operaciones de escritura no tenían protección y cualquier cliente podía crear, modificar o dar de baja sedes y planes.
- Protegí `POST`, `PATCH` y `DELETE` de `/sedes`, `/ciudades` y `/planes` con `SupabaseAuthGuard`, `RolesGuard` y `@Roles('gerente', 'admin')`, con 401 y 403 documentados en Swagger.
- Escribí pruebas de integración HTTP sobre PGlite para sedes y ciudades (listado público solo de sedes activas; 401, 403 y 201 en el alta; 404 por ciudad inexistente; 400 por datos inválidos o campos no permitidos; actualización parcial y baja lógica) y para planes (catálogo público con precio numérico; 401, 403 y 201 en el alta con el nombre normalizado; 400 por duración inválida; edición y baja de un plan sin membresías).
- Extraje `test/utils/app-de-pruebas.ts` para levantar la aplicación de pruebas con los módulos reales y reutilizarla en reportes, sedes y planes.

Verificación: 22 suites y 172 pruebas aprobadas (1 pendiente `todo`) y ESLint sin errores en los archivos modificados.

**Decisión**
- Dejé públicos los `GET`, porque el registro de usuarios, la landing, el selector de sede del encabezado y la pantalla de membresías los consultan sin sesión.
- En `PlanesController` (módulo M1) solo agregué decoradores, sin modificar la lógica de `PlanesService`.

**Problema o bloqueo**
- Eliminar un plan con membresías asociadas devuelve 500 por la clave foránea de `membresia`. No modifiqué `PlanesService` porque pertenece a M1: lo dejé registrado como `it.todo` (responder 409) y el frontend muestra un mensaje claro en ese caso.
- Quedó pendiente el recorrido con la cuenta compartida de gerente.

**Commits**
- `0860270` feat(sedes): proteger sedes y ciudades por rol
- `9dff9a1` feat(planes): proteger gestion de planes por rol
- `60bc67d` docs(log): registrar parte backend de E11-T1

---

### 2026-10-23 · 6 h

**Actividad**
Tarea: migración a Prisma ORM, reportes y testing.
- Antes de migrar escribí pruebas de integración de `ReportesService` y `ReportesRepository` contra PostgreSQL temporal (PGlite), con un escenario de datos conocido, para fijar los resultados: ingresos consolidados (solo pagos aprobados y dentro del período), filtros por sede y concepto, estado sin distinguir mayúsculas y período vacío; ocupación con asistencias y reservas confirmadas, filtro por sede, sedes sin actividad y período vacío.
- Migré `obtenerIngresosPorSede` de SQL nativo (`$queryRaw` con `UNION ALL`) a `prisma.pago.findMany`, con filtros tipados y la suma por sede con `Prisma.Decimal`.
- Migré `obtenerMetricasOcupacionPorSede` a tres `groupBy` en paralelo, con la traducción de canchas y clases a su sede y los nombres de las sedes con actividad.
- Eliminé el script `test/reportes-ocupacion.sql-check.cjs`, que reemplazan las pruebas de integración.
- Registré la decisión en el ADR-018.

Verificación: las mismas pruebas pasan con el SQL anterior y con Prisma, ya no queda `$queryRaw` en `M6-reportes`, la suite completa del backend pasa y ESLint no marca errores en los archivos modificados.

**Decisión**
- Mantuve la firma de los métodos del repositorio: el servicio y el controlador no cambiaron, lo que muestra el beneficio del patrón Repository (ver [ADR-014](../adr/014-aplicar-patron-repository-para-acceso-a-datos.md)).
- Sumé los ingresos por sede en memoria, porque Prisma no agrupa por campos de tablas relacionadas. Alcanza para los reportes mensuales de la cadena; con millones de pagos por período convendría agregar en la base o precalcular (ver [ADR-018](../adr/018-agregacion-de-reportes-con-prisma-orm.md)).
- Resolví en la base los conteos de ocupación con `groupBy` y los combiné por sede en memoria.
- Hice un commit por consulta migrada y borré el SQL anterior recién cuando las pruebas pasaban.

**Problema o bloqueo**
- Prisma no permite agrupar por la sede de una relación: seleccioné solo los campos necesarios y combiné los resultados por sede. Verifiqué que Prisma resuelve las relaciones con una cantidad fija de consultas, sin N+1.
- Los tipos de Prisma se perdían al combinar consultas condicionales dentro de `Promise.all`; lo resolví con métodos privados tipados para traducir canchas y clases a sede.
- Quedó pendiente comparar en el panel los números con los datos compartidos.

**Commits**
- `33a94b1` test(reportes): agregar pruebas de ingresos y ocupacion
- `564869f` refactor(reportes): migrar ingresos a Prisma ORM
- `28b82f8` refactor(reportes): migrar ocupacion a Prisma ORM
- `889017d` docs(adr): agregar ADR-018 de reportes con Prisma
- `82ea9ba` docs(log): registrar migracion de reportes a Prisma

---

## Sprint 6 — Unidad V — Semana del 2026-10-26

### 2026-10-27 · 1 h

**Actividad**
Tarea: correcciones de la revisión de reportes, sedes y planes.
- Quité `admin` de `@Roles` en `ReportesController`, `SedeController`, `CiudadController` y `PlanesController`, porque ese rol no existe en el sistema: los reportes y el alta, la modificación y la baja de sedes, ciudades y planes quedan solo para `gerente`.
- Actualicé las descripciones de Swagger (401 y 403) y las pruebas de integración: quité los casos con token de admin y la baja lógica de sede ahora se prueba con token de gerente.
- Ajusté mis entradas anteriores de la bitácora al formato que usaba el equipo en ese momento: commits sin hash, sin enlace a Trello y sin códigos de tarea.

Verificación: 23 suites y 180 pruebas aprobadas (1 pendiente `todo`) y ESLint sin errores en los archivos modificados.

**Decisión**
`clases.controller.ts` (M3) también incluye `admin` en `@Roles`; no lo modifiqué porque pertenece a otro módulo, y queda para su responsable.

**Problema o bloqueo**
Ninguno.

**Commits**
- `83d73d3` fix(rbac): quitar rol admin de reportes, sedes y planes
- `1fc5901` docs(log): corregir formato y registrar correcciones

---

### 2026-10-27 · 2 h

**Actividad**
Tarea: CRUD de membresías de los socios para el gerente (parte backend).
- Revisé `/membresias` (M1): ya tenía alta, consultas y cambio de estado, pero sin protección; faltaban modificar y eliminar, y la respuesta no traía el socio, el plan ni el estado.
- Protegí con `SupabaseAuthGuard`, `RolesGuard` y `@Roles('gerente')` el alta, el listado general, el detalle, la modificación, el cambio de estado y la baja. Las consultas por usuario, que usan el socio y el control de acceso, quedaron como estaban.
- Agregué `GET /membresias/estados` con el catálogo de la tabla `membresia_estado`, para que el panel no tenga los estados escritos a mano.
- Agregué `PATCH /membresias/:id` para modificar la fecha de vencimiento y la renovación automática, con la validación de que el vencimiento no sea anterior al inicio.
- Agregué `DELETE /membresias/:id` para eliminar una membresía cargada por error; si ya tiene pagos responde 409 y se sugiere suspenderla.
- `MembresiaResponseDto` ahora incluye el plan (con precio numérico), el estado y los datos básicos del socio. En el alta, `fecha_fin` pasó a ser opcional: si no se envía, se calcula con la duración del plan (`calcularFechaFin`).
- Escribí pruebas de integración HTTP sobre PGlite: permisos (401 y 403), catálogo de estados, listado con filtros, detalle, alta con cálculo del vencimiento, cambio de estado, modificación y baja con pagos y sin pagos.

Verificación: 24 suites y 200 pruebas aprobadas (20 nuevas, 1 pendiente `todo`) y ESLint sin errores en los archivos modificados.

**Decisión**
- El cambio de estado sigue en `PATCH /membresias/:id/estado`, que ya existía; la modificación nueva solo toca el vencimiento y la renovación.
- Decidí no borrar las membresías con pagos: suspenderlas conserva la facturación y los reportes sin romper las claves foráneas de `pago`.

**Problema o bloqueo**
Al serializar el precio del plan anidado, class-transformer intentaba construir un `Decimal` vacío y el listado respondía 500; lo resolví declarando el campo como número (`@Type(() => Number)`).

**Commits**
- `c271b5d` merge de `dev` en `feature/e11-t1-crud-membresias`
- `c469f36` feat(membresias): completar CRUD de membresias para el gerente
- `90f6065` test(membresias): agregar pruebas de integracion del CRUD
- `a8abdc1` docs(log): registrar CRUD de membresias

---

## Sprint 7 — Unidad VI — Semana del 2026-11-02

### 2026-11-06 · 6 h

**Actividad**
Tarea: CRUD de calendario, excepciones por sede y horario semanal para el gerente (parte backend).
- `/calendario` (M0): CRUD del calendario general, con los feriados nacionales o de toda la cadena: listado con filtro por rango (`desde` y `hasta`), detalle, alta, modificación y baja. Al marcar una fecha como feriado, por defecto queda como día no hábil.
- `/sedes/:idSede/calendario`: CRUD de las excepciones de cada sede (feriados locales, cierres y días con horario especial). Se cargan con la fecha: si no está en el calendario general, se agrega como día común. Sin horas es un cierre total; con horas, la sede abre con horario especial (formato HH:mm y apertura anterior al cierre). La respuesta incluye la fecha y si es feriado.
- `/sedes/:idSede/horarios`: CRUD del horario semanal, con un registro por día (0 domingo a 6 sábado) que indica apertura y cierre, o que la sede no abre.
- Todo el CRUD quedó protegido con `SupabaseAuthGuard`, `RolesGuard` y `@Roles('gerente')` y documentado en Swagger. `GET /sedes/:id/horario-operativo` sigue siendo público y ya toma lo que se carga con estos endpoints.
- Escribí pruebas de integración HTTP sobre PGlite: permisos (401 y 403), validaciones, fechas y días repetidos (409), sede inexistente (404), alcance por sede, baja de una fecha con excepciones (409) e impacto en el horario operativo.

Verificación: 2 suites y 33 pruebas aprobadas en el módulo de sedes (20 nuevas), typecheck sin errores nuevos y ESLint sin errores en los archivos nuevos. En el resto del backend siguen fallando 3 pruebas de M2 (accesos y QR) que ya fallaban en `dev` y no toqué.

**Decisión**
- Decidí no consultar antes de escribir: la existencia de la sede y los duplicados los valida la base con sus claves foráneas y restricciones únicas, y los errores se traducen a 404 o 409. Así cada operación hace una o dos consultas a la base (lo medí sobre PGlite), por la latencia de Supabase.
- Las modificaciones y bajas de excepciones no usan `include`: con `include`, Prisma abre una transacción y suma idas a la base, así que la fecha se busca aparte.
- El alta de una excepción en una fecha nueva hace un upsert del día y después el alta, sin transacción: si el alta falla, la fecha queda en el calendario como día común, que no cambia el horario de ninguna sede.
- Una fecha del calendario general con excepciones en alguna sede no se puede borrar (409): primero hay que borrar sus excepciones.
- Las fechas se reciben y se devuelven como `YYYY-MM-DD`, para evitar corrimientos por zona horaria.
- Todos los endpoints nuevos, incluidos los GET, son solo para el gerente, como pide la tarea. Las pantallas de socios siguen usando `GET /sedes/:id/horario-operativo` y la disponibilidad de canchas.

**Problema o bloqueo**
Al borrar una fecha referenciada, PostgreSQL responde con el código 23001 (la clave foránea es `ON DELETE RESTRICT`) y Prisma lo informa como el error genérico P2039 en lugar de P2003; contemplé ese caso para responder 409.

**Commits**
- `25974a6` feat(calendario): agregar CRUD del calendario general para el gerente
- `d70bc23` feat(calendario): agregar CRUD de excepciones de calendario por sede
- `9f24a0a` feat(sedes): agregar CRUD de horarios semanales por sede
- `7fa4f36` test(calendario): agregar pruebas de integracion del CRUD de calendario y horarios
- `3c9c5a9` docs(log): registrar CRUD de calendario y horarios

---

## Sprint 7 — Unidad VI — Semana del 2026-11-09

### 2026-11-12 · 4 h

**Actividad**
Tarea: guards en todos los endpoints de sedes y reportes y limpieza de valores fijos (parte backend).
- `GET /sedes/:id/horario-operativo` dejó de inventar horarios: antes, una sede sin horario cargado para ese día figuraba abierta de 08:00 a 22:00, y una excepción abierta sin horas, de 08:00 a 20:00. Ahora todo sale de la base: un día sin horario cargado figura cerrado con su motivo, una excepción abierta sin horas usa el horario semanal y una sede que no existe responde 404.
- Llevé las constantes de M0 a `constants/sedes.constants.ts` (hora de un día sin atención, motivos de cierre y roles con cuenta), que usan el horario operativo y el CRUD de horarios. Quité del servicio y del repositorio de sedes el código viejo comentado.
- Puse guards en todos los endpoints de M0 y M6. El detalle de sedes y ciudades y el horario operativo piden sesión con cualquier rol. Los listados `GET /sedes` y `GET /ciudades` siguen sin sesión, porque la landing y el registro los consultan sin token, y quedan protegidos por un guard nuevo, `LimiteConsultasPublicasGuard`, que limita las consultas por IP y por minuto (responde 429; se configura con `LIMITE_CONSULTAS_PUBLICAS`, 120 por defecto).
- En reportes, los estados que cuentan (pago «Aprobado» y reserva «Confirmada») pasaron a `constants/reportes.constants.ts`, como en M4 y M5, y el concepto del reporte de ingresos usa el enum del DTO en lugar de textos sueltos.
- Pruebas: unitarias del horario operativo y del guard; de integración HTTP de permisos (401 en los endpoints con sesión), del horario operativo (semanal, día cerrado, sin horario, excepciones, 404 y 400) y del límite de consultas (429). Las pruebas del calendario que pedían el horario operativo ahora mandan token.

Verificación: 18 suites y 157 pruebas aprobadas en sedes, reportes, canchas y `common` (20 nuevas); typecheck y ESLint sin errores; cada commit compila y pasa sus pruebas. En el resto del backend siguen fallando 19 pruebas de M2 (accesos y QR) que ya fallaban en `dev` y no toqué.

**Decisión**
- Sin horario cargado, la sede figura cerrada en lugar de recibir un horario inventado; el gerente lo carga desde la pantalla de horarios semanales. La existencia de la sede se consulta solo en ese caso, para no sumar una consulta a los casos habituales.
- Los listados públicos no pueden exigir sesión sin romper la landing y el registro, así que su protección es el límite de consultas. El conteo vive en la memoria del proceso: detrás de un proxy hay que habilitar `trust proxy` para que cada cliente tenga su IP.
- El guard nuevo va en `common/guards` porque no depende de sedes y lo puede usar otro endpoint público.

**Problema o bloqueo**
M3 valida el horario de las clases con su propio horario por defecto (08:00 a 22:00) cuando la sede no tiene horario semanal cargado. Con el horario de todas las sedes cargado no hay diferencia; queda para su responsable si lo alinea.

**Commits**
- `15bb54a` refactor(sedes): quitar horarios fijos del horario operativo
- `416a436` feat(common): agregar guard de limite de consultas publicas
- `94b6512` feat(sedes): proteger con guards todos los endpoints de sedes y ciudades
- `138869c` refactor(reportes): quitar valores fijos de estados y conceptos
- `5936d42` docs(log): registrar guards y limpieza de sedes y reportes

---

## Sprint 8 — Cierre — Semana del 2026-11-16

### 2026-11-18 · 2,5 h

**Actividad**
Tarea: arreglar los dos errores del panel de gerencia que informó el líder técnico (parte backend).
- Agregué `GET /reportes/socios-activos` en M6: socios con una membresía Activa que ya empezó y todavía no venció en la fecha consultada (por defecto, hoy en Argentina), en total y por sede de origen. El conteo se hace en la base con un `groupBy` por la sede del usuario.
- Agregué `GET /reportes/aforo`: aforo actual y máximo de todas las sedes activas en una sola respuesta, con la misma regla que `GET /accesos/aforo/:id` (registros de acceso sin egreso).
- Los dos endpoints son solo para el gerente, como el resto de los reportes, y están documentados en Swagger.
- Amplié el escenario de PGlite con socios, membresías suspendidas, vencidas y que empiezan más adelante, un registro con egreso y una sede dada de baja. Agregué pruebas de integración del servicio y pruebas HTTP de permisos (401 y 403), de fecha inválida (400) y de resultados.

Verificación: 3 suites y 45 pruebas aprobadas en M6 (22 nuevas); suite completa del backend con 42 suites y 394 pruebas aprobadas (1 pendiente `todo`); typecheck y ESLint sin errores; cada commit compila y pasa sus pruebas.

**Decisión**
- Puse los endpoints nuevos en M6, que ya concentra los reportes del gerente, en lugar de modificar M1 o M2, que tienen otros responsables.
- Un socio activo tiene una membresía Activa con fecha de inicio igual o anterior a la consultada y fecha de fin igual o posterior. Cada socio cuenta una vez aunque tenga dos membresías activas.
- La fecha de hoy se calcula con la zona horaria de Argentina explícita, para no depender del huso horario del servidor.

**Problema o bloqueo**
- Desde el 14/11, `GET /usuarios` devuelve el listado paginado (`{ data, meta }`, 10 por página). El panel esperaba un arreglo, así que el indicador de socios activos quedaba "No disponible" y la pantalla de membresías no cargaba.
- El panel pedía el aforo con `GET /accesos/aforo/:id` una vez por sede.
- Quedó pendiente probarlo con la cuenta de gerente contra la base compartida.

**Commits**
- `3bb165d` feat(reportes): agregar socios activos y aforo de todas las sedes
- `9730772` test(reportes): agregar pruebas de socios activos y aforo por sede

---
