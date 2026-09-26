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

---

#### 25/09/2026

#### Marcos Caraballo | Rol: Desarrollador Backend

- **Actividades:**

  - Finalización de la tarea de Carga de fotos de usuario y ensamblado preliminar del módulo de usuarios.
  - Implementación y refinamiento de `CreateUsuarioDto` con validaciones estrictas de `class-validator`, transformaciones de sanitización con `class-transformer` (normalización de DNI, emails en minúsculas y capitalización automática de nombres/apellidos) y documentación interactiva para Swagger mediante `@ApiProperty`.
  - Integración en `UsuariosRepository` y `UsuariosService` con guardas de unicidad para DNI y correo electrónico.

- **Decisiones:**
  - Sanitizar y limpiar los datos de entrada directamente en la capa de DTOs utilizando decoradores `@Transform` para evitar duplicar lógica de procesamiento de cadenas en los servicios.
  - Mantener la relación directa de usuarios con sedes y roles, evitando entidades intermedias o abstracciones redundantes como la tabla "Socio".

- **Dificultades:**
  - Ajuste de los DTOs para mantener compatibilidad entre los datos de formulario de fotos de perfil y los atributos requeridos por la tabla de usuarios en Prisma sin alterar el flujo de registro.

- **Commits:**
  - `feat(M1): implementar DTO de creacion de usuario con sanitizacion y Swagger`
  - `feat(M1): ensamblado preliminar del modulo de usuarios y carga de foto`

  #### 26/09/2026

#### Marcos Caraballo | Rol: Desarrollador Backend

- **Actividades**
  - Implementación completa de la US-02-04: Asignación, Renovación y Control de Estados de Membresía (RF-02).
  - Definición de los DTOs de contrato (`CreateMembresiaDto`, `ActualizarMembresiaEstadoDto`, `MembresiaResponseDto`).
  - Implementación de las operaciones de membresías de usuario en `MembresiasRepository` (`create`, `findById`, `findActiveByUsuarioId`, `findByUsuarioId`, `findAll`, `updateEstado`, `deactivatePrevious`).
  - Desarrollo de la lógica de negocio en `MembresiasService` y ruteo en `MembresiasController`.

- **Decisiones**
  - Programar el cálculo dinámico de vigencia en el servicio (`fecha_inicio = HOY` y `fecha_fin = HOY + duracion_dias` del plan) cuando no se envían fechas explícitas desde el cliente.
  - Garantizar la regla de negocio de una sola membresía activa por usuario a la vez, ejecutando automáticamente `deactivatePrevious()` (pasando a estado Vencido) antes de registrar un nuevo alta.

- **Dificultades**
  - Incompatibilidad de tipos estricta en TypeScript al pasar propiedades opcionales provenientes de DTOs parciales (`PartialType`) hacia parámetros numéricos requeridos del repositorio. Se resolvió aplicando guardas de validación defensivas (`if (!dto.id_membresia_estado)`) en el servicio.

- **Commits:**
  - `feat(M1): crear DTOs de asignacion, cambio de estado y respuesta de Membresias`
  - `feat(M1): implementar metodos de persistencia de membresias en MembresiasRepository`
  - `feat(M1): implementar MembresiasService con calculo de fechas y regla de una sola activa`
  - `feat(M1): implementar MembresiasController ajustado a MembresiasService`