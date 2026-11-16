#### 24/08/2026 - 05/09/2026

#### Marcos Caraballo, Angelina Vialle, Facundo Agüero, Matías Sillen | Roles: Diseñadores de arquitectura

- **Actividades:** Reunión de equipo para modelar el sistema completo en Visual Paradigm (Contexto C1, Contenedores C2 y Componentes C3).
- **Decisiones:**
  - Adoptar Supabase como contenedor para resolver base de datos PostgreSQL, storage de comprobantes y notificaciones en tiempo real.
  - Separar el frontend en una SPA (Vue.js) y un contenedor de contenido estático (Nginx).
  - Diseñar el backend (NestJS) estructurado en módulos claros: canchas, pagos con webhooks de Mercado Pago, accesos y clases grupales con lista de espera.
- **Dificultades:** Definir cómo interactúa el cliente web tanto con la API de NestJS como con los servicios en tiempo real de Supabase.

---

#### 16/09/2026

#### Facundo Agüero | Rol: Backend Developer

- **Actividades:** Configurar el cliente de Prisma, crear el `PrismaService` y verificar la conexión del backend con PostgreSQL.
- **Decisiones:**
  - Definir `PrismaModule` como módulo global e implementar `PrismaService` como singleton para reutilizar una única conexión a la base de datos.
  - Manejar las credenciales de la base de datos a través de variables de entorno.
- **Dificultades:** Error de compatibilidad al instanciar el cliente de Prisma por la versión del proyecto; se solucionó agregando el adaptador correspondiente para PostgreSQL.
- **Commits:** `feat(database): configure Prisma singleton connection`

---

#### 22/08/2026

#### Facundo Agüero | Rol: Dev

Rama: feature/auth-supabase
Actividades realizadas:
Se implementó la autenticación mediante Supabase Auth. Se creó SupabaseService, SupabaseAuthGuard, la interfaz AuthenticatedUser y los decoradores CurrentUser / CurrentUserId. El usuario autenticado por Supabase se vincula actualmente con el usuario de FitZone mediante el email.
Durante las pruebas de integración se realizaron ajustes en M1 Usuarios y M2 Accesos necesarios para completar el flujo de autenticación.
Cambios relacionados con otros módulos:

- M1 Usuarios: se agregó findByEmail() para localizar al usuario local autenticado.
- M1 Usuarios: se corrigieron los nombres de relaciones Prisma en defaultIncludes (usuario_estado y usuario_rol).
- M1 Usuarios: se agregó await a repository.create() antes de transformar la respuesta.
- M2 Accesos: se importó UsuariosModule para que SupabaseAuthGuard pueda resolver UsuariosService.
- Dependencias: se agregó jsonwebtoken, requerido por el sistema de QR de Accesos.
  Problemas encontrados / soluciones:
- La conexión directa de Supabase utilizaba IPv6 y no era accesible desde la red local. Se utilizó Session Pooler.
- La base no contenía datos iniciales de sede, usuario_estado ni rol.
- Se detectó que el código supone id_usuario_estado = 1 como activo y 3 como desactivado, pero actualmente no existe un seed que cree esos valores.
- Se corrigieron relaciones Prisma inválidas que impedían consultar usuarios.
  Pruebas realizadas:
- Sin token → 401.
- Token inválido → 401.
- Token Supabase válido sin usuario local → 403.
- Token Supabase válido con usuario local → 200.
- npm run typecheck sin errores.
  Observaciones:
  La vinculación Supabase ↔ Usuario FitZone se realiza actualmente mediante email. Queda pendiente definir con el equipo si a futuro se almacenará el UUID de Supabase en la tabla de usuarios y agregar seeds para datos maestros.

---

#### 17/09/2026 - 21/09/2026

#### Facundo Agüero | Rol: Backend Developer

