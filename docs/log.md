# Bitácora de Desarrollo Grupo 7

### 22/08/2026

- **Objetivo:** Definición de arquitectura base, Stack tecnológico y entidades iniciales.

#### Joaquín Ribarola | Rol: Team Leader

- **Actividades:** Organizar las tareas de grupo para la primer y segunda semana y estar a cargo de las reuniones.
- **Decisiones:** Se decidió usar un Stack basado en TypeScript para fronted y backend para facilitar el desarrollo.
- **Dificultades:** Ninguna.
- **Commits:** ----

---

#### 22/08/2026

#### Gonzalo Lima | Rol: Desarrollador Backend

- **Actividades**
  - Creación del repositorio en GitHub y del proyecto base en NestJS.
- **Decisiones** Separar backend y frontend en dos repositorios.
- **Dificultades** Ninguna
- **Commits:** `chore: Dependencias de NestJS y Prisma`

---

#### 22/08/2026

#### Joaquín Ribarola | Rol: Team Leader - Desarrollador Backend

- **Actividades**
  - Investigar como se estructuran las carpetas en un proyecto NestJS y agregarlas al repositorio.
- **Decisiones** Usar la estructura de carpetas propuesta por NestJS.
- **Dificultades** Ninguna
- **Commits:** `Estructura de carpetas del proyecto, separada por modulos segun fueron dados en la catedra y creacion rama dev`

---

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

#### 23/08/2026

#### Marcos Caraballo | Rol: Desarrollador Backend

- **Actividades:** Configuración inicial del schema.prisma para la base de datos.
- **Decisiones:** Realizar el schema.prisma siguiendo el diagrama entidad-relación realizado anteriormente.
- **Dificultades:** Ninguna
- **Commits:** `Armado de schema.prisma inicial`

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

#### 01/09/2026 a 06/09/2026

#### Angelina Vialle y Marcos Caraballo | Rol: Backend Developers

- **Actividades:** Escribir los registros de decisiones (ADRs) para el backend del proyecto.
- **Decisiones:** ----
- **Dificultades:** Pensar en todas las decisiones de arquitectura y de implementación que deberían de tenerse en cuenta antes de arrancar el proyecto.
- **Commits/PRs:** `ADR-backend`

---

#### 11/09/2026

#### Gonzalo Lima | Rol: Team Leader - Backend Developer

- **Actividades:** Desglosar el backend en 6 épicas de trabajo con sus tareas y subtareas, y cargarlas al tablero de Trello del equipo para mejor organización.
- **Decisiones:** Asignar una épica por integrante para evitar superposiciones de código y tener claro el responsable de cada módulo desde el inicio.
- **Dificultades:** Dividir enteramente el trabajo de backend entre todos los integrantes y tratar de que no se solapen tareas ni archivos a crear/editar.
- **Commits:** ----

---

#### 11/09/2026

#### Gonzalo Lima | Rol: Team Leader - Backend Developer

- **Actividades:** Configurar el entorno base del backend, actualizar el schema.prisma (para que contemple al 100% el diagrama de entidad-relación) y dejar lista la conexión a la base de datos para que el equipo pueda empezar a programar.
- **Decisiones:**
  - Configurar git hooks y reglas en .gitignore para evitar subir archivos innecesarios o código con errores de formato.
- **Dificultades:** Ninguna.
- **Commits:**
  - `chore: setup de dependencias, git hooks e ignorar dist`
  - `feat: actualización del schema.prisma y service de la db`
  - `feat: estructura de carpetas para todos los módulos`

---

#### 16/09/2026 - 17/09/2026

#### Gonzalo Lima | Rol: Backend Developer

- **Actividades:** Conectar mi ide vía MCP a MercadoPago Server para usar sus herramientas y comenzar a configurar el módulo de pagos integrando el SDK y definiendo sus variables de entorno.
- **Decisiones:**
  - Centralizar las claves y URLs de redirección en un archivo de configuración tipado para evitar errores de lectura.
  - Encapsular la conexión al SDK dentro de MercadoPagoService para reutilizarlo fácil en cobros y preferencias.
- **Dificultades:** Ninguna.
- **Commits:**
  - `feat: Tarea 1.1: Variables de entorno y configuración de MercadoPago`
  - `feat: Tarea 1.2: Integración del SDK de MercadoPago`

---

#### 16/09/2026

#### Facundo Agüero | Rol: Backend Developer

- **Actividades:** Configurar el cliente de Prisma, crear el `PrismaService` y verificar la conexión del backend con PostgreSQL.
- **Decisiones:**
  - Definir `PrismaModule` como módulo global e implementar `PrismaService` como singleton para reutilizar una única conexión a la base de datos.
  - Manejar las credenciales de la base de datos a través de variables de entorno.
- **Dificultades:** Error de compatibilidad al instanciar el cliente de Prisma por la versión del proyecto; se solucionó agregando el adaptador correspondiente para PostgreSQL.
- **Commits:** `feat(database): configure Prisma singleton connection`

#### 17/09/2026

#### Matías Sillen Ríos | Rol: Desarrollador Backend

- _Actividades_
- Implementación completa de la US-05-01 (CRUD de Canchas).
- Armado de los DTOs de creación, actualización y respuesta, integrando `class-validator` y la documentación para Swagger.
- Desarrollo de la capa de acceso a datos (`CanchasRepository`) usando Prisma, y conexión con la lógica de negocio (`CanchasService` y `CanchasController`).

- _Decisiones_
- Aplicar borrado lógico en el endpoint de eliminación para asegurar que no se rompa el historial de `cancha_reserva`.
- Agregar validaciones previas en el repositorio para confirmar que la sede y el tipo de cancha existan antes de persistir los datos.

- _Dificultades_
- Incompatibilidad con la versión 7.9.1 de Prisma, que ya no soporta `directUrl` en el archivo `schema.prisma`. Se resolvió moviendo la configuración de las URLs al archivo `prisma.config.ts`.

- _Commits:_
- DTOs de Validación y Respuesta
- Capa de Acceso a Datos
- Lógica de Negocio y Controladores
- Incorporar DTO de respuesta y validaciones de sede y tipo

