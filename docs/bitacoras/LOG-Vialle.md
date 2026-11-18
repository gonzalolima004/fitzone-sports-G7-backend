#### 23/08/2026

#### Angelina Vialle y Marcos Caraballo | Rol: Desarrolladores Backend

- **Actividades:**
  - Identificación de las entidades principales del sistema.
  - Diseño en conjunto del diagrama de entidad-relación de la base de datos.
- **Decisiones:** Usar Draw.io para armar el diagrama porque es visual, gratuito y nos permite editar o exportar facilmente.
  Utilizar tablas en lugar de enumeraciones para roles, tipos y estados. Añadir tabla ciudad para asociarla a sedes, para poder evitar que un socio use libremente las sedes de otras ciudades, sin afectar las de su misma ciudad.
- **Dificultades:** La tabla de pagos apuntaba alternativamente a membresías o canchas, lo cual generaba un antipatrón. Se resolvió separando la lógica de pago por módulo para permitir agregar nuevas entidades financieras a futuro.
- **Commits:** ----

---

#### 24/08/2026 - 05/09/2026

#### Marcos Caraballo, Angelina Vialle, Facundo Agüero, Matías Sillen | Roles: Diseñadores de arquitectura

- **Actividades:** Reunión de equipo para modelar el sistema completo en Visual Paradigm (Contexto C1, Contenedores C2 y Componentes C3).
- **Decisiones:**
  - Adoptar Supabase como contenedor para resolver base de datos PostgreSQL, storage de comprobantes y notificaciones en tiempo real.
  - Separar el frontend en una SPA (Vue.js) y un contenedor de contenido estático (Nginx).
  - Diseñar el backend (NestJS) estructurado en módulos claros: canchas, pagos con webhooks de Mercado Pago, accesos y clases grupales con lista de espera.
- **Dificultades:** Definir cómo interactúa el cliente web tanto con la API de NestJS como con los servicios en tiempo real de Supabase.

---

#### 01/09/2026 a 06/09/2026

#### Angelina Vialle y Marcos Caraballo | Rol: Backend Developers

- **Actividades:** Escribir los registros de decisiones (ADRs) para el backend del proyecto.
- **Decisiones:** ----
- **Dificultades:** Pensar en todas las decisiones de arquitectura y de implementación que deberían de tenerse en cuenta antes de arrancar el proyecto.
- **Commits/PRs:** `13dafe2 ADR-backend`

---

#### 18/09/2026

#### Angelina Vialle | Rol: Desarrolador Backend

- **Actividades:** Implementar la generación y validación de tokens QR dinámicos con una vigencia corta (60 segundos) usando JWT y la librería OTPLib, garantizando la seguridad en el acceso de usuarios a las instalaciones.

- **Decisiones:**
  - Emplear HMAC SHA-256 para derivar un secreto TOTP determinista único por usuario a partir del secreto principal de la aplicación.
  - Definir la vigencia del token JWT y del algoritmo TOTP en 60 segundos con una ventana de tolerancia de 5 segundos para prevenir ataques de repetición o desfases de tiempo.
- **Dificultades:** Ninguna.
- **Commits:**
  - `ebfc694 feat(M2): Generación de Código QR Dinámico Temporal`

---

#### 22/09/2026

#### Angelina Vialle | Rol: Desarrolador Backend

- **Actividades:** Desarrollar el módulo de validación de ingreso por QR y verificación de membresía en tiempo real para autorizar o rechazar ingresos físicos en las sedes,

- **Decisiones:**
  - Aplicar transacciones atómicas para prevenir condiciones de carrera y validar el anti-doble ingreso.
- **Dificultades:** Ninguna.
- **Commits:**
  - `bd893f4 DTOs de Validación y Respuesta de Ingreso`
  - `88f96c5 Tarea 2.2: Repositorio de Control de Acceso (Patrón Repository)`
  - `ef74ee6 Tarea 2.3: Servicio de Validación Central y Registro de Ingreso`
  - `c2cea55 Tarea 2.4: Controlador HTTP de Validación de Acceso`

---

#### 25/09/2026

#### Angelina Vialle | Rol: Desarrolador Backend

- **Actividades:** Desarrollar DTO de validacion de reglas de acceso, service y repository de validacion de reglas de acceso

- **Decisiones:**
  - Aplicar transacciones atómicas para prevenir condiciones de carrera y validar el anti-doble ingreso.
- **Dificultades:** Ninguna.
- **Commits:**
  - `0e32206 Tarea 1: DTO Validacion de Reglas de Acceso`
  - `06f3757 Tarea 3.2: Consulta de Accesos Activos en Repositorio`
  - `30ea0ca Tarea 3.3: Aplicación de la Regla RN-01 en el Servicio de Accesos`
  - `2023ea3 Correcciones`

---

#### 27/09/2026

#### Angelina Vialle | Rol: Desarrolador Backend

- **Actividades:** Desarrollar DTOs de solicitud de egreso con validaciones, la logica de actulizacion de agreso con calculo de permanencia en minutos en service y repository. Hacer el endpoint HTTP de registrar egreso

- **Decisiones:**
  - Diseñar el DTO de solicitud con decoradores de class-validator y class-transformer (@IsInt, @IsPositive, @Type) para transformar y validar los datos de entrada, permitiendo además una marca de fecha opcional (fecha_egreso). Implementar una función de cálculo de minutos de permanencia para obtener la diferencia en minutos entre la entrada y salida.
- **Dificultades:** Ninguna.
- **Commits:**
  - `09aecac feat(M2): DTOs de solicitud de egreso`
  - `01ebf19 feat(M2): Actualizacion de Egreso y Calculo de Permanencia`
  - `32e4493 feat(M2): Endpoint HTTP de Egreso`
  - `0e246ad feat(M2): Actualizacion log`

---

#### 29/09/2026

#### Angelina Vialle | Rol: Desarrolador Backend

- **Actividades:** Desarrollo e integración de la emisión de aforo en tiempo real vía Supabase Realtime Broadcast tras ingresos y egresos. Creación del DTO. Desarrollo de servicio para gestionar los canales dinámicos utilizando Supabase Client. Ampliación de AccesosRepository y AccesosService con la lógica de consulta de aforo actual y capacidad máxima. Implementación del endpoint

- **Decisiones:**
  - Desconexión del canal Realtime tras el envio del mensaje para evitar acumulación de suscripciones innecesarias en el servidor NestJS.
- **Dificultades:** Ninguna.
- **Commits:**
  - `1ede814 feat(M2): DTOs de solicitud de egreso`
  - `4cf8166 feat(M2): Servicio de Emisión de Aforo Realtime`
  - `24e89f3 feat(M2): Disparo de Broadcast tras Ingresos/Egresos y Endpoint GET`
  - `32c7b31 feat(M2): Ensamblado del Módulo de Accesos`
  - `d593a5f feat(M2): Bitacora`

---

#### 14/10/2026

#### Angelina Vialle | Rol: Backend Developer

- **Actividades:** Arreglos de backend para integrarlo con el frontend.
- **Decisiones:**
  - Quitar el id de usuario de los dtos y usar el qr token
  - La manera de generar el token de qr es más simple
  - Elimine UserRepository porque no se usaba.
  - Cambie send por httpSend porque se iba a quedar obsoleto
- **Dificultades:** Ninguna.
- **Commits:**
  - `84c139f feat(M2-M1): arreglos`

---

#### 25/10/2026

#### Angelina Vialle | Rol: Desarrolladora Backend || Tech Lead

**Actividades:**

- **Módulo M1 (Usuarios):**
  - Ajuste en `CreateUsuarioDto`: tipado estricto y transformación de `id_sede` a número entero (`@Type(() => Number)` e `@IsInt()`), e incorporación del campo opcional `id_usuario_estado` con su validación correspondiente.
  - Refactorización de `UsuarioResponseDto`: uso de `@Transform` con `class-transformer` para mapear la relación relacional `usuario_rol` de Prisma y exponer los objetos de roles completos (`id_rol` y `nombre`) en vez de solo IDs numéricos, junto con la exposición completa de la información de la `sede`.
  - Actualización de `UsuariosRepository.findAll`: inclusión de relaciones (`usuario_rol` con detalle de `rol`, `usuario_estado` y `sede`) para recuperar la información completa de los usuarios en una sola consulta.
  - Mejora en `UsuariosService.actualizarUsuario`: soporte para vincular entidades relacionadas en Prisma mediante `connect` (`sede`, `usuario_estado`) y actualización/reemplazo controlado de roles asociados (`usuario_rol`).

- **Módulo M2 (Accesos y Aforo Realtime):**
  - Limpieza de código y estandarización en `AccesosController`, `QrController` y `AccesosService`: remoción de `console.log` de depuración y simplificación de mensajes y descripciones en Swagger y excepciones de conflicto.
  - Manejo preventivo de excepciones en `AccesosRepository`: adición de bloque `try/catch` con log de error en `obtenerAforoMaximoSede` ante fallos de conexión o lectura en la base de datos.
  - Disparo de notificación de aforo en tiempo real (`notificarCambioAforo`) tras registrar un ingreso en `AccesosService`.
  - Reestructuración de `AforoRealtimeService`: estabilización de la emisión vía Supabase Realtime Broadcast mediante suscripción explícita al canal (`channel.subscribe`), envío del evento `aforo_actualizado` una vez confirmado el estado `SUBSCRIBED`, y cierre controlado del canal (`client.removeChannel`) tras un retardo temporizado para evitar conexiones colgadas y fugas de memoria.

**Decisiones:**

- Mapear las relaciones completas de roles y sede directamente en `UsuarioResponseDto` y `UsuariosRepository` para proveer toda la información necesaria al frontend en una única petición sin sobrecargar la red con consultas adicionales.
- Utilizar conexiones explícitas (`connect`) y reemplazo transaccional en la actualización de roles en `UsuariosService` para preservar la integridad referencial en Prisma.
- Sincronizar el canal de Supabase Realtime esperando el evento de confirmación de suscripción antes de emitir el broadcast y liberarlo con un retardo controlado (500 ms) para asegurar la entrega efectiva del mensaje sin dejar suscripciones activas en memoria.

**Dificultades:**

- Asegurar la entrega confiable de los eventos Realtime de Supabase sin dejar suscripciones activas ni conexiones huérfanas en el backend de NestJS; resuelto controlando la suscripción y el cierre temporizado del canal.
- Compatibilizar la estructura relacional de `usuario_rol` de Prisma con el formato de roles consumido por el frontend en `UsuarioResponseDto`.

**Commits:**

- `58516e0 feat(M1): Cambios para obtener los usuarios con sus respectivos datos, actualizar datos de usuario y crear usuarios`
- `df8ca03 feat(M2): quitar console.log, mensajes, mejora de obtener aforo`
- `3d0641b feat(M2): arreglos en aforo realtime para que funcione correctamente`
- `9f999d2 docs(log): actualizar bitacora`

---

#### 30/10/2026

#### Angelina Vialle | Rol: Desarrolladora Backend