- **Actividades:**
  - Configuración de Swagger para generar la documentación inicial de la API y poder visualizar los endpoints desde `/api/docs`.
  - Configuración global de `ValidationPipe` para validar los datos recibidos por la API y rechazar propiedades no definidas en los DTOs.
  - Creación de los DTOs de Ciudad y Sede para las operaciones de alta y actualización, utilizando `class-validator` y `PartialType`.
  - Implementación de los repositorios de Ciudad y Sede utilizando Prisma y el patrón Repository.
  - Implementación de operaciones de consulta, creación, actualización y borrado lógico de ciudades y sedes.
  - Implementación de los servicios de Ciudad y Sede, incorporando validaciones de existencia y de la relación entre Sede y Ciudad.
  - Implementación de los controladores REST para Ciudad y Sede con endpoints GET, POST, PATCH y DELETE.
  - Documentación de los endpoints mediante Swagger, incluyendo operaciones, parámetros y posibles respuestas HTTP.
  - Creación de `SedesModule` y registro de controladores, servicios y repositorios.
  - Integración de `SedesModule` en `AppModule`.
  - Verificación de los archivos implementados mediante ESLint y Prettier.

- **Decisiones:**
  - Configurar `ValidationPipe` de forma global para mantener un mismo criterio de validación en todos los módulos.
  - Utilizar `PartialType` en los DTOs de actualización para reutilizar las validaciones de los DTOs de creación y permitir modificaciones parciales.
  - Mantener Ciudad y Sede dentro del módulo `M0-sedes`, ya que ambas entidades forman parte de la gestión de sedes.
  - Utilizar borrado lógico para Ciudad y Sede mediante el campo `activo`, evitando eliminar físicamente los registros.
  - Mantener la validación de existencia de recursos en la capa Service y el acceso a datos encapsulado en los Repositories.
  - Validar la existencia de la Ciudad asociada antes de crear una Sede o modificar su `id_ciudad`.
- **Dificultades:**
  - Durante la configuración de Swagger se realizaron cambios accidentales en `main.ts`. Se utilizó Git para restaurar el archivo al último estado confirmado y continuar desde una versión estable.
  - Se realizaron algunas correcciones menores de sintaxis y formato en los DTOs antes de realizar el commit.
  - La verificación global mediante `npm run start:dev` quedó bloqueada por errores de compilación pertenecientes a los módulos `M2-accesos` y `M5-pagos`, ajenos a `M0-sedes`. Los archivos implementados en `M0-sedes` fueron verificados con ESLint y Prettier sin errores.

- **Commits:**
  - `feat(api): configure Swagger and global validation`
  - `feat(sedes): add ciudad and sede DTOs`
  - `e9b9081 feat(sedes): agregar ciudad y sede repositories`
  - `a545e72 feat(sedes): agregar servicios de ciudad y sede`
  - `699c7ad feat(sedes): agregar controllers y módulo de sedes`
  - `a87c4e6 docs(sedes): documentar endpoints con Swagger`

---

#### 30/09/2026

#### Facundo Agüero | Rol: Desarrollador Backend

Tarea 5 — Reporte Consolidado de Ingresos Multi-Sede

- Se agregaron DTOs de consulta y respuesta.
- Se implementó la consulta de ingresos aprobados por sede.
- Se consolidaron pagos de membresías y reservas de canchas.
- Se agregó filtrado por rango de fechas, sede y concepto.
- Se implementó el servicio y el endpoint GET /reportes/ingresos.
- Se integró ReportesModule al sistema.

Tarea 6 — Métricas de Ocupación por Sede

- Se agregaron DTOs para consulta y respuesta de métricas.
- Se implementaron métricas de asistencia mediante RegistroAcceso.
- Se incorporó cantidad de reservas confirmadas de canchas.
- Se incorporó cantidad de reservas confirmadas de clases grupales.
- Se contemplan sedes sin actividad mediante valores en cero.
- Se agregó filtrado por rango de fechas y sede.
- Se implementó el servicio y el endpoint GET /reportes/ocupacion.
- Se reutilizó la configuración existente de ReportesModule.

---

#### 14/10/2026

#### Facundo Agüero | Rol: Desarrollador Backend

- **Tarea:** Corrección de la consulta de ocupación necesaria para completar el frontend de reportes.
- **Actividades:**
  - Corrección de la consulta SQL incompleta de `ReportesRepository`.
  - Agregación independiente de asistencias, reservas confirmadas de canchas y clases, sin duplicar totales por las uniones.
  - Inclusión de sedes con reservas aunque no tengan asistencias; filtros parametrizados y fechas con límite final exclusivo.
  - Incorporación de pruebas del servicio y un script de verificación SQL sobre PostgreSQL temporal con PGlite.