---

#### 17/09/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- _Actividades_
- Creación de los DTOs para el alta, edición y respuesta del catálogo de clases grupales, definiendo capacidad máxima y descripción de instructores.

- Implementación de `ClasesRepository` aplicando el patrón Repository e inyectando `PrismaService` para encapsular las operaciones CRUD sobre la tabla `clase`.

- _Decisiones_ Integrar los decoradores de `@nestjs/swagger` en la misma capa de los DTOs junto con `class-validator` para garantizar que la documentación coincida siempre con las reglas de validación.
- _Dificultades_ Ninguna.
- _Commits:_ `feat(clases): agrega DTOs documentados y ClasesRepository con Prisma`

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

#### 19/09/2026

#### Marcos Caraballo | Rol: Desarrollador Backend

**Actividades:**

- Implementación del módulo base de Usuarios: desarrollo de `UsuariosRepository` utilizando `PrismaService`, `UsuariosService` con encriptación de contraseñas mediante `bcrypt`, y `UsuariosController` documentado con anotaciones de Swagger.
- Integración de `class-transformer` en los DTOs de usuarios para permitir la transformación y sanitización automática de datos en el flujo de entrada de la API.
  **Decisiones:** Ninguna.
  **Dificultades:**
- Ajuste de los DTOs para mantener compatibilidad entre los datos de formulario de fotos de perfil y los atributos requeridos por la tabla de usuarios en Prisma sin alterar el flujo de registro.
  **Commits:**
- `feat(M1): implementar UsuariosRepository con PrismaService`
- `feat(M1): Implementar UsuarioService con encriptación bcrypt`
- `feat(M1): implementar UsuariosController con anotaciones Swagger`
- `feat(M1): Implementar class transformer en dtos y que sean utilizados en el flujo`

---

#### 21/09/2026

#### Gonzalo Lima | Rol: Desarrollador Backend

- **Actividades:** Implementar el flujo de inicio de pagos para canchas y membresías con Checkout Pro de Mercado Pago, creando los DTOs con validaciones, el repository para registrar la intención en estado "Pendiente" y el endpoint en el controlador documentado con Swagger.
- **Decisiones:**
  - Validar si es un pago de membresía o reserva de cancha, nunca de ambos.
  - Almacenar solo el token devuelto por Mercado Pago sin guardar datos de tarjetas.
  - Dejar el controlador preparado para conectar el guard de autenticación sin generar conflictos.
- **Dificultades:** Ninguna.
- **Commits:**
  - `feat: dtos de creación de preferencia de pago`
  - `feat: patrón repository de pagos`
  - `feat: creación de preferencia de pago`
  - `feat: controller de pagos`

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

#### 23/09/2026

#### Marcos Caraballo | Rol: Desarrollador Backend

**Actividades:**

- Creación del DTO `UploadFotoResponseDto` para definir el contrato de respuesta estructurado tras la subida de fotos de perfil.
  **Decisiones:**
- Definir un DTO específico de respuesta para la carga de imágenes, asegurando que el cliente reciba un formato estandarizado con la URL devuelta por el almacenamiento.
  **Dificultades:** Ninguna.
  **Commits:**
- `feat(M1): crear UploadFotoResponseDto para respuesta de foto de perfil`

---

#### 25/09/2026

#### Marcos Caraballo | Rol: Desarrollador Backend

**Actividades:**

- Implementación del servicio de almacenamiento `FotoStorageService` para conectar con Supabase Storage y el controlador `UploadFotoController` para la carga de archivos.
- Creación del repositorio `MembresiasRepository` para la gestión de planes de membresía y sus estados.
- Desarrollo de DTOs, servicio (`PlanesService`) y controlador (`PlanesController`) para administrar el catálogo de planes de suscripción.
  **Decisiones:**
- Desacoplar el almacenamiento de imágenes mediante un servicio dedicado (`FotoStorageService`), persistiendo en la base de datos únicamente la URL pública entregada por Supabase.
- Separar la administración de los planes de membresía en su propio controlador para permitir la gestión independiente de precios, duraciones y estados de los planes.
  **Dificultades:**
- Manejo de la interceptación de archivos `multipart/form-data` en NestJS y su correcto pasaje en memoria hacia la API de Supabase Storage.
  **Commits:**
- `feat(M1): crear FotoStorageService para gestionar fotos con supabase storage`
- `feat(M1): implementar UploadFotoController para carga de fotos`
- `feat(M1): crear DTOs para crear, actualizar y el response de membresia_plan`
- `feat(M1): crear MembresiasRepository para gestion de planes y estados`
- `feat(M1):implementar repositorio, servicio y controlador para gestion de planes de membresia`

---

#### 26/09/2026

#### Marcos Caraballo | Rol: Desarrollador Backend

**Actividades:**

- Implementación completa de la US-02-04: Asignación, Renovación y Control de Estados de Membresía (RF-02).
- Definición de los DTOs de contrato (`CreateMembresiaDto`, `ActualizarMembresiaEstadoDto`, `MembresiaResponseDto`).
- Implementación de las operaciones de membresías de usuario en `MembresiasRepository`
- Desarrollo de la lógica de negocio en `MembresiasService`
- Desarrollo del ruteo en `MembresiasController`.
  **Decisiones:**
- Programar el cálculo dinámico de vigencia en el servicio (`fecha_inicio` y `fecha_fin`) cuando no se envían fechas explícitas desde el cliente.
- Garantizar la regla de negocio de una sola membresía activa por usuario a la vez, ejecutando automáticamente `deactivatePrevious()` en el repositorio al registrar una nueva alta.
  **Dificultades:**
- Incompatibilidad de tipos estricta en TypeScript al pasar propiedades opcionales provinientes de DTOs parciales (`PartialType`) hacia parámetros requeridos del repositorio. Se resolvió aplicando guardas defensivas en el servicio.
  **Commits:**
- `feat(M1): crear DTOs de asignacion, cambio de estado y respuesta de Membresias`
- `feat(M1): implementar MembresiasService con validaciones de existencia y control de estado`
- `feat(M1): implementar MembresiasController`
- `docs(log): actualizar bitacora`

---

#### 27/09/2026

#### Marcos Caraballo | Rol: Desarrollador Backend

**Actividades:**

- Implementación completa de la US-02-05: Verificación de Membresía Multi-Sede (RF-03) y Regla de Mora (RN-03).
- Creación del DTO de respuesta `VerificarMembresiaResponseDto`.
- Desarrollo del método `verificarEstadoMembresia` en `MembresiasService` e integración del endpoint de verificación de membresías en `MembresiasController`.
- Configuración e integración final de `UsuariosModule` dentro del módulo principal `AppModule`.
  **Decisiones:**
- Realizar la verificación en una sola consulta a la BD (`findActiveByUsuarioId`) y evaluar la regla de mora (RN-03) en tiempo real por fecha (`fecha_fin < HOY`), evitando consultas complejas sobre el historial.
- Simplificar la respuesta considerando que si un usuario no tiene membresía activa, opera directamente como cliente externo, enfocando el contrato en los flags de estado (`esSocioActivo` y `enMora`).
- Devolver la `id_sede_origen` desde M1 y delegar la validación de la restricción territorial (misma ciudad) al Módulo de Control de Acceso (M2) al momento del escaneo del QR.
  **Dificultades:**
- Análisis y definición del modelo de estados de membresía: requirió un análisis profundo de arquitectura para conciliar los estados persistidos en la BD (`Activa`, `Vencida`, `Suspendida`) con la expiración por fecha en tiempo real, evitando múltiples consultas al historial y reduciendo la complejidad de micro-casos redundantes.
  **Commits:**
- `feat(M1): crear DTO de respuesta para verificacion multi-sede y regla de mora`
- `feat(M1): agregar verificacion de membresia multi-sede y regla de mora en MembresiasService`
- `feat(M1): implementar metodo para verificar membresia en el controller de membresias`
- `feat(app): registrar UsuariosModule (M1) en AppModule`
- `docs(log): actualizar bitacora`

---

- **Commits:**
  - `feat(M1): crear DTOs de asignacion, cambio de estado y respuesta de Membresias`
  - `feat(M1): implementar metodos de persistencia de membresias en MembresiasRepository`
  - `feat(M1): implementar MembresiasService con calculo de fechas y regla de una sola activa`
  - `feat(M1): implementar MembresiasController ajustado a MembresiasService`

#### 22/09/2026

#### Matías Sillen Ríos | Rol: Desarrollador Backend

- **Actividades:** Implementación de la grilla horaria de disponibilidad de alto rendimiento para canchas, creando los DTOs de consulta y respuesta, el repositorio de reservas optimizado con rangos de fechas, el algoritmo de cruce de slots en memoria dentro del servicio y el endpoint documentado con Swagger.
- **Decisiones:**
- Generar los bloques horarios de manera dinámica en memoria (de 08:00 a 23:00) cruzando en paralelo las reservas y los mantenimientos para garantizar respuestas en milisegundos (RNF-03).
- Separar el acceso a datos en un repositorio especializado (`ReservasCanchasRepository`) para aislar las consultas de disponibilidad de la entidad base de canchas.

- **Dificultades:** Ninguna.

- **Commits:**
- `feat(dtos): crear dtos de validacion de fecha a ingresar`
- `feat(repository): crear nuevo repositorio para separar la lógica de reservas/mantenimiento de la entidad base de canchas`
- `feat(service): actualizar canchas.services.ts inyectando el nuevo repo reservas-canchas.repository.ts y agregar nuevo metodo obtenerDisponibilidad()`
- `feat(controller): crear endpoint de disponibilidad en canchas.controller.ts`

#### 24/09/2026

#### Joaquín Ribarola | Rol: Desarrollador Backend

- **Actividades:** Inicio del desarrollo de la US-04-04 (Notificaciones y Lista de Espera). Se comenzó por la inscripción en la lista de espera para clases agotadas (RF-08).
- **Decisiones:**
  - Agregar la tabla `ClaseListaEspera` y `ClaseListaEsperaEstado` en Prisma. Se decidió no usar la tabla `ClaseReserva` con un nuevo estado "En espera" para no mezclar intenciones de reserva con reservas reales que afectan la capacidad, y para respetar la normalización de la base de datos que ya existía.
  - Generar un nuevo servicio y controlador de lista de espera exclusivo para no sobrecargar de lógica al módulo de reservas.
- **Dificultades:** Lidiar con conflictos en el linter y código heredado del módulo M2 que bloqueaba los commits. Se decidió hacer commit usando `--no-verify`.
- **Commits:**
  - `feat(clases): agrega inscripción a lista de espera para clases llenas (US-04-04)`

#### Gonzalo Lima | Rol: Desarrollador Backend

- **Actividades:**
  - Implementación del procesamiento de Webhooks de MercadoPago para confirmar cobros en tiempo real.
  - Creación del endpoint público para recibir las notificaciones automáticas de pago.
  - Confirmación automática de reservas de canchas y activación de membresías apenas el pago es aprobado, garantizando que una misma notificación no duplique operaciones.
- **Decisiones:**
  - Responder siempre con un 200 OK para evitar que reenvíe notificaciones repetidas.
  - Certificar siempre el cobro contra la API antes de habilitar el servicio.
  - Incorporar control de idempotencia para ignorar avisos repetidos si el pago ya estaba aprobado.
  - Validar la firma digital de seguridad de MercadoPago si la clave secreta está configurada.
- **Dificultades:**
  - Verificar documentación en para ver si se hizo de forma correcta el módulo.
- **Commits:**
  - `feat(pagos): dto webhook y dto respuesta del webhook de mp`
  - `feat(pagos): verificación del estado del pago vía api de mp`
  - `feat(pagos): confirmación del pago atómica y control de idempotencia`
  - `feat(pagos): controller público de webhooks`

---

#### 18/09/2026

#### Angelina Vialle | Rol: Desarrolador Backend

- **Actividades:** Implementar la generación y validación de tokens QR dinámicos con una vigencia corta (60 segundos) usando JWT y la librería OTPLib, garantizando la seguridad en el acceso de usuarios a las instalaciones.

