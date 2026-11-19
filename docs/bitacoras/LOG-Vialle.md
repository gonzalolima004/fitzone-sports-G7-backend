# Bitácora
Vialle, Angelina María — Rol: Desarrolladora Backend / Tech Lead / Diseñadora de Arquitectura / QA

---

## Sprint 1 — Unidad I / II: Modelado de datos y arquitectura
Semana del 2026-08-17

### 2026-08-23 · <horas> h

**Actividad**
Identifiqué junto a Marcos Caraballo las entidades principales del sistema y diseñamos en conjunto el diagrama de entidad-relación (DER) de la base de datos.

**Decisión**
Utilicé Draw.io para armar el diagrama por ser visual, gratuito y permitir editarlo o exportarlo fácilmente, opté por tablas en lugar de enumeraciones para roles, tipos y estados, y añadí la tabla `ciudad` asociada a `sede` para evitar que un socio use libremente sedes de otras ciudades sin afectar las de su misma ciudad.

**Problema o bloqueo**
La tabla de pagos apuntaba alternativamente a membresías o canchas, lo cual generaba un antipatrón. Lo resolví separando la lógica de pago por módulo para permitir agregar nuevas entidades financieras a futuro.

**Commits**
Sin commits asociados en esta sesión.

---

## Sprint 2 — Unidad II: Arquitectura y modelado C4
Semana del 2026-08-24

### 2026-08-24 · <horas> h

**Actividad**
Participé en la reunión de equipo junto a Marcos Caraballo, Facundo Agüero y Matías Sillen para modelar el sistema completo en Visual Paradigm (Contexto C1, Contenedores C2 y Componentes C3), abarcando el período del 2026-08-24 al 2026-09-05.

**Decisión**
Adopté junto al equipo Supabase como contenedor para resolver base de datos PostgreSQL, storage de comprobantes y notificaciones en tiempo real, separé el frontend en una SPA (Vue.js) y un contenedor de contenido estático (Nginx), y definí el backend en NestJS estructurado en módulos claros (canchas, pagos con webhooks de Mercado Pago, accesos y clases grupales con lista de espera).

**Problema o bloqueo**
Definir cómo interactúa el cliente web tanto con la API de NestJS como con los servicios en tiempo real de Supabase.

**Commits**
Sin commits asociados en esta sesión.

---

## Sprint 3 — Unidad II: Registros de decisión arquitectónica (ADR)
Semana del 2026-08-31

### 2026-09-01 · <horas> h

**Actividad**
Redacté junto a Marcos Caraballo los registros de decisiones arquitectónicas (ADR) para el backend del proyecto, en el período del 2026-09-01 al 2026-09-06.

**Decisión**
No se registró una decisión adicional en este apartado más allá de documentar las decisiones del backend en los ADR.

**Problema o bloqueo**
Definir todas las decisiones de arquitectura y de implementación que debían tenerse en cuenta antes de arrancar el proyecto.

**Commits**
`13dafe2` ADR-backend

---

## Sprint 4 — Unidad III / M2: Control de acceso y QR dinámico
Semana del 2026-09-21

### 2026-09-21 · <horas> h

**Actividad**
Implementé la generación y validación de tokens QR dinámicos con una vigencia corta (60 segundos) usando JWT y la librería OTPLib para garantizar la seguridad en el acceso de usuarios a las instalaciones.

**Decisión**
Empleé `HMAC-SHA256` para derivar un secreto TOTP determinista único por usuario a partir del secreto principal de la aplicación y definí la vigencia del token JWT y del algoritmo TOTP en 60 segundos con una ventana de tolerancia de 5 segundos para prevenir ataques de repetición o desfases de tiempo.

**Problema o bloqueo**
Ninguno registrado durante la sesión.

**Commits**
`ebfc694` feat(M2): Generación de Código QR Dinámico Temporal

---

## Sprint 4 — Unidad III / M2: Validación de ingreso y membresía
Semana del 2026-09-21

### 2026-09-22 · <horas> h

**Actividad**
Desarrollé el módulo de validación de ingreso por QR y verificación de membresía en tiempo real para autorizar o rechazar ingresos físicos en las sedes, incluyendo DTOs, repositorio, servicio y controlador HTTP.

**Decisión**
Apliqué transacciones atómicas para prevenir condiciones de carrera y validar el anti-doble ingreso.

**Problema o bloqueo**
Ninguno registrado durante la sesión.