- **Decisiones:**
  - Mantener el contrato del endpoint y el esquema; no aplicar migraciones ni modificar datos compartidos.
  - Devolver únicamente sedes con actividad en el período. Las métricas faltantes dentro de esas sedes se expresan con cero.
  - Publicar la corrección en `feature/e1-fix-consulta-ocupacion`.
- **Dificultades y resolución:**
  - El código anterior tenía una CTE incompleta y no incorporaba correctamente las reservas de clases.
  - La instalación local no contenía `@nestjs/jwt`, ya declarado por el equipo; se instalaron las dependencias para compilar.
- **Verificación:** Build y typecheck aprobados; 9 pruebas aprobadas; consulta SQL comprobada con fechas límite, estados, filtros, resultados vacíos y reservas sin asistencia. No se probó una sesión completa contra la base compartida.
- **Commits:** `fix(reportes): completar metricas de ocupacion por sede`

---

#### 14/10/2026

#### Facundo Agüero | Rol: Team Leader

- **Actividades:** Revisión de la dependencia entre la pantalla de ocupación y el backend; separación de la corrección y sus pruebas en una entrega revisable.
- **Decisiones:** Validar la corrección antes de la aceptación del frontend y mantener el registro de limitaciones para el traspaso del 15/10.
- **Pendientes:** Revisión de compañeros, aceptación integrada y acuerdos de la reunión del 14/10 a las 15:00.

---

- **Commits:**
- `chore(env): configurar service_role key de supabase para saltar rls y permitir subida de fotos`

---

#### 14/10/2026

#### Facundo Agüero | Rol: Team Leader

- **Commits:**
- `chore(env): configurar service_role key de supabase para saltar rls y permitir subida de fotos`

---

#### 23/10/2026

#### Facundo Agüero | Rol: Desarrollador Backend

- **Tarea:** Backend — Proteger endpoints de reportes para rol gerente.
- **Actividades:**
  - Protección de `GET /reportes/ingresos` y `GET /reportes/ocupacion` con `SupabaseAuthGuard` y `RolesGuard`, aplicados a nivel de `ReportesController` junto con `@Roles('gerente', 'admin')`, reutilizando el patrón de `clases.controller.ts`.
  - Documentación en Swagger del candado (`@ApiBearerAuth`) y de las respuestas 401 y 403; corrección del tipo de respuesta del 400 de ingresos.
  - Pruebas de integración HTTP con Supertest sobre los guards reales: 401 sin token o con `Authorization` mal formado, 403 para socio y recepcionista, 200 para gerente y admin, y validación 400 del rango de fechas.
  - Base PostgreSQL temporal en memoria (PGlite + `pglite-prisma-adapter`) creada con el DDL de `schema.prisma` y un escenario de datos conocido (`test/utils/escenario-reportes.ts`), reutilizable por las pruebas de los demás módulos.
- **Decisiones:**
  - Aplicar los guards a nivel de clase para que cualquier endpoint futuro de reportes quede protegido por defecto.
  - Incluir `admin` junto con `gerente` por consistencia con los demás controladores protegidos; si el equipo define "solo gerente", se modifica la constante `ROLES_REPORTES`.
  - Generar los tokens de prueba con el mismo `JwtService` de la aplicación para no depender de Supabase ni de la red, y no usar mocks (regla del equipo).
  - No se requirieron cambios en el frontend: el panel ya envía el token por el interceptor de Axios y las pantallas de ingresos y ocupación muestran el mensaje del servidor ante un 403.
- **Dificultades y resolución:**
  - PGlite carga módulos nativos de Node con `import()` dinámico, que Jest no admite sin `--experimental-vm-modules`. Se agregó una regla de transformación para archivos `.cjs` en la configuración de Jest, de modo que `yarn test` funcione sin flags adicionales.
  - El `typecheck` de `dev` falla por un error previo en `M4-canchas/repositories/canchas.repository.ts` (`activo` no existe en `CanchaTipo` del `schema.prisma`). No corresponde a esta tarea y se informó al TL; los archivos modificados compilan sin errores.