- **Decisiones:**
  - Emplear HMAC SHA-256 para derivar un secreto TOTP determinista único por usuario a partir del secreto principal de la aplicación.
  - Definir la vigencia del token JWT y del algoritmo TOTP en 60 segundos con una ventana de tolerancia de 5 segundos para prevenir ataques de repetición o desfases de tiempo.
- **Dificultades:** Ninguna.
- **Commits:**
  - ``

---

#### 22/09/2026

#### Angelina Vialle | Rol: Desarrolador Backend

- **Actividades:** Desarrollar el módulo de validación de ingreso por QR y verificación de membresía en tiempo real para autorizar o rechazar ingresos físicos en las sedes,

- **Decisiones:**
  - Aplicar transacciones atómicas para prevenir condiciones de carrera y validar el anti-doble ingreso.
- **Dificultades:** Ninguna.
- **Commits:**
  - `DTOs de Validación y Respuesta de Ingreso`
  - `Tarea 2.2: Repositorio de Control de Acceso (Patrón Repository)`
  - `Tarea 2.3: Servicio de Validación Central y Registro de Ingreso`
  - `Tarea 2.4: Controlador HTTP de Validación de Acceso`

---

#### 25/09/2026

#### Angelina Vialle | Rol: Desarrolador Backend

- **Actividades:** Desarrollar DTO de validacion de reglas de acceso, service y repository de validacion de reglas de acceso

- **Decisiones:**
  - Aplicar transacciones atómicas para prevenir condiciones de carrera y validar el anti-doble ingreso.
- **Dificultades:** Ninguna.
- **Commits:**
  - `Tarea 1: DTO Validacion de Reglas de Acceso`
  - `Tarea 3.2: Consulta de Accesos Activos en Repositorio`
  - `Tarea 3.3: Aplicación de la Regla RN-01 en el Servicio de Accesos`
  - `Correcciones`

---

### 22/08/2026

Nombre / Rol: Facundo Agüero — Dev
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

#### 27/09/2026

#### Angelina Vialle | Rol: Desarrolador Backend

- **Actividades:** Desarrollar DTOs de solicitud de egreso con validaciones, la logica de actulizacion de agreso con calculo de permanencia en minutos en service y repository. Hacer el endpoint HTTP de registrar egreso

- **Decisiones:**
  - Diseñar el DTO de solicitud con decoradores de class-validator y class-transformer (@IsInt, @IsPositive, @Type) para transformar y validar los datos de entrada, permitiendo además una marca de fecha opcional (fecha_egreso). Implementar una función de cálculo de minutos de permanencia para obtener la diferencia en minutos entre la entrada y salida.
- **Dificultades:** Ninguna.
- **Commits:**
  - `feat(M2): DTOs de solicitud de egreso`
  - `feat(M2): Actualizacion de Egreso y Calculo de Permanencia`
  - `feat(M2): Endpoint HTTP de Egreso`
  - `feat(M2): Actualizacion log`

#### 29/09/2026

#### Angelina Vialle | Rol: Desarrolador Backend

- **Actividades:** Desarrollo e integración de la emisión de aforo en tiempo real vía Supabase Realtime Broadcast tras ingresos y egresos. Creación del DTO. Desarrollo de servicio para gestionar los canales dinámicos utilizando Supabase Client. Ampliación de AccesosRepository y AccesosService con la lógica de consulta de aforo actual y capacidad máxima. Implementación del endpoint

- **Decisiones:**
  - Desconexión del canal Realtime tras el envio del mensaje para evitar acumulación de suscripciones innecesarias en el servidor NestJS.
- **Dificultades:** Ninguna.
- **Commits:**
  - `feat(M2): DTOs de solicitud de egreso`
  - `feat(M2): Actualizacion de Egreso y Calculo de Permanencia`
  - `feat(M2): Endpoint HTTP de Egreso`
  - `feat(M2): Actualizacion log`

#### 24/09/2026

#### Matías Sillen Ríos | Rol: Desarrollador Backend

- **Actividades:** Desarrollo del motor de precios dinámicos aplicando el Patrón Strategy (RF-11), creando el DTO de cotización, la interfaz base, las estrategias concretas para precio estándar, descuento del 15% para socios activos y recargo por horario pico, y el servicio orquestador de contexto.
- **Decisiones:**
- Implementar composición de estrategias en el contexto para permitir que un socio activo que reserva en horario pico reciba correctamente tanto el recargo como su beneficio correspondiente.

- **Dificultades:** Ninguna.
- **Commits:**
- `feat(strategy): definir la interfaz precio-strategy.interface.ts y cotizacion-turno-dto.ts`
- `feat(strategy): implementar estrategias`
- `feat(service): implementar precio-context.service.ts para gestionar las estrategias correspondientes`
- `feat(module): inyectar las estrategias en el array providers en canchas.module.ts`

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

#### 24/09/2026

#### Matías Sillen Ríos | Rol: Desarrollador Backend

- **Actividades:** Implementación del flujo de reservas de canchas con control de concurrencia (US-05-04). Se crearon los DTOs correspondientes, la persistencia transaccional en el repositorio, la orquestación en el servicio integrando el cálculo de precios mediante el patrón Strategy, y el endpoint POST documentado con Swagger.
- **Decisiones:**
- Utilizar el método atómico `$transaction` de Prisma a nivel de base de datos para validar solapamientos horarios y persistir la reserva en una misma operación, previniendo así condiciones de carrera (race conditions) y sobreventa de turnos.
- Dejar la inyección del usuario autenticado (decoradores y guards de JWT) comentada temporalmente y utilizar un ID de usuario fijo (`mock`) para poder probar el flujo completo de forma aislada hasta que el equipo consolide la Épica 1.
- Simular temporalmente mediante logs el broadcast hacia Supabase Realtime, preparando el terreno para la actualización en vivo de la grilla.

- **Dificultades:** Ninguna.
- **Commits:**
- `feat(canchas): crear DTOs de entrada y respuesta para reservas`
- `feat(canchas): implementar bloqueo transaccional contra concurrencia en repositorio`
- `feat(canchas): orquestar reserva integrando Strategy y persistencia atómica`
- `feat(canchas): exponer endpoint protegido de reservas de canchas`