**Commits**
`bd893f4` DTOs de Validación y Respuesta de Ingreso
`88f96c5` Tarea 2.2: Repositorio de Control de Acceso (Patrón Repository)
`ef74ee6` Tarea 2.3: Servicio de Validación Central y Registro de Ingreso
`c2cea55` Tarea 2.4: Controlador HTTP de Validación de Acceso

---

## Sprint 5 — Unidad III / M2: Reglas de acceso y RN-01
Semana del 2026-09-21

### 2026-09-26 · <horas> h

**Actividad**
Desarrollé el DTO de validación de reglas de acceso, el servicio y el repositorio correspondientes, incluyendo la consulta de accesos activos y la aplicación de la regla RN-01.

**Decisión**
Apliqué transacciones atómicas para prevenir condiciones de carrera y validar el anti-doble ingreso.

**Problema o bloqueo**
Ninguno registrado durante la sesión.

**Commits**
`0e32206` Tarea 1: DTO Validacion de Reglas de Acceso
`06f3757` Tarea 3.2: Consulta de Accesos Activos en Repositorio
`30ea0cab` Tarea 3.3: Aplicación de la Regla RN-01 en el Servicio de Accesos
`2023ea3` Correcciones
`741c26a` Actualizacion log

---

## Sprint 5 — Unidad III / M2: Registro de egreso y permanencia
Semana del 2026-09-21

### 2026-09-27 · <horas> h

**Actividad**
Desarrollé los DTOs de solicitud de egreso con validaciones, la lógica de actualización de egreso con cálculo de permanencia en minutos en el servicio y repositorio, y el endpoint HTTP de registrar egreso.

**Decisión**
Diseñé el DTO de solicitud con decoradores de `class-validator` y `class-transformer` (`@IsInt`, `@IsPositive`, `@Type`) admitiendo una fecha opcional (`fecha_egreso`) e implementé una función de cálculo de minutos de permanencia entre la entrada y la salida.

**Problema o bloqueo**
Ninguno registrado durante la sesión.

**Commits**
`09aecac` feat(M2): DTOs de solicitud de egreso
`01ebf19` feat(M2): Actualizacion de Egreso y Calculo de Permanencia
`32e4493` feat(M2): Endpoint HTTP de Egreso
`0e246ad` feat(M2): Actualizacion log

---

## Sprint 5 — Unidad III / M2: Aforo en tiempo real con Supabase Realtime
Semana del 2026-09-28

### 2026-09-29 · <horas> h

**Actividad**
Desarrollé e integré la emisión de aforo en tiempo real vía Supabase Realtime Broadcast tras ingresos y egresos, creando el DTO, el servicio de canales dinámicos con Supabase Client, la consulta de aforo actual y capacidad máxima en `AccesosRepository` y `AccesosService`, el endpoint GET y el ensamblado del módulo de accesos.

**Decisión**
Desconecté el canal Realtime tras el envío del mensaje para evitar la acumulación de suscripciones innecesarias en el servidor NestJS.

**Problema o bloqueo**
Ninguno registrado durante la sesión.

**Commits**
`1ede814` feat(M2): DTOs de solicitud de egreso
`4ba459f` feat(M2): Archivos de Supabase
`4cf8166` feat(M2): Servicio de Emisión de Aforo Realtime
`24e89f3` feat(M2): Disparo de Broadcast tras Ingresos/Egresos y Endpoint GET
`32c7b31` feat(M2): Ensamblado del Módulo de Accesos
`d593a5f` feat(M2): Bitacora

---

## Sprint 6 — Unidad IV: Integración con frontend y pruebas M2
Semana del 2026-10-12

### 2026-10-14 · 3 h

**Actividad**
Realicé arreglos en el backend para integrarlo con el frontend en los módulos M2 y M1.

**Decisión**
Quité el ID de usuario de los DTOs para usar el token QR, simplifiqué la generación del token QR, eliminé `UserRepository` porque no se utilizaba y reemplacé `send` por `httpSend` ante su obsolescencia.

**Problema o bloqueo**
Ninguno registrado durante la sesión.

**Commits**
`84c139f` feat(M2-M1): arreglos

---

## Sprint 7 — Unidad V: Pruebas unitarias en M2
Semana del 2026-11-02

### 2026-11-04 · <horas> h

**Actividad**
Implementé las pruebas unitarias de `acceso.service`, `aforo-realtime.service` y `qr.service`.

**Decisión**
Tipé de forma estricta los mocks en Jest utilizando `as unknown as DTO/Entity`.

**Problema o bloqueo**
Ninguno registrado durante la sesión.