- **Verificación:** 20 suites y 151 pruebas aprobadas (13 nuevas). ESLint sin errores en los archivos modificados. Pendiente: prueba manual en Swagger (`/api/docs`) con las cuentas compartidas de socio y gerente.
- **Commits:**
  - `feat(reportes): proteger endpoints con rol gerente`
  - `test(reportes): agregar pruebas de acceso por rol`

---

#### 23/10/2026

#### Facundo Agüero | Rol: Desarrollador Backend

- **Tarea:** Panel de Gerente, CRUD Sedes/Membresías y Sede Dinámica (parte backend).
- **Actividades:**
  - Revisión de los CRUD existentes de `/sedes`, `/ciudades` (M0-sedes) y `/planes` (M1-usuarios): las operaciones de escritura no tenían protección y cualquier cliente podía crear, modificar o dar de baja sedes y planes.
  - Protección de `POST`, `PATCH` y `DELETE` de `/sedes`, `/ciudades` y `/planes` con `SupabaseAuthGuard`, `RolesGuard` y `@Roles('gerente', 'admin')`, con 401 y 403 documentados en Swagger.
  - Pruebas de integración HTTP sobre PGlite para sedes y ciudades: listado público solo de sedes activas, 401/403/201 en el alta, 404 por ciudad inexistente, 400 por datos inválidos o campos no permitidos, actualización parcial y baja lógica.
  - Pruebas de integración para planes: catálogo público con precio numérico, 401/403/201 en el alta con normalización del nombre, 400 por duración inválida, edición y baja de un plan sin membresías.
  - Extracción de `test/utils/app-de-pruebas.ts` para levantar la aplicación de pruebas con los módulos reales y reutilizarla en reportes, sedes y planes.
- **Decisiones:**
  - Mantener públicos los `GET`: el registro de usuarios, la landing, el selector de sede del encabezado y la pantalla de membresías los consultan sin sesión.
  - En `PlanesController` (módulo M1) solo se agregaron decoradores, sin modificar la lógica de `PlanesService`.
- **Dificultades y resolución:**
  - Eliminar un plan con membresías asociadas devuelve 500 por la clave foránea de `membresia`. No se modificó `PlanesService` por pertenecer a M1: queda registrado como `it.todo` (responder 409) y el frontend muestra un mensaje claro en ese caso.
- **Verificación:** 22 suites y 172 pruebas aprobadas (1 pendiente `todo`). ESLint sin errores en los archivos modificados. Pendiente: recorrido con la cuenta compartida de gerente.
- **Commits:**
  - `feat(sedes): proteger sedes y ciudades por rol`
  - `feat(planes): proteger gestion de planes por rol`

---

#### 23/10/2026

#### Facundo Agüero | Rol: Desarrollador Backend

- **Tarea:** Migración a Prisma ORM, Reportes y Testing.
- **Actividades:**
  - Pruebas de integración de `ReportesService` y `ReportesRepository` contra PostgreSQL temporal (PGlite) con un escenario de datos conocido, escritas **antes** de migrar para fijar los resultados: ingresos consolidados (solo pagos aprobados y dentro del período), filtros por sede y concepto, estado sin distinguir mayúsculas, período vacío; ocupación con asistencias y reservas confirmadas, filtro por sede, sedes sin actividad y período vacío.
  - Migración de `obtenerIngresosPorSede` de SQL nativo (`$queryRaw` con `UNION ALL`) a `prisma.pago.findMany` con filtros tipados y suma por sede con `Prisma.Decimal`.
  - Migración de `obtenerMetricasOcupacionPorSede` a tres `groupBy` en paralelo, traducción de canchas y clases a su sede y nombres de las sedes con actividad.
  - Eliminación del script `test/reportes-ocupacion.sql-check.cjs`, reemplazado por las pruebas de integración.
  - Registro de la decisión en el ADR-018.