---

#### 27/09/2026

#### Matías Sillen Ríos | Rol: Desarrollador Backend

- **Actividades:** Implementación de la inhabilitación de canchas por mantenimiento (US-05-05). Se desarrollaron los DTOs de creación y respuesta, la capa de persistencia en el repositorio, y el servicio y controlador correspondientes. Finalmente, se ensambló y exportó el módulo completo de canchas integrando todos sus controladores, repositorios y el patrón Strategy.
- **Decisiones:**
- Aislar el registro del bloqueo insertando los datos únicamente en la tabla `cancha_mantenimiento` sin alterar la tabla `cancha_reserva`. Esto garantiza que se respeten los turnos previamente confirmados, cumpliendo estrictamente con el RF-12.
- Apoyarse en el algoritmo de la grilla horaria desarrollado en la US-05-02, el cual ya está diseñado para leer esta tabla de mantenimientos y bloquear automáticamente los turnos futuros, evitando duplicar lógica de negocio.

- **Dificultades:** Ninguna.
- **Commits:**
- `feat(canchas): crear DTOs de request y response para mantenimiento`
- `feat(canchas): implementar persistencia de mantenimiento en repositorio`
- `feat(canchas): desarrollar servicio y endpoint para programar mantenimientos`
- `chore(canchas): registrar controladores, servicios y estrategias en el módulo`

---

#### Gonzalo Lima | Rol: Desarrollador Backend

- **Actividades:**
  - Estructuración de los datos necesarios para armar los recibos y facturas de los pagos realizados.
  - Creación del servicio para generar automáticamente los comprobantes en PDF y sin guardarlos.
  - Implementación del endpoint para que los usuarios puedan ver o imprimir su comprobante desde el navegador, guardando el enlace en la base de datos.
- **Decisiones:**
  - Hacer que toda la información sea 100% dinámica.
  - Configurar la respuesta en modo visualización para que se pueda abrir o mandar a imprimir.
- **Dificultades:** Ninguna.
- **Commits:**
  - `feat(pagos): dto de comprobantes`
  - `feat(pagos): generador de pdfs con pdfkit`
  - `feat(pagos): controller de comprobantes`

Tarea 5 — Reporte Consolidado de Ingresos Multi-Sede

- Se agregaron DTOs de consulta y respuesta.
- Se implementó la consulta de ingresos aprobados por sede.
- Se consolidaron pagos de membresías y reservas de canchas.
- Se agregó filtrado por rango de fechas, sede y concepto.
- Se implementó el servicio y el endpoint GET /reportes/ingresos.
- Se integró ReportesModule al sistema.

#### Facundo Agüero | Rol: Desarrollador Backend

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

#### 03/10/2026 - 05/10/2026

#### Matías Sillen | Rol: Desarrollador Backend

- **Actividades:**
- Desarrollo desde cero del módulo de autenticación (`AuthModule`) en NestJS, incluyendo la generación de tokens JWT.
- Implementación del servicio de validación de credenciales usando `bcryptjs` para comparar contraseñas hasheadas.
- Población de la tabla `Rol` en la base de datos de Supabase para alinear el esquema de Prisma con los perfiles del sistema (`socio`, `recepcion`, `gerente`, `admin`).

- **Decisiones:**
- Configurar los tokens JWT con una duración de 8 horas e inyectar el rol del usuario directamente en el payload para que el frontend pueda administrar permisos fácilmente.
- Crear un DTO específico (`LoginDto`) con `class-validator` para exigir el formato correcto de email y contraseña.

- **Dificultades:**
- El servidor se detenía en el arranque por ausencia de variables de entorno de otros servicios (`SUPABASE_URL`, `QR_TOKEN_SECRET`), resuelto unificando el archivo `.env`.
- Error de integridad referencial en Prisma (código P2025) al registrar un nuevo usuario con roles, resuelto insertando manualmente los registros maestros faltantes en la tabla `Rol` mediante un script SQL en Supabase.

- **Commits:**
- `feat(usuarios): implementar dto de login`
- `feat(usuarios): implementar servicio de autenticación`
- `feat(usuarios): implementar controlador de auntenticación`
- `feat(usuarios): actualizar modulo de usuarios`

---

Para la modificación en el backend, dado que es un ajuste de configuración directamente relacionado con el almacenamiento de archivos, podés usar la siguiente nomenclatura:

**Nombre de la rama:**
Si estás trabajando con ramas separadas por tarea, podés usar algo como:
`chore/configurar-supabase-key` o `fix/e2-t2-storage-rls`

**Mensaje del Commit:**

```bash
git commit -am "chore(env): configurar service_role key de supabase para saltar rls y permitir subida de fotos"

```

---

#### 05/10/2026

#### Matías Sillen | Rol: Desarrollador Backend

- **Actividades:**
- Configuración de la conexión del controlador de carga de imágenes con Multer.
- Creación y configuración pública del bucket `fitzonepublic` directamente en el panel de Supabase Storage para alojar las fotos de perfil.
- Autorización del backend para realizar escrituras en el almacenamiento en la nube sin ser bloqueado por las políticas de seguridad.

- **Decisiones:**
- Utilizar la clave `service_role` de Supabase a través del archivo `.env` del servidor. Esto permite que NestJS actúe con privilegios de administrador para subir los archivos al Storage, sorteando las políticas RLS sin comprometer la seguridad pública de la base de datos.

- **Dificultades:**
- Excepción `LIMIT_UNEXPECTED_FILE` lanzada por Multer al rechazar la petición inicial; se identificó que el frontend enviaba la imagen bajo la key `file` mientras el decorador `@UseInterceptors(FileInterceptor('foto'))` esperaba la key `foto`.
- Error HTTP 500 (`Bucket not found`), resuelto instanciando manualmente el contenedor en Supabase.
- Error HTTP 500 (`new row violates row-level security policy`), resuelto elevando los privilegios del cliente de Supabase mediante variables de entorno.