**Commits**
`d77f006` test(M2): test unitario de accesos, aforo y qr
`d8715d5` docs(M2): actualizacion bitacora

---

## Sprint 6 — Unidad III / IV: Usuarios y aforo realtime
Semana del 2026-10-19

### 2026-10-25 · <horas> h

**Actividad**
Ajusté en el módulo M1 `CreateUsuarioDto` (`@Type(() => Number)`, `@IsInt()` y `id_usuario_estado` opcional), refactoricé `UsuarioResponseDto` con `@Transform` para exponer roles y `sede`, actualicé `UsuariosRepository.findAll` y `UsuariosService.actualizarUsuario` con `connect` y actualización de `usuario_rol`. En M2 limpié `console.log`, agregué `try/catch` en `obtenerAforoMaximoSede`, disparé `notificarCambioAforo` tras el ingreso y estabilicé `AforoRealtimeService` esperando `SUBSCRIBED` y cerrando el canal con retardo (`removeChannel`).

**Decisión**
Mapear las relaciones completas de roles y sede en `UsuarioResponseDto` y `UsuariosRepository` para resolver los datos en una sola consulta, usar `connect` y reemplazo transaccional en `UsuariosService`, y sincronizar la suscripción del canal Realtime con cierre temporizado (500 ms) para evitar fugas de memoria.

**Problema o bloqueo**
Asegurar la entrega confiable de los eventos Realtime de Supabase sin dejar conexiones huérfanas en NestJS, y compatibilizar la estructura relacional `usuario_rol` de Prisma con el formato consumido por el frontend. Lo resolví controlando el ciclo de vida de la suscripción/cierre del canal y transformando los roles en la respuesta.

**Commits**
`58516e0` feat(M1): Cambios para obtener los usuarios con sus respectivos datos, actualizar datos de usuario y crear usuarios
`df8ca03` feat(M2): quitar console.log, mensajes, mejora de obtener aforo
`3d0641b` feat(M2): arreglos en aforo realtime para que funcione correctamente
`9f999d2` docs(log): actualizar bitacora

---

## Sprint 6 — Unidad III / IV: Identificación por DNI y excepciones
Semana del 2026-10-26

### 2026-10-30 · <horas> h

**Actividad**
Habilite `dni` opcional (`@Matches(/^\d+$/)`) junto con `qrToken` en `ValidarIngresoDto` y `RegistrarEgresoDto`, implementé `buscarUsuarioPorDni` en `AccesosRepository`, centralicé la resolución de identidad en `resolverIdUsuario` dentro de `AccesosService` para `validarYRegistrarIngreso` y `registrarEgreso`, y migré de `UnauthorizedException` (401) a `BadRequestException` (400) en validaciones de QR y decoradores Swagger.

**Decisión**
Centralicé la búsqueda de socio por DNI o QR en `resolverIdUsuario` para evitar duplicación entre ingreso y egreso, validé el formato numérico del DNI en el DTO antes de consultar la base y reservé el 401 para autenticación de sesión usando `BadRequestException` (400) para tokens inválidos o vencidos.

**Problema o bloqueo**
Ninguno registrado durante la sesión.

**Commits**
`9b00dfa` feat(M2): correccion de excepciones y codigos de estado
`e57e8fc` feat(M2): adicion de dni en dto de egreso e ingreso
`3cb3d89` feat(M2): funcion para buscar usuario por dni
`c974a9c` feat(M2): correcion de excepciones y metodo para buscar por dni o token
`d4ad223` fix(M2): arreglo tipo de excepcion
`f7000fd` docs(log): actualizacion de bitacora

---

## Sprint 7 — Unidad V: Sincronización offline y perfil de socio
Semana del 2026-11-09

### 2026-11-10 · <horas> h

**Actividad**
Amplié `AuthenticatedUser` y `SupabaseAuthGuard` con `dni` y `nombre`, incluí `sede.ciudad` y `membresia.membresia_estado` en `UsuariosRepository` y `UsuarioResponseDto`, creé `SincronizarAccesoOfflineDto`, implementé `buscarSedePorId` con ciudad en `AccesosRepository`, incorporé `id_ciudad` y validación de membresía (`ForbiddenException` 403) en `QrService`, agregué validación de ciudad y `sincronizarAccesoOffline` en `AccesosService`, publiqué `GET /accesos/perfil/:id` y `POST /accesos/sincronizar-offline` protegidos con `SupabaseAuthGuard` y documentados en Swagger.