- **Actividades:**
  - **Flexibilización de identificación en ingresos y egresos:** Actualización de `ValidarIngresoDto` y `RegistrarEgresoDto` para hacer opcional `qrToken` y habilitar el campo `dni` (validado como numérico con `@Matches(/^\d+$/)` y `@IsOptional()`), permitiendo el registro tanto por QR dinámico como por ingreso manual de DNI.
  - **Búsqueda por DNI en repositorio:** Implementación de `buscarUsuarioPorDni` en `AccesosRepository` para consultar socios en la base de datos vía `prisma.usuario.findUnique`, con soporte para clientes transaccionales.
  - **Unificación de resolución de identidad:** Creación del método privado auxiliar `resolverIdUsuario` en `AccesosService` para centralizar la validación: resolución y existencia de usuario por DNI (`NotFoundException` 404 si no existe) o validación de vigencia del token efímero QR (`BadRequestException` 400 si expiró o está manipulado).
  - **Refactorización de flujos de torniquete:** Adaptación de `validarYRegistrarIngreso` y `registrarEgreso` en `AccesosService` para utilizar la resolución unificada de identidad, manteniendo intactas las reglas de membresía activa, anti-doble ingreso y transacción atómica.
  - **Estandarización de excepciones y Swagger:** Migración de `UnauthorizedException` (401) a `BadRequestException` (400) en `QrService.validarTokenEfimero`, `extraerIdDeToken` y los decoradores `@ApiResponse` de `AccesosController` y `QrController`, alineando los errores de formato o expiración de QR con las convenciones HTTP de validación de carga útil.
- **Decisiones:**
  - Centralizar la lógica de obtención del socio en `resolverIdUsuario` para evitar duplicar código entre los métodos de ingreso y egreso, asegurando un punto único de validación para ambos métodos de entrada (QR vs. DNI).
  - Validar el formato numérico del DNI directamente a nivel de DTO mediante expresión regular para rechazar peticiones mal formadas antes de consultar la base de datos.
  - Utilizar `BadRequestException` (400) en lugar de `UnauthorizedException` (401) para fallos de validación o expiración del token QR, reservando el 401 estrictamente para la autenticación de la sesión del usuario contra la API.
- **Dificultades:** Ninguna.
- **Commits:**
  - `9b00dfa feat(M2): correccion de excepciones y codigos de estado`
  - `e57e8fc feat(M2): adicion de dni en dto de egreso e ingreso`
  - `3cb3d89 feat(M2): funcion para buscar usuario por dni`
  - `c974a9c feat(M2): correcion de excepciones y metodo para buscar por dni o token`
  - `d4ad223 fix(M2): arreglo tipo de excepcion`
  - `f7000fd docs(log): actualizacion de bitacora`

---

#### 10/11/2026

#### Angelina Vialle | Rol: Desarrolladora Backend

- **Actividades:**
  - **Ampliación de identidad en autenticación (`common`):** Extensión de la interfaz `AuthenticatedUser` y actualización de `SupabaseAuthGuard` para inyectar `dni` y `nombre` directamente en el objeto de usuario de la sesión (`req.user`), facilitando su consumo en controladores sin requerir consultas adicionales a la base de datos.
  - **Inclusión de sedes, ciudades y estado de membresía en M1:** Actualización de `defaultIncludes` y `findAll` en `UsuariosRepository` para incluir las relaciones anidadas `sede.ciudad` y `membresia.membresia_estado`. Exposición de estos datos en `UsuarioResponseDto` y exportación de `UsuariosRepository` en `UsuariosModule` para su integración en otros módulos.
  - **Soporte y DTO para accesos offline en M2:** Creación de `SincronizarAccesoOfflineDto` con validaciones estrictas (`id_usuario`, `id_sede`, `tipo: 'INGRESO' | 'EGRESO'` y marca de tiempo histórica `timestamp`) para permitir que terminales de torniquete registren eventos localmente ante cortes de conectividad.
  - **Consulta de sede con ciudad en repositorio de accesos:** Implementación de `buscarSedePorId` en `AccesosRepository` con carga de relación de ciudad (`include: { ciudad: true }`), habilitando la validación cruzada geográfica en torniquete.
  - **Robustecimiento y firma de QR dinámico:** Refactorización de `QrService.generarFirma` y `validarTokenEfimero` para incorporar la ciudad del socio dentro del token efímero (`id_usuario.timestamp.id_ciudad.firma`). Integración con `MembresiasService.verificarMembresia` para bloquear con `ForbiddenException` (403) la generación de credenciales a socios en mora o sin membresía activa.
  - **Validación multi-sede y sincronización offline en servicio de accesos:** Adaptación de `validarYRegistrarIngreso` para verificar que la sede de destino pertenezca a la misma ciudad de registro del socio (`BadRequestException` 400 en caso contrario). Implementación de `sincronizarAccesoOffline` para procesar en lote eventos postergados respetando las reglas de estado de socio, mora, anti-doble ingreso y emisión de aforo en tiempo real.
  - **Endpoint de perfil de socio para visualización en credencial:** Implementación del método `obtenerPerfilSocio` en `AccesosService` y publicación del endpoint `GET /accesos/perfil/:id` en `AccesosController`, retornando datos consolidados del socio (ID, nombre, DNI, foto de perfil y estado de membresía 'ACTIVO'/'INACTIVO') para el renderizado del pase digital en el frontend.
  - **Publicación de endpoints y protección con Guards:** Activación de `@UseGuards(SupabaseAuthGuard)` en `QrController` y `AccesosController`, e incorporación del endpoint `POST /accesos/sincronizar-offline` con documentación OpenAPI/Swagger completa.