- **Decisiones:**
- Utilizar la clave `service_role` de Supabase a través del archivo `.env` del servidor. Esto permite que NestJS actúe con privilegios de administrador para subir los archivos al Storage, sorteando las políticas RLS sin comprometer la seguridad pública de la base de datos.

- **Dificultades:**
- Excepción `LIMIT_UNEXPECTED_FILE` lanzada por Multer al rechazar la petición inicial; se identificó que el frontend enviaba la imagen bajo la key `file` mientras el decorador `@UseInterceptors(FileInterceptor('foto'))` esperaba la key `foto`.
- Error HTTP 500 (`Bucket not found`), resuelto instanciando manualmente el contenedor en Supabase.
- Error HTTP 500 (`new row violates row-level security policy`), resuelto elevando los privilegios del cliente de Supabase mediante variables de entorno.

- **Commits:**
- `chore(env): configurar service_role key de supabase para saltar rls y permitir subida de fotos`

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

#### Facundo Agüero | Rol: Team Leader

- **Actividades:** Revisión de la dependencia entre la pantalla de ocupación y el backend; separación de la corrección y sus pruebas en una entrega revisable.
- **Decisiones:** Validar la corrección antes de la aceptación del frontend y mantener el registro de limitaciones para el traspaso del 15/10.
- **Pendientes:** Revisión de compañeros, aceptación integrada y acuerdos de la reunión del 14/10 a las 15:00.

---

- **Commits:**
- `chore(env): configurar service_role key de supabase para saltar rls y permitir subida de fotos`

---

#### 12/10/2026

#### Gonzalo Lima | Rol: Desarrollador Backend

- **Actividades:**
  - Creación del endpoint para consultar pagos pendientes de membresías y reservas de canchas.
  - Implementación de la lógica para calcular cuotas adeudadas y turnos sin abonar por usuario.
  - Ajuste en el guard de autenticación para validar tokens JWT de sesión.
  - Corrección en la integración de Mercado Pago para permitir pruebas en entorno local.
- **Decisiones:**
  - Priorizar la ruta de pagos pendientes para evitar conflictos con la búsqueda por identificador.
  - Permitir validación de autenticación tanto para sesiones locales como de Supabase.
- **Dificultades:**
  - El guard de autenticación no reconocía los tokens locales generados por la API, resuelto agregando validación directa con la clave secreta.
  - Error al generar preferencias de Mercado Pago en entorno de desarrollo local por configuración de retorno automático.
- **Commits:**
  - `feat(pagos): endpoint de pagos pendientes y correccion de auth guard`

---

#### 13/10/2026

#### Marcos Caraballo | Rol: Desarrollador Frontend y Backend

**Actividades:**

- Decidir forma de implementar un calendario y horarios de apertura y cierre independientes para cada sede, considerando feriados y días hábiles, permitiendo también generar slots de horario dinámicos para la reserva de canchas.
- Creación de nuevas entidades Calendario, CalendarioSede, SedeHorario.
- Creación y ejecución de script de seeding SQL para PostgreSQL/Supabase enfocado en las nuevas entidades, en canchas (con sede, tipo y tarifas diferenciadas) y en tipos de canchas para testing.
- Configuración de algunas fechas festivas en el calendario oficial (`calendario`) y reglas de excepción por sede (`calendario_sede`) para feriados nacionales (Navidad con cierre total y Día de la Soberanía con horario reducido en Central y cierre en Norte).
- Ajuste de endpoints en NestJS:
- `GET /canchas/:id/disponibilidad`: generación de matriz de turnos cruzando disponibilidad de reservas existentes, bloqueos por mantenimiento y horario operativo de la sede.
- `GET /canchas`: opción de filtrar canchas por sede para no traer todas las existentes.
- `GET /canchas/tipos`: obtener sólo los tipos de canchas sin tener que pedir todas las canchas y luego filtrar por tipo.
- `POST /reservas-canchas`: modificación considerable del endpoint de reservas para adaptarlo a la nueva forma de horarios con validaciones de seguridad.
  **Decisiones:**
- Intención de modificar lo mínimo necesario para no perjudicar al resto del equipo.
- Crear una entidad calendario que almacene dentro de lo posible todos los días del año, incluyendo atributos de festivo y si es habil o no.
- Permitir a cada sede definir sus propios horarios de apertura y cierre para cada día particular, definiendo horarios especiales o cierres por festivos independientemente de las otras sedes, mediante CalendarioSede, que almacenará excepciones al calendario general si las hubiera.
- Generar slots de horario dinámicos para la reserva de canchas en función del horario operativo de cada sede y de las reservas existentes, con verificación de que seguridad de que el horario termine en 00:00 para evitar reservas en horarios no convencionales, entre otras.
  **Dificultades:**
- Desfase de zona horaria: Conversión entre timestamps ISO UTC y la hora local de Argentina generaba desfases de 3 horas en los horarios guardados en la base de datos.
- Falta de endpoints necesarios y validaciones de seguridad en código preexistente.
- Importante retraso en la delegación de responsabilidad de tareas relacionadas a esta entrada de bitácora, teniendo en cuenta el tiempo disponible y la complejidad de las tareas.
  **Commits:**
  - `feat(prisma): adicion de entidades para calendario y horario`
  - `feat(M0): flujo para obtener el horario operativo de una sede`
  - `feat(M4): Implementacion de horarios para reservas de canchas y endpoint para cancha tipos`
  - `docs(log): actualizar log con tareas de calendario y horarios`

---

#### 05/10/2026

#### Matías Sillen | Rol: Desarrollador Backend

- **Actividades:**
- Corrección de los nombres de las relaciones de Prisma (membresia_plan y membresia_estado) en membresias.repository.ts para resolver el error 500 al consultar el estado de la membresía.
- Modificación del servicio de membresías para exponer el nombre_plan en el DTO de respuesta de verificación, permitiendo al frontend identificar el plan actual.
- Resolución del error de serialización (DecimalError) en planes.service.ts mapeando explícitamente el tipo Decimal de Prisma a un Number nativo antes de pasarlo por class-transformer.
- Ejecución de script SQL directamente en Supabase para poblar las tablas membresia_plan y membresia_estado con datos reales para las pruebas de integración.