- **Decisiones:**
  - Mantener la firma de los métodos del repository: el service y el controller no cambiaron, lo que muestra el beneficio del patrón Repository (ADR-014).
  - Sumar los ingresos por sede en memoria, porque Prisma no agrupa por campos de tablas relacionadas. Es adecuado para reportes mensuales de la cadena; con millones de pagos por período convendría agregar en la base o precalcular (detallado en el ADR-018).
  - Resolver en la base los conteos de ocupación con `groupBy` y combinar por sede en memoria.
  - Un commit por consulta migrada y el borrado del SQL anterior recién con las pruebas pasando.
- **Dificultades y resolución:**
  - Prisma no permite agrupar por la sede de una relación: se seleccionan solo los campos necesarios y se combinan los resultados por sede. Se verificó que Prisma resuelve las relaciones con una cantidad fija de consultas (sin N+1).
  - Los tipos de Prisma se perdían al combinar consultas condicionales dentro de `Promise.all`; se resolvió con métodos privados tipados para traducir canchas y clases a sede.
- **Verificación:** las mismas pruebas pasan con el SQL anterior y con Prisma; ya no queda `$queryRaw` en `M6-reportes`. Suite completa del backend aprobada; ESLint sin errores en los archivos modificados. Pendiente: comparar en el panel los números con los datos compartidos.
- **Commits:**
  - `test(reportes): agregar pruebas de ingresos y ocupacion`
  - `refactor(reportes): migrar ingresos a Prisma ORM`
  - `refactor(reportes): migrar ocupacion a Prisma ORM`
  - `docs(adr): agregar ADR-018 de reportes con Prisma`

---

#### 27/10/2026

#### Facundo Agüero | Rol: Desarrollador Backend

- **Tarea:** Correcciones de la revisión de reportes, sedes y planes.
- **Actividades:**
  - Se quitó `admin` de `@Roles` en `ReportesController`, `SedeController`, `CiudadController` y `PlanesController`, porque ese rol no existe en el sistema: reportes y el alta, la modificación y la baja de sedes, ciudades y planes quedan solo para `gerente`.
  - Se actualizaron las descripciones de Swagger (401 y 403) y las pruebas de integración: se quitaron los casos con token de admin y la baja lógica de sede se prueba con token de gerente.
  - Se ajustó el formato de mis entradas anteriores de esta bitácora: commits sin hash, sin enlace a Trello y sin códigos de tarea, como en el resto del equipo.
- **Decisiones:**
  - `clases.controller.ts` (M3) también incluye `admin` en `@Roles`; no se modificó por pertenecer a otro módulo; queda para su responsable.
- **Dificultades:** Ninguna.
- **Verificación:** 23 suites y 180 pruebas aprobadas (1 pendiente `todo`). ESLint sin errores en los archivos modificados.
- **Commits:**
  - `fix(rbac): quitar rol admin de reportes, sedes y planes`
  - `docs(log): corregir formato y registrar correcciones`

---

#### 27/10/2026

#### Facundo Agüero | Rol: Desarrollador Backend

- **Tarea:** CRUD de membresías de los socios para el gerente (parte backend).
- **Actividades:**
  - Revisión de `/membresias` (M1): ya tenía alta, consultas y cambio de estado, pero sin protección; faltaban modificar y eliminar, y la respuesta no traía el socio, el plan ni el estado.
  - Protección con `SupabaseAuthGuard`, `RolesGuard` y `@Roles('gerente')` del alta, el listado general, el detalle, la modificación, el cambio de estado y la baja. Las consultas por usuario, que usan el socio y el control de acceso, siguen como estaban.
  - Nuevo `GET /membresias/estados` con el catálogo de la tabla `membresia_estado`, para que el panel no tenga los estados escritos a mano.
  - Nuevo `PATCH /membresias/:id` para modificar la fecha de vencimiento y la renovación automática, con validación de que el vencimiento no sea anterior al inicio.
  - Nuevo `DELETE /membresias/:id` para eliminar una membresía cargada por error; si ya tiene pagos responde 409 y se sugiere suspenderla.
  - `MembresiaResponseDto` ahora incluye el plan (con precio numérico), el estado y los datos básicos del socio. En el alta, `fecha_fin` pasa a ser opcional: si no se envía, se calcula con la duración del plan (`calcularFechaFin`).
  - Pruebas de integración HTTP sobre PGlite: permisos (401/403), catálogo de estados, listado con filtros, detalle, alta con cálculo del vencimiento, cambio de estado, modificación y baja con y sin pagos.