- **Decisiones:**
  - Incluir el `id_ciudad` dentro del token QR firmado con HMAC-SHA256 para permitir validaciones geográficas rápidas y locales tanto en línea como en contingencias offline.
  - Diseñar el endpoint `GET /accesos/perfil/:id` unificando la información del usuario con el cálculo dinámico de su estado de membresía ('ACTIVO'/'INACTIVO'), evitando que el frontend tenga que realizar múltiples peticiones para renderizar la credencial con su foto y estado.
  - Implementar la sincronización offline con validación idempotente (omisión de errores fatales si el socio ya registraba ingreso activo previo) para no interrumpir el volcado de la cola de eventos al restaurarse la conexión del torniquete.
- **Dificultades:** para guaradr los qr que se hacen offline no se puede tener en cuenta el timepo de expiracion.
- **Commits:**
  - `57be48b feat(common): adicion atributos dni y nombre a guards de supabase e interface de user`
  - `dae5030 feat(M1): adicion membresias y sedes y exports usuariosRepository`
  - `b9f9577 feat(M2): dto para acceso offline`
  - `631a45c feat(2): buscarSedePorId que incluye ciudad`
  - `4a4caee feat(M2): cambio manera de generarse firma  y token qr`
  - `e0684fb feat(M2): cambio metodo extraer id usuario y ciudad de token, adicion de metodo para acceso offline`
  - `a09761e feat(M2): sincronizacion offline, obtener perfil e importacion de modulo usuario`
  - `48dafb9 docs(log): actualizacion de bitacora`

---

#### 04/11/2026

#### Angelina María Vialle | Rol: QA Backend

- **Actividades:**
  - Prueba unitaria de acceso.service
  - Prueba unitaria de aforo-realtime.service
  - Prueba unitaria de qr.service
- **Decisiones:**
  - Tipar de forma estricta los mocks en Jest utilizando as unknown as DTO/Entity
- **Dificultades:**
  - Ninguna
- **Commits:**
  - `d77f006 test(M2): test unitario de accesos, aforo y qr`
  - `d8715d5 docs(M2): actualizacion bitacora`

---

#### 14/11/2026

#### Angelina Vialle | Rol: Desarrolladora Backend