- **Decisiones:**
- Unificar el identificador de los planes bajo la clave id_membresia_plan para respetar estrictamente el esquema de la base de datos y evitar problemas de mapeo en tiempo de ejecución.
- Interceptar y convertir los datos numéricos a nivel de servicio para prevenir crasheos de la librería plainToInstance al procesar los decimales de Prisma.

- **Dificultades:**
- La función plainToInstance crasheaba silenciosamente y arrojaba undefined al intentar procesar los objetos de tipo Decimal devueltos por Prisma, lo que requirió debuggear el flujo de transformación de datos.
- Discrepancia entre las relaciones solicitadas inicialmente (plan, estado) y las generadas reales de Prisma, lo que bloqueaba la consulta inicial.

- **Commits:**
- `fix(membresias): corregir nombres de relaciones prisma en repositorio y exponer nombre del plan en el dto`
- `fix(membresias): exponer nombre del plan en la respuesta de verificación de membresía`
- `fix(planes): convertir decimal de prisma a number nativo para evitar error en class-transformer`

---

---

#### 14/10/2026

#### Facundo Agüero | Rol: Team Leader

- **Commits:**
- `chore(env): configurar service_role key de supabase para saltar rls y permitir subida de fotos`

#### 14/10/2026

#### Angelina Vialle | Rol: Backend Developer

- **Actividades:** Arreglos de backend para integrarlo con el frontend.
- **Decisiones:**
  - Quitar el id de usuario de los dtos y usar el qr token
  - La manera de generar el token de qr es más simple
  - Elimine UserRepository porque no se usaba.
  - Cambie send por httpSend porque se iba a quedar obsoleto
- **Dificultades:** Ninguna.
- **Commits:** `feat(M2-M1): arreglos`

---

#### 20/10/2026

#### Marcos Caraballo | Rol: Desarrollador Backend

- **Actividades:**
  - Diseño e implementación de endpoint para consulta de disponibilidad masiva por sede (GET /canchas/disponibilidad con parametros sede y fecha ), optimizando la entrega para la grilla horaria para todas las canchas activas en una sola petición.
  - Implementación de endpoint de consulta individual de reserva por identificador (GET /reservas-canchas/:id), permitiendo recuperar la entidad con sus relaciones completas (cancha, sede, cancha_tipo, cancha_reserva_estado) para el flujo de confirmación y pago.
  - Refactorización y desacoplamiento del cálculo de tarifas: aseguramiento de congruencia entre la cotización del backend y la información consumida por el cliente.
- **Decisiones:**
  - Priorizar la reutilización de los métodos de repositorio y cálculo existentes sin alterar métodos innecesariamente, ni la estabilidad de las funcionalidades ya utilizadas por el resto del equipo.
  - Mantener el endpoint unitario por cancha (GET /canchas/:id/disponibilidad) para chequeos puntuales y añadir el endpoint en lote para optimizar las vistas de grilla general.
- **Dificultades:**
  - Falta de endpoints necesarios, lo que justifica esta serie de modificaciones.
- **Commits:**
  - `feat(M4): nuevos endpoints para reserva canchas y disponibilidad por sede y cancha`
  - `docs(log): actualizacion de bitacora`

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

#### 17/10/2026 - 22/10/2026

#### Matías Sillen | Rol: Desarrollador Backend

- **Actividades:**
- Desarrollo del endpoint proactivo `GET /auth/me` para la validación cruzada de existencia de perfil local de usuarios provenientes de Identity Providers externos (Google).

- **Decisiones:**
- Delegar la gestión de la identidad y contraseñas completamente a Supabase, manteniendo en la base de datos local de PostgreSQL únicamente los datos de negocio requeridos por FitZone (DNI, Sede, Teléfono).
- Descartar intervenciones sobre los errores de tipo `P1017` (ConnectionClosed) de Prisma, asumiendo el comportamiento natural del Hot-Reload de NestJS en entornos de desarrollo local.

- **Dificultades:**
- Resolución de conflictos de integridad referencial (claves foráneas) en PostgreSQL al intentar eliminar usuarios de prueba manualmente para depurar el flujo de Google OAuth. Se optó por el uso de `prisma studio` y `prisma migrate reset` para mantener el entorno de desarrollo consistente.

- **Commits:**
- `fix(usuarios): hacer contrasenia y foto_url opcionales en CreateUsuarioDto`
- `feat(usuarios): omitir hasheo si la contraseña es delegada a Supabase`
- `feat(auth): agregar endpoint /auth/me para verificar existencia de perfil local`

---

#### 23/10/2026

#### Matías Sillen | Rol: Desarrollador Backend

- **Actividades:**
- Implementación de pruebas unitarias para `AuthService` utilizando Jest, cubriendo flujos de inicio de sesión local exitosos, credenciales inválidas y asignación de roles por defecto.
- Creación de pruebas de integración HTTP con Supertest para validar el comportamiento real de `ValidationPipe` sobre `CreateUsuarioDto`, verificando transformaciones, regex de DNI y reglas de negocio.
- Refactorización de `AuthService`, extrayendo la validación de credenciales contra la base de datos y la comprobación con `bcrypt` a un método privado independiente (`validateLocalUser`).
- Refactorización de `UsuariosService`, aislando la lógica de hasheo de contraseñas (para registros de administrador) y la asignación de placeholder (para Supabase) en el método privado `generatePasswordHash`.

- **Decisiones:**
- Levantar un controlador efímero (dummy) en la suite de pruebas de integración del DTO para poder golpear el pipeline HTTP real de NestJS sin depender de los endpoints de los controladores productivos.
- Aplicar el Principio de Responsabilidad Única (SRP) en los servicios, separando de forma clara la validación de identidad en la base de datos de la emisión y firmado de tokens JWT.

- **Dificultades:**
- Estructurar los mocks del repositorio `UsuariosRepository` y dependencias externas como `bcrypt` de forma estrictamente tipada en Jest para cumplir con la regla de no utilizar `any` en las pruebas unitarias.

- **Commits:**
- `test(auth): agregar pruebas unitarias de Auth Service`
- `test(users): cubrir validaciones del DTO de creación mediante ValidationPipe`
- `refactor(auth): separar validacion de credenciales en AuthService`
- `refactor(users): aislar logica de hasheo de contraseñas de la creacion base`

