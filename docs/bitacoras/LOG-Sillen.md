#### 24/08/2026 - 05/09/2026

#### Marcos Caraballo, Angelina Vialle, Facundo Agüero, Matías Sillen | Roles: Diseñadores de arquitectura

- **Actividades:** Reunión de equipo para modelar el sistema completo en Visual Paradigm (Contexto C1, Contenedores C2 y Componentes C3).
- **Decisiones:**
  - Adoptar Supabase como contenedor para resolver base de datos PostgreSQL, storage de comprobantes y notificaciones en tiempo real.
  - Separar el frontend en una SPA (Vue.js) y un contenedor de contenido estático (Nginx).
  - Diseñar el backend (NestJS) estructurado en módulos claros: canchas, pagos con webhooks de Mercado Pago, accesos y clases grupales con lista de espera.
- **Dificultades:** Definir cómo interactúa el cliente web tanto con la API de NestJS como con los servicios en tiempo real de Supabase.

---

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

---

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

#### 14/11/2026

#### Matías Sillén Ríos | Rol: Desarrollador Backend

- **Actividades:**
  - Corrección de la inicialización del adaptador PostgreSQL en `PrismaService` (`src/database/prisma-service/prisma.service.ts`), pasando `{ connectionString }` directamente a `PrismaPg` conforme a la API oficial de `@prisma/adapter-pg` v7 y eliminando la advertencia de deprecación de `client.query()` en `pg`.
  - Optimización de las consultas de autenticación y perfil de sesión mediante la incorporación de `authProfileSelect` y `findAuthProfileByEmail` en `UsuariosRepository`, evitando joins innecesarios sobre membresías, estados y ciudades en `SupabaseAuthGuard` y `AuthService`.
  - Unificación de la validación de unicidad de DNI y correo electrónico en `findExistingByDniOrEmail` (una sola consulta indexada `OR`) y resolución de fallback para avatares de cuentas de Google OAuth (`user_metadata.avatar_url` / `picture`) en `SupabaseAuthGuard` y `AuthenticatedUser`.
  - Implementación de asignación dinámica del rol `externo` en `UsuariosService.create` mediante `findRolByNombre('externo')` en PostgreSQL, eliminando IDs hardcodeados e ignorando roles privilegiados enviados desde el cliente.
  - Blindaje del endpoint `PATCH /usuarios/:id` y de `ActualizarUsuarioDto` (`OmitType`) con `SupabaseAuthGuard`, validando propiedad del perfil e impidiendo modificaciones sobre `dni`, `email`, `roles`, `contrasenia` o `password`.
  - Fortalecimiento de `FotoStorageService` y `UploadFotoController` (`POST /usuarios/:id/foto`) con validación de tipos MIME permitidos (`image/jpeg`, `image/png`, `image/webp`), límite de 2 MB, nombres únicos con marca de tiempo para evitar caché obsoleta y eliminación segura del avatar anterior del usuario en Supabase Storage (`fitzonepublic`).
  - Cobertura de pruebas unitarias y de integración HTTP en `src/modules/M1-usuarios/services/usuarios.service.spec.ts` y `test/auth-profile.e2e-spec.ts` (Jest + Supertest).
- **Decisiones:**
  - Separar `authProfileSelect` de `defaultIncludes` en `UsuariosRepository` para que la verificación de sesión en `GET /auth/me` y endpoints protegidos transfiera únicamente los campos de identidad y roles necesarios.
  - Resolver el rol `externo` dinámicamente por nombre en la base de datos en lugar de confiar en el arreglo `roles` enviado en el payload de registro, cerrando cualquier vector de escalada de privilegios y desacoplando el código del orden autoincremental de `id_rol`.
  - Validar la propiedad del recurso directamente en los controladores de actualización de perfil y subida de avatar antes de ejecutar operaciones sobre Prisma o Supabase Storage.
- **Dificultades:**
  - La carga repetida de relaciones completas (`defaultIncludes`) durante la validación de tokens en el guard incrementaba la latencia de respuesta en cada petición autenticada debido a la distancia con la base de datos remota, lo cual se mitigó reduciendo la selección granular en el repositorio.
- **Commits:**
  - `fix(router): corregir advertencia deprecada de consultas de cliente`
  - `perf(auth): optimizar consultas de autenticacion y perfil de sesion`
  - `fix(auth): asignar rol externo dinamicamente en el registro`
  - `feat(profile): blindar actualizacion de perfil y almacenamiento de avatar`
  - `test(auth): agregar pruebas unitarias y de integracion de auth y perfil`
  - `fix(auth): resolver avatar de Google desde user_metadata como fallback`
  - `fix(auth): formateo y ajustes adicionales de tests y DTOs`
  - `fix(test): ignorar chequeo de tipos en adaptador temporal prisma-pglite`

---

#### 14/11/2026

#### Matías Sillén Ríos | Rol: Desarrollador Backend

- **Actividades:**
  - Implementación de las consultas y endpoints protegidos para el Dashboard exclusivo del Socio e Historial de Reservas (`E15-T2`), restringiendo el acceso exclusivamente a usuarios autenticados con rol `socio` validado desde la base de datos mediante `SupabaseAuthGuard` y validación de roles en el backend.
  - Creación de DTOs de consulta y respuesta tipados (`class-validator` y Swagger) para recuperar de forma paginada y ordenada (de más reciente a más antigua) las reservas de canchas y las inscripciones a clases grupales pertenecientes únicamente al identificador del usuario autenticado (`req.user.id_usuario`).
  - Optimización de consultas en Prisma mediante selección granular (`select`/`include`) de fechas, horarios, canchas, clases grupales, sedes y estados reales persistidos en PostgreSQL, evitando consultas N+1 y exposición de registros de otros usuarios.
  - Incorporación de pruebas unitarias y de integración HTTP (Jest + Supertest) verificando el aislamiento de datos por usuario, el ordenamiento cronológico descendente, el bloqueo `403 Forbidden` para usuarios con rol `externo` y la respuesta `401 Unauthorized` ante peticiones sin token válido.
- **Decisiones:**
  - Obtener el `id_usuario` y la verificación del rol `socio` exclusivamente desde el contexto de autenticación del token validado en el servidor (`request.user`), rechazando cualquier identificador enviado por parámetros o query desde el cliente para evitar filtraciones de historial entre socios.
  - Implementar paginación y filtrado opcional por tipo de actividad (`todas`, `canchas`, `clases`) directamente en la capa de consulta de Prisma para permitir recorrer el historial completo sin transferir cargas innecesarias.
- **Dificultades:**
  - Unificar en una respuesta consistente las reservas de canchas y las inscripciones a clases grupales manteniendo los estados reales de cada entidad sin inferir estados por fecha; se resolvió normalizando ambos orígenes en DTOs tipados que preservan el estado persistido y la sede asociada de cada registro.
- **Commits:**
  - `feat(socio): implementar dashboard e historial de reservas para socio`
  - `corregir reglas de lint y mock en tests unitarios y adaptadores`

---