- **Decisiones:**
  - El cambio de estado sigue en `PATCH /membresias/:id/estado`, que ya existía; la modificación nueva solo toca vencimiento y renovación.
  - No borrar membresías con pagos: suspenderlas conserva la facturación y los reportes sin romper las claves foráneas de `pago`.
- **Dificultades:**
  - Al serializar el precio del plan anidado, class-transformer intentaba construir un `Decimal` vacío y el listado respondía 500; se resolvió declarando el campo como número (`@Type(() => Number)`).
- **Verificación:** 24 suites y 200 pruebas aprobadas (20 nuevas, 1 pendiente `todo`). ESLint sin errores en los archivos modificados.
- **Commits:**
  - `feat(membresias): completar CRUD de membresias para el gerente`
  - `test(membresias): agregar pruebas de integracion del CRUD`
  - `docs(log): registrar CRUD de membresias`

---

#### 06/11/2026

#### Facundo Agüero | Rol: Desarrollador Backend

- **Tarea:** CRUD de calendario, excepciones por sede y horario semanal para el gerente (parte backend).
- **Actividades:**
  - `/calendario` (M0): CRUD del calendario general, con los feriados nacionales o de toda la cadena: listado con filtro por rango (`desde` y `hasta`), detalle, alta, modificación y baja. Al marcar una fecha como feriado, por defecto queda como día no hábil.
  - `/sedes/:idSede/calendario`: CRUD de las excepciones de cada sede (feriados locales, cierres y días con horario especial). Se cargan con la fecha: si no está en el calendario general, se agrega como día común. Sin horas es un cierre total; con horas, la sede abre con horario especial (formato HH:mm y apertura anterior al cierre). La respuesta incluye la fecha y si es feriado.
  - `/sedes/:idSede/horarios`: CRUD del horario semanal, con un registro por día (0 domingo a 6 sábado) que indica apertura y cierre, o que la sede no abre.
  - Todo el CRUD queda protegido con `SupabaseAuthGuard`, `RolesGuard` y `@Roles('gerente')` y documentado en Swagger. `GET /sedes/:id/horario-operativo` sigue siendo público y ya toma lo que se carga con estos endpoints.
  - Pruebas de integración HTTP sobre PGlite: permisos (401 y 403), validaciones, fechas y días repetidos (409), sede inexistente (404), alcance por sede, baja de una fecha con excepciones (409) e impacto en el horario operativo.
- **Decisiones:**
  - No consultar antes de escribir: la existencia de la sede y los duplicados los valida la base con sus claves foráneas y restricciones únicas, y los errores se traducen a 404 o 409. Así cada operación hace una o dos consultas a la base (medido sobre PGlite), por la latencia de Supabase.
  - Las modificaciones y bajas de excepciones no usan `include`: con `include`, Prisma abre una transacción y suma idas a la base, así que la fecha se busca aparte.
  - El alta de una excepción en una fecha nueva hace un upsert del día y después el alta, sin transacción: si el alta falla, la fecha queda en el calendario como día común, que no cambia el horario de ninguna sede.
  - Una fecha del calendario general con excepciones en alguna sede no se puede borrar (409): primero hay que borrar sus excepciones.
  - Las fechas se reciben y se devuelven como `YYYY-MM-DD` para evitar corrimientos por zona horaria.
  - Todos los endpoints nuevos, incluidos los GET, son solo para el gerente, como pide la tarea. Las pantallas de socios siguen usando `GET /sedes/:id/horario-operativo` y la disponibilidad de canchas.
- **Dificultades:**
  - Al borrar una fecha referenciada, PostgreSQL responde con el código 23001 (la clave foránea es `ON DELETE RESTRICT`) y Prisma lo informa como error genérico P2039 en lugar de P2003; se contempló ese caso para responder 409.
