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

#### Gonzalo Lima y Matías Sillen | Rol: Desarrolladores Backend

- **Actividades:** Diseñar en conjunto el diagrama de entidad-relación de la base de datos.
- **Decisiones:** Usar Draw.io para armar el diagrama porque es visual, gratuito y nos permite editar o exportar facilmente.
  Utilizar tablas en lugar de enumeraciones para roles, tipos y estados. Añadir tabla ciudad para asociarla a sedes, para poder evitar que un socio use libremente las sedes de otras ciudades, sin afectar las de su misma ciudad.
- **Dificultades:** Ninguna
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

#### Angelina Vialle y Facundo Agüero | Rol: Backend Developers

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

#### 22/09/2026

#### Matías Sillen Ríos | Rol: Desarrollador Backend

* **Actividades:** Implementación de la grilla horaria de disponibilidad de alto rendimiento para canchas, creando los DTOs de consulta y respuesta, el repositorio de reservas optimizado con rangos de fechas, el algoritmo de cruce de slots en memoria dentro del servicio y el endpoint documentado con Swagger.
* **Decisiones:**
* Generar los bloques horarios de manera dinámica en memoria (de 08:00 a 23:00) cruzando en paralelo las reservas y los mantenimientos para garantizar respuestas en milisegundos (RNF-03).
* Separar el acceso a datos en un repositorio especializado (`ReservasCanchasRepository`) para aislar las consultas de disponibilidad de la entidad base de canchas.


* **Dificultades:** Ninguna.


* **Commits:**
* `feat(dtos): crear dtos de validacion de fecha a ingresar`
* `feat(repository): crear nuevo repositorio para separar la lógica de reservas/mantenimiento de la entidad base de canchas`
* `feat(service): actualizar canchas.services.ts inyectando el nuevo repo reservas-canchas.repository.ts y agregar nuevo metodo obtenerDisponibilidad()`
* `feat(controller): crear endpoint de disponibilidad en canchas.controller.ts`
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
#### 23/09/2026

#### Angelina Vialle | Rol: Desarrolador Backend

- **Actividades:** Desarrollar el módulo de validación de ingreso por QR y verificación de membresía en tiempo real para autorizar o rechazar ingresos físicos en las sedes,

- **Decisiones:**
  - Aplicar transacciones atómicas para prevenir condiciones de carrera y validar el anti-doble ingreso..
- **Dificultades:** Ninguna.
- **Commits:**
  - ``

---
#### 25/09/2026

#### Angelina Vialle | Rol: Desarrolador Backend

- **Actividades:** Desarrollar DTO de validacion de reglas de acceso, service y repository de validacion de reglas de acceso

- **Decisiones:**
  - Aplicar transacciones atómicas para prevenir condiciones de carrera y validar el anti-doble ingreso..
- **Dificultades:** Ninguna.
- **Commits:**
  - `Tarea 1: DTO Validacion de Reglas de Acceso`
  - `Tarea 3.2: Consulta de Accesos Activos en Repositorio`
  - `Tarea 3.3: Aplicación de la Regla RN-01 en el Servicio de Accesos`
  - `Correcciones`
  
#### 24/09/2026

#### Matías Sillen Ríos | Rol: Desarrollador Backend

* **Actividades:** Desarrollo del motor de precios dinámicos aplicando el Patrón Strategy (RF-11), creando el DTO de cotización, la interfaz base, las estrategias concretas para precio estándar, descuento del 15% para socios activos y recargo por horario pico, y el servicio orquestador de contexto.
* **Decisiones:**
* Implementar composición de estrategias en el contexto para permitir que un socio activo que reserva en horario pico reciba correctamente tanto el recargo como su beneficio correspondiente.


* **Dificultades:** Ninguna.
* **Commits:**
* `feat(strategy): definir la interfaz precio-strategy.interface.ts y cotizacion-turno-dto.ts`
* `feat(strategy): implementar estrategias`
* `feat(service): implementar precio-context.service.ts para gestionar las estrategias correspondientes`
* `feat(module): inyectar las estrategias en el array providers en canchas.module.ts`

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

* **Actividades:** Implementación del flujo de reservas de canchas con control de concurrencia (US-05-04). Se crearon los DTOs correspondientes, la persistencia transaccional en el repositorio, la orquestación en el servicio integrando el cálculo de precios mediante el patrón Strategy, y el endpoint POST documentado con Swagger.
* **Decisiones:**
* Utilizar el método atómico `$transaction` de Prisma a nivel de base de datos para validar solapamientos horarios y persistir la reserva en una misma operación, previniendo así condiciones de carrera (race conditions) y sobreventa de turnos.
* Dejar la inyección del usuario autenticado (decoradores y guards de JWT) comentada temporalmente y utilizar un ID de usuario fijo (`mock`) para poder probar el flujo completo de forma aislada hasta que el equipo consolide la Épica 1.
* Simular temporalmente mediante logs el broadcast hacia Supabase Realtime, preparando el terreno para la actualización en vivo de la grilla.


* **Dificultades:** Ninguna.
* **Commits:**
* `feat(canchas): crear DTOs de entrada y respuesta para reservas`
* `feat(canchas): implementar bloqueo transaccional contra concurrencia en repositorio`
* `feat(canchas): orquestar reserva integrando Strategy y persistencia atómica`
* `feat(canchas): exponer endpoint protegido de reservas de canchas`
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