**Decisión**
Incluí `id_ciudad` en el token QR firmado con `HMAC-SHA256` para validar alcance geográfico en línea y offline, unifiqué el estado de membresía ('ACTIVO'/'INACTIVO') en `GET /accesos/perfil/:id` para evitar múltiples llamadas desde el frontend, e hice idempotente la sincronización offline ante ingresos activos previos para no cortar el volcado de la cola.

**Problema o bloqueo**
Para guardar los QR generados offline no se podía tener en cuenta el tiempo de expiración del mismo modo que en línea.

**Commits**
`57be48b` feat(common): adicion atributos dni y nombre a guards de supabase e interface de user
`dae5030` feat(M1): adicion membresias y sedes y exports usuariosRepository
`b9f9577` feat(M2): dto para acceso offline
`631a45c` feat(2): buscarSedePorId que incluye ciudad
`4a4caee` feat(M2): cambio manera de generarse firma y token qr
`e0684fb` feat(M2): cambio metodo extraer id usuario y ciudad de token, adicion de metodo para acceso offline
`a09761e` feat(M2): sincronizacion offline, obtener perfil e importacion de modulo usuario
`48dafb9` docs(log): actualizacion de bitacora

---

## Sprint 7 — Unidad V: Paginación en usuarios y saneamiento de tests
Semana del 2026-11-09

### 2026-11-14 · <horas> h

**Actividad**
Implementé en M1 la paginación (`page`, `limit`, `data` y `meta`) y filtros (`id_sede`, `id_usuario_estado`, `includeDeactivated`, por defecto `ID_ESTADO_ACTIVO = 1`) en `UsuariosController`, `UsuariosService` y `UsuariosRepository.findAllPaginated` (`count`, `skip`, `take`, `orderBy`), parametrizé `softDelete` (`ID_ESTADO_DESACTIVADO = 3`) y agregué `restore(id)` con guards y `@ApiQuery`. En M2 actualicé `acceso.service.spec.ts` y `qr.service.spec.ts` para el token de 4 segmentos y agregué `afterEach(() => jest.restoreAllMocks())`.

**Decisión**
Retornar `{ data, meta }` en `findAll` para facilitar tablas paginadas sin sobrecargar la red, excluir por defecto usuarios dados de baja salvo `includeDeactivated=true`, y parametrizar los estados como constantes a nivel de servicio en lugar de dejarlos hardcodeados en el repositorio.

**Problema o bloqueo**
Ninguno registrado durante la sesión.

**Commits**
`1555ba5` fix(tM2): correcion de test
`8052b57` feature(M1): findAll con paginacion y actualizacion de la manera del softDelete
`3e0f7fb` docs(log): actualizar bitacora

---

## Sprint 8 — Unidad Cierre
Semana del 2026-11-16

### 2026-11-18 · 4 h

**Actividad**
Redacté, estandaricé y cerré los Registros de Decisión Arquitectónica (ADR) en `docs/adr/` ajustándolos a la plantilla oficial del Anexo B (incorporando deuda asumida), además de redactar los ADR de estrategia de pruebas con umbral mínimo de cobertura del 80%, contenerización y despliegue, y el nuevo registro que reemplaza la estrategia de concurrencia en reservas de canchas.

**Decisión**
Adopté despliegue Canary junto con contenerización en Docker Compose (`ADR-019`) para habilitar liberaciones graduales de nuevas versiones con capacidad de reversión inmediata ante fallos críticos.

**Problema o bloqueo**
Al auditar la documentación contra la rúbrica y los lineamientos de entrega, detecté que varios ADR existentes no cumplían con el formato. Lo resolví reestructurando todos los documentos al formato exigido.

**Commits**
`c6dacd9` docs(adr): formato y creacion
`3c3441d` docs(adr): actualizacion bitácora
`4073d09` fix(adr): arreglo fecha

---
## Sprint 8 — Unidad Cierre
Semana del 2026-11-16

### 2026-11-19 · 3 h

**Actividad**
Corregí en el módulo M2 el control de ingreso en accesos para verificar si la sede alcanzó su capacidad máxima antes de autorizar la entrada, y actualicé el formato de la bitácora.

**Decisión**
Incorporé la validación previa de aforo máximo de la sede en el flujo de ingreso para evitar superar el cupo permitido antes de registrar el acceso.

**Problema o bloqueo**
El flujo de ingreso no comprobaba previamente si la sede estaba llena antes de permitir el acceso. Lo resolví agregando la verificación de capacidad máxima de la sede en el módulo M2.

**Commits**
`d532a58` fix(M2): revisar sede llena
`b9477a1` docs(bitacora): arreglo de formato