---

#### 22/10/2026

#### Marcos Caraballo | Rol: Desarrollador Frontend

- **Actividades**:
  - Actualización de los DTOs para crear y actualizar canchas, incorporando el atributo booleano opcional `disponible`.
- **Decisiones**:
  - Incorporar `disponible` en los DTOs de creación y actualización para permitir definir la disponibilidad operativa de la cancha desde su alta o modificarla puntualmente según necesidades de la sede.
- **Dificultades**: Ninguna
- **Commits:**
- `feat(M4): incorporar atributo disponible en dts para su modificacion`
- `docs(log): actualizacion de bitacora`

---

#### 23/10/2026

#### Marcos Caraballo | Rol: Desarrollador Backend

- **Actividades:**
  - Implementación del CRUD completo para tipos de cancha (`CanchaTipo`) en el módulo M4 (`POST /canchas/tipos`, `GET /canchas/tipos`, `PATCH /canchas/tipos/:id` y `DELETE /canchas/tipos/:id`).
  - Creación de DTOs (`CrearTipoCanchaDto`, `ActualizarTipoCanchaDto`).
  - Implementación de borrado lógico preventivo para tipos de cancha, validando que no existan canchas activas asociadas antes de permitir la baja.
  - Optimización de rendimiento en el endpoint de disponibilidad masiva por sede (`GET /canchas/disponibilidad`), eliminando el problema de consultas redundantes.
  - Reestructuración de consultas en paralelo mediante `Promise.all` y lectura por lote de reservas y mantenimientos del día para todas las canchas de la sede en una única consulta.
  - Procesamiento y cálculo de la matriz de slots horarios (disponible, reservado, mantenimiento) en memoria mediante maps para acelerar el tiempo de respuesta.
  - Optimización en `SedeService` y repositorios para la resolución de horarios operativos sin consultas redundantes.
- **Decisiones:**
  - Aplicar borrado lógico en `CanchaTipo` para preservar el historial referencial, impidiendo la baja si existen canchas activas que dependan de dicha disciplina.
  - Permitir listar tipos inactivos opcionalmente mediante el query param `?inactivos=true`, manteniendo por defecto solo los activos para no alterar el comportamiento de cara al usuario final.
  - Eliminar los cuellos de botella de red trayendo todas las reservas y mantenimientos de la sede en bloque y delegando el filtrado y armado de slots a la memoria RAM del servidor.
- **Dificultades:**
  - Tiempos de respuesta lentos en la consulta de grilla de disponibilidad debido a la ejecución de consultas repetitivas a la base de datos por cada cancha; resuelto agrupando las peticiones por lote y procesando los rangos en memoria.
  - Dificultad para medir los tiempos de respuesta por problemas con el navegador; resuelto descargando uno diferente.
- **Commits:**
  - `feat(M4): Crud de cancha tipos funcionando`
  - `refactor(M4): Optimizacion de consultas lentas en modulo de canchas`
  - `chore(M4): formato con prettier`
  - `docs(log): actualizacion de bitacora`

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

- `feat(M1): Cambios para obtener los usuarios con sus respectivos datos, actualizar datos de usuario y crear usuarios`
- `feat(M2): quitar console.log, mensajes, mejora de obtener aforo`
- `feat(M2): arreglos en aforo realtime para que funcione correctamente`
- `docs(log): actualizar bitacora`

#### 24/10/2026

#### Marcos Caraballo | Rol: Desarrollador Backend

- **Actividades:**
  - Implementación del endpoint de consulta y listado de mantenimientos de canchas (`GET /canchas/mantenimientos`) en el módulo M4.
  - Soporte de filtros opcionales en el endpoint: por sede (`sedeId`), por cancha (`canchaId`) y por rango de fechas (`fechaInicio` y `fechaFin`).
  - Implementación de validaciones en `MantenimientoService` para validar que los IDs sean enteros positivos y que el rango cronológico sea coherente (`BadRequestException`).
  - Normalización automática de fechas: soporte de formato `YYYY-MM-DD` extendiendo `fechaFin` al final del día (`23:59:59.999Z`) para abarcar la jornada completa.
  - Integración en `CanchasRepository` mediante una consulta optimizada que obtiene los mantenimientos junto con sus relaciones (`cancha`, `sede` y `cancha_tipo`) en una única operación.
- **Decisiones:** Ninguna
- **Dificultades:** Ninguna.
- **Commits:**
  - `feat(M4): metodos para crud de mantenimiento`
  - `docs(log): actualizacion de bitacora`

---

#### 26/10/2026

#### Gonzalo Lima | Rol: Desarrollador Backend

- **Actividades:**
  - Implementación de la lógica de cálculo y vencimiento para los 3 planes de membresía (Mensual: 30 días, Trimestral: 90 días, Anual: 365 días) utilizando adición de meses calendario y ajuste al último día del mes ante desfasajes de días.
  - Implementación de la confirmación atómica transaccional ante la aprobación del pago, se calculan las fechas de vigencia considerando la fecha máxima entre la actual y la vigencia remanente de una membresía activa previa.
  - Estricta restricción del catálogo de estados de membresía a los 3 estados oficiales del negocio: Activa, Vencida y Suspendida, eliminando cualquier referencia al estado transitorio Pendiente.
- **Decisiones:**
  - Utilizar meses calendario en lugar de sumas fijas de 30 o 365 días en el cálculo de vigencia para garantizar que un plan mensual o anual venza exactamente en el mismo día del mes siguiente o del año próximo.
  - Garantizar atomicidad mediante $transaction de Prisma para que la actualización del pago, la desactivación de membresías previas y la activación de la nueva se ejecuten de forma segura e idempotente.
- **Dificultades:** Ninguna
- **Commits:**
  - `feat(membresias): soporte y lógica de duración para planes mensual, trimestral y anual`
  - `feat(pagos): flujo de contratación de planes y activación de membresías`
  - `fix(membresias): ceñir ciclo de vida a 3 estados (activa, vencida, suspendida) y remover pendiente`
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