- **Actividades:**
  - **Paginación y filtros avanzados en gestión de usuarios (M1):** Actualización de `UsuariosController.findAll` y `UsuariosService.findAll` para incorporar paginación configurable (`page` por defecto en 1 y `limit` en 10) con respuesta estructurada que incluye datos (`data: UsuarioResponseDto[]`) y metadatos de control (`meta: { total, page, lastPage }`). Se añadieron filtros opcionales por sede (`id_sede`), estado puntual (`id_usuario_estado`) e inclusión de usuarios dados de baja (`includeDeactivated`), filtrando por defecto solo usuarios activos (`ID_ESTADO_ACTIVO = 1`).
  - **Consultas optimizadas y conteo en repositorio:** Implementación de `findAllPaginated` en `UsuariosRepository` aplicando `skip`, `take`, ordenamiento descendente (`orderBy: { id_usuario: 'desc' }`) e inclusión de relaciones (`sede`, `usuario_estado`, `usuario_rol.rol`), junto con la adición de `count(where)` para el cálculo dinámico del total de páginas.
  - **Refactorización de baja lógica y restauración de usuarios:** Modificación de `softDelete` en `UsuariosRepository` para recibir parametrizado el estado desactivado (`ID_ESTADO_DESACTIVADO = 3`) desde el servicio. Creación de `updateStatus` en el repositorio e implementación de `restore(id)` en `UsuariosService` para reactivar usuarios eliminados lógicamente devolviéndolos a estado activo.
  - **Seguridad y documentación Swagger en usuarios:** Protección de las rutas de `UsuariosController` incorporando `@UseGuards(SupabaseAuthGuard, RolesGuard)` y `@ApiBearerAuth()`, documentando los nuevos parámetros de paginación y filtrado con decoradores `@ApiQuery`.
  - **Corrección y saneamiento de pruebas unitarias en M2:**
    - `acceso.service.spec.ts`: Eliminación de directivas de escape de linter, inyección de `UsuariosRepository` en el módulo de pruebas para espiar `findByDni` (alineado a la arquitectura de resolución de socios), y adaptación de los mocks al formato de token QR dinámico de 4 segmentos (`id_usuario.id_ciudad.timestamp.firma`).
    - `qr.service.spec.ts`: Inyección de `UsuariosService` para la resolución de ciudad de origen y verificación de la estructura del token QR de 4 partes.
    - Limpieza de espías de Jest mediante `afterEach(() => jest.restoreAllMocks())`.
- **Decisiones:**
  - Devolver un objeto con `data` y `meta` en `findAll` para facilitar la renderización de tablas paginadas en el frontend y evitar sobrecarga en la transferencia de datos.
  - Excluir por defecto a los socios dados de baja a menos que se indique explícitamente `includeDeactivated=true`, manteniendo las vistas administrativas limpias y enfocadas en socios operativos.
  - Parametrizar los identificadores de estado activo y desactivado como constantes a nivel de servicio (`ID_ESTADO_ACTIVO = 1`, `ID_ESTADO_DESACTIVADO = 3`) en lugar de dejarlos hardcodeados en las consultas del repositorio.
- **Dificultades:** Ninguna.
- **Commits:**
  - `1555ba5 fix(tM2): correcion de test`
  - `8052b57 feature(M1): findAll con paginacion  y actualizacion de la manera del softDelete`
  - `3e0f7fb docs(log): actualizar bitacora`

---
# Vialle Angelina María — Rol Diseñador de Arquitectura

## Sprint 8 — Unidad Cierre - Semana del 2026-11-16

### 2026-11-18 . 4 h

**Actividad**
Redacción, estandarización y cierre de los Registros de Decisión Arquitectónica (ADR) del proyecto en `docs/adr/` ajustándolos a la plantilla oficial del Anexo B (incorporando deuda asumida). Además, redacté los ADR específicos de la estrategia de pruebas con umbral mínimo de cobertura del 80%, el de contenerización y despliegue, y el nuevo registro que reemplaza la estrategia de concurrencia en reservas de canchas.

**Decisión**
Adoptar despliegue Canary junto con contenerización en Docker Compose (`ADR-019`) para habilitar liberaciones graduales de nuevas versiones con capacidad de reversión inmediata ante fallos críticos.

**Problema o bloqueo**
Al auditar la documentación contra la rúbrica y los lineamientos de entrega, detecté que varios ADR existentes no cumplian con el formato. Lo resolví reestructurando todos los documentos al formato exigido,

**Commits**
- `c6dacd9 docs(adr):  formato y creacion`