- **Verificación:** 2 suites y 33 pruebas aprobadas en el módulo de sedes (20 nuevas). En el resto del backend siguen fallando 3 pruebas de M2 (accesos y QR) que ya fallaban en `dev` y no se tocaron. Typecheck sin errores nuevos y ESLint sin errores en los archivos nuevos.
- **Commits:**
  - `feat(calendario): agregar CRUD del calendario general para el gerente`
  - `feat(calendario): agregar CRUD de excepciones de calendario por sede`
  - `feat(sedes): agregar CRUD de horarios semanales por sede`
  - `test(calendario): agregar pruebas de integracion del CRUD de calendario y horarios`
  - `docs(log): registrar CRUD de calendario y horarios`

---

#### 12/11/2026

#### Facundo Agüero | Rol: Desarrollador Backend

- **Tarea:** Guards en todos los endpoints de sedes y reportes y limpieza de valores fijos (parte backend).
- **Actividades:**
  - `GET /sedes/:id/horario-operativo` deja de inventar horarios: antes, una sede sin horario cargado para ese día figuraba abierta de 08:00 a 22:00 y una excepción abierta sin horas, de 08:00 a 20:00. Ahora todo sale de la base: un día sin horario cargado figura cerrado con su motivo, una excepción abierta sin horas usa el horario semanal y una sede que no existe responde 404.
  - Constantes de M0 en `constants/sedes.constants.ts` (hora de un día sin atención, motivos de cierre y roles con cuenta), usadas por el horario operativo y el CRUD de horarios. Se quitó del servicio y del repositorio de sedes el código viejo comentado.
  - Guards en todos los endpoints de M0 y M6. El detalle de sedes y ciudades y el horario operativo piden sesión con cualquier rol. Los listados `GET /sedes` y `GET /ciudades` siguen sin sesión, porque la landing y el registro los consultan sin token, y quedan protegidos por un guard nuevo, `LimiteConsultasPublicasGuard`, que limita las consultas por IP y por minuto (responde 429; se configura con `LIMITE_CONSULTAS_PUBLICAS`, 120 por defecto).
  - Reportes: los estados que cuentan (pago "Aprobado" y reserva "Confirmada") pasan a `constants/reportes.constants.ts`, como en M4 y M5, y el concepto del reporte de ingresos usa el enum del DTO en lugar de textos sueltos.
  - Pruebas: unitarias del horario operativo y del guard; integración HTTP de permisos (401 en los endpoints con sesión), horario operativo (semanal, día cerrado, sin horario, excepciones, 404 y 400) y límite de consultas (429). Las pruebas del calendario que pedían el horario operativo ahora mandan token.
- **Decisiones:**
  - Sin horario cargado la sede figura cerrada en lugar de recibir un horario inventado; el gerente lo carga desde la pantalla de horarios semanales. La existencia de la sede se consulta solo en ese caso, para no sumar una consulta a los casos habituales.
  - Los listados públicos no pueden exigir sesión sin romper la landing y el registro, así que su protección es el límite de consultas. El conteo vive en la memoria del proceso: detrás de un proxy hay que habilitar `trust proxy` para que cada cliente tenga su IP.
  - El guard nuevo va en `common/guards` porque no depende de sedes y lo puede usar otro endpoint público.
- **Dificultades:**
  - M3 valida el horario de las clases con su propio horario por defecto (08:00 a 22:00) cuando la sede no tiene horario semanal cargado. Con el horario de todas las sedes cargado no hay diferencia; queda para su responsable si lo alinea.
- **Verificación:** 18 suites y 157 pruebas aprobadas en sedes, reportes, canchas y `common` (20 nuevas). En el resto del backend siguen fallando 19 pruebas de M2 (accesos y QR) que ya fallaban en `dev` y no se tocaron. Typecheck y ESLint sin errores; cada commit compila y pasa sus pruebas.
- **Commits:**
  - `refactor(sedes): quitar horarios fijos del horario operativo`
  - `feat(common): agregar guard de limite de consultas publicas`
  - `feat(sedes): proteger con guards todos los endpoints de sedes y ciudades`
  - `refactor(reportes): quitar valores fijos de estados y conceptos`
  - `docs(log): registrar guards y limpieza de sedes y reportes`

---
