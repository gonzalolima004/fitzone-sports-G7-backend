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

#### Gonzalo Lima | Rol: Desarrolador Backend

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
