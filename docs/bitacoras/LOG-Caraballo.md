#### 23/08/2026

#### Marcos Caraballo y Angelina Vialle | Rol: Desarrolladores Backend

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
- **Commits:** `0da863f` `Armado de schema.prisma inicial`

---

#### 01/09/2026 a 06/09/2026

#### Angelina Vialle y Marcos Caraballo | Rol: Backend Developers

- **Actividades:** Escribir los registros de decisiones (ADRs) para el backend del proyecto.
- **Decisiones:** ----
- **Dificultades:** Pensar en todas las decisiones de arquitectura y de implementación que deberían de tenerse en cuenta antes de arrancar el proyecto.
- **Commits/PRs:** `13dafe2` `ADR-backend`

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
- `bf1698f` `feat(M1): implementar UsuariosRepository con PrismaService`
- `ad89e82` `feat(M1): Implementar UsuarioService con encriptación bcrypt`
- `e2bf248` `feat(M1): implementar UsuariosController con anotaciones Swagger`
- `d184b69` `feat(M1): Implementar class transformer en dtos y que sean utilizados en el flujo`

---

#### 23/09/2026

#### Marcos Caraballo | Rol: Desarrollador Backend

**Actividades:**

- Creación del DTO `UploadFotoResponseDto` para definir el contrato de respuesta estructurado tras la subida de fotos de perfil.
  **Decisiones:**
- Definir un DTO específico de respuesta para la carga de imágenes, asegurando que el cliente reciba un formato estandarizado con la URL devuelta por el almacenamiento.
  **Dificultades:** Ninguna.
  **Commits:**
- `3135dfe` `feat(M1): crear UploadFotoResponseDto para respuesta de foto de perfil`

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
- `f3a522d` `feat(M1): crear FotoStorageService para gestionar fotos con supabase storage`
- `3ba3582` `feat(M1): implementar UploadFotoController para carga de fotos`
- `8d66051` `feat(M1): crear DTOs para crear, actualizar y el response de membresia_plan`
- `c75c94e` `feat(M1): crear MembresiasRepository para gestion de planes y estados`
- `516f5ae` `feat(M1):implementar repositorio, servicio y controlador para gestion de planes de membresia`

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
- `b4de0c5` `feat(M1): crear DTOs de asignacion, cambio de estado y respuesta de Membresias`
- `8552897` `feat(M1): implementar MembresiasService con validaciones de existencia y control de estado`
- `64390bc` `feat(M1): implementar MembresiasController`
- `95cede7` `docs(log): actualizar bitacora`

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
- `838e0f5` `feat(M1): crear DTO de respuesta para verificacion multi-sede y regla de mora`
- `a741ad3` `feat(M1): agregar verificacion de membresia multi-sede y regla de mora en MembresiasService`
- `bc97489` `feat(M1): implementar metodo para verificar membresia en el controller de membresias`
- `796b738` `feat(app): registrar UsuariosModule (M1) en AppModule`
- `d4e15bb` `docs(log): actualizar bitacora`

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
  - `50079d2` `feat(prisma): adicion de entidades para calendario y horario`
  - `ea2b17f` `feat(M0): flujo para obtener el horario operativo de una sede`
  - `5bfdc48` `feat(M4): Implementacion de horarios para reservas de canchas y endpoint para cancha tipos`
  - `bc04953` `docs(log): actualizar log con tareas de calendario y horarios`

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
  - `9338bc8` `feat(M4): nuevos endpoints para reserva canchas y disponibilidad por sede y cancha`
  - `2edc5e7` `docs(log): actualizacion de bitacora`

---

#### 22/10/2026

#### Marcos Caraballo | Rol: Desarrollador Frontend

- **Actividades**:
  - Actualización de los DTOs para crear y actualizar canchas, incorporando el atributo booleano opcional `disponible`.
- **Decisiones**:
  - Incorporar `disponible` en los DTOs de creación y actualización para permitir definir la disponibilidad operativa de la cancha desde su alta o modificarla puntualmente según necesidades de la sede.
- **Dificultades**: Ninguna
- **Commits:**
- `ca988b3` `feat(M4): incorporar atributo disponible en dts para su modificacion`
- `9484741` `docs(log): actualizacion de bitacora`

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
  - `97bccb9` `feat(M4): Crud de cancha tipos funcionando`
  - `20591b1` `refactor(M4): Optimizacion de consultas lentas en modulo de canchas`
  - `ce5bc3d` `chore(M4): formato con prettier`
  - `b8cb1b3` `docs(log): actualizacion de bitacora`

---

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
  - `955b527` `feat(M4): metodos para crud de mantenimiento`
  - `2b3c09c` `docs(log): actualizacion de bitacora`

---

#### 03/11/2026

#### Marcos Caraballo | Rol: TL - Desarrollador Full Stack

- **Actividades:**
  - Integración y activación de `SupabaseAuthGuard` junto al decorador `@CurrentUser()` en la creación de reservas de canchas (`POST /reservas-canchas`), extrayendo el ID real del usuario autenticado (`usuario.id_usuario`) y removiendo los mocks temporales de testing.
  - Optimización del endpoint de disponibilidad de canchas por sede (`GET /canchas/disponibilidad/sede`), permitiendo filtrado opcional por tipo de cancha (`tipoId`) mediante el método `obtenerCanchasParaGrilla` en `CanchasRepository`.
  - Reestructuración de la respuesta del servicio de disponibilidad en `CanchasService`, unificando la información de horarios operativos de la sede (`abierto`, `hora_apertura`, `hora_cierre`, `motivo_cierre`) junto a las canchas y slots para su renderizado óptimo en la grilla del frontend.
  - Optimización de performance en backend evitando llamadas y consultas innecesarias de reservas y mantenimientos a Supabase cuando la sede se encuentra cerrada.
- **Decisiones:** Cambiar el endpoint para la grilla de turnos, de manera que traiga la disponibilidad para un tipo de cancha en vez de todas a la vez.
- **Dificultades:** Ninguna.
- **Commits:**
  - `8d75303` `feat(M4): fix de errores por supabase auth`
  - `63dc419` `feat(M4): optimizacion de slots de horarios`
  - `0509465` `fix(log): correccion de formato`
  - `ad5b961` `docs(log): actualizacion de bitacora`

---

#### 04/11/2026

#### Marcos Caraballo | Rol: TL - Desarrollador Full Stack

- **Actividades:**
  - Implementación del endpoint de cotización de turnos de canchas (`GET /canchas/cotizar`) en el módulo M4, protegido mediante `SupabaseAuthGuard` y extrayendo el usuario autenticado con `@CurrentUser()`.
  - Creación de los DTOs de validación y respuesta (`CotizarTurnoQueryDto` y `CotizacionResponseDto`) con `class-validator`, normalización de tipos y esquemas documentados en Swagger.
  - Implementación de la regla de descuento para socios (15%) condicionado a: rol socio, membresía activa en la fecha del turno y reserva en una sede de su misma ciudad (`id_ciudad`).
  - Implementación del recargo por horario pico (+20%) para turnos entre las 19:00 y las 21:00 hs mediante el patrón Strategy (`PrecioStrategy`, `PrecioEstandarStrategy`, `DescuentoSocioStrategy`, `HorarioPicoStrategy`, `PrecioContextService`).
  - Optimización de consultas en `CanchasRepository` mediante Prisma utilizando selección granular (`select`) y filtrado relacional de membresías activas por fecha, reduciendo la sobrecarga de datos transferidos.
  - Diseño e implementación de un servicio de caché desacoplado (`CotizacionCacheService`) bajo el patrón Adapter/Cache Provider, con política de desalojo LRU (máx. 500 entradas), TTL de 30 segundos y contrato asíncrono para facilitar la integración futura con Redis sin alterar la lógica de negocio.
  - Cobertura completa de pruebas unitarias en `canchas-cotizar.service.spec.ts` y `cotizacion-cache.service.spec.ts`, validando cálculos de precios, reglas de descuento, horario pico, expiración y desalojo de caché.
- **Decisiones:**
  - Utilizar el patrón Strategy para la aplicación de tarifas dinámicas (descuento socio y recargo pico), garantizando extensibilidad sin acoplar reglas en el servicio principal.
  - Implementar un Cache Provider dedicado en memoria con política LRU en lugar de caché dentro del servicio o un Map directo, asegurando que `CanchasService` se mantenga 100% stateless y evitando fugas de memoria.
- **Dificultades:**
  - El servidor de la base de datos se encuentra en Oregon (EE.UU.), haciendo que hasta la petición más básica de SELECT 1 demore 250ms en el MEJOR caso posible. El uso de cache es una forma de evitar realizar consultas redundantes. Funciona bien por ahora en tests manuales y automatizados, por lo que si mañana sigue funcionando sin errores, planeo incluir una tarea, o más, en trello para integrarlo en otros puntos donde sea apropiado, sin afectar que realmente requieran ir a la base de datos real.
- **Commits:**
  - `eec2908` `feat(M4): crear endpoint para cotizar precios`
  - `6b2fea3` `feat(M4): endpoint para cotizar canchas`
  - `4cb9d3a` `test(M4): test para cache de cotizacion`
  - `c5e0ea7` `docs(log): actualizacion de bitacora`

---

#### 06/11/2026

#### Marcos Caraballo | Rol: TL - Desarrollador Full Stack

- **Actividades:**
  - Implementación de `CanchasRealtimeService` para emitir eventos de turnos reservados (`turno_reservado`) vía broadcast en canales por sede (`canchas:sede:${idSede}`), notificando de forma no bloqueante y tolerante a fallos al crearse una reserva (`POST /reservas-canchas`).
  - Ajuste en `SupabaseService.emitRealtimeEvent` asegurando la suscripción activa (`SUBSCRIBED`) antes de emitir el broadcast y liberando el canal de manera controlada.
  - Implementación de bloqueo pesimista (`SELECT ... FOR UPDATE`) en `ReservasCanchasRepository.crearReservaTransaccional` sobre la cancha seleccionada, previniendo condiciones de carrera ante reservas simultáneas.
  - Fix en M0 para incluir el campo de horario especial en sedes.
  - Cobertura de pruebas unitarias para el servicio realtime y repositorios en M4.
- **Decisiones:**
  - Utilizar bloqueo pesimista a nivel de fila sobre la cancha para serializar atómicamente la verificación de colisión e inserción, evitando colisiones concurrentes sin degradar la concurrencia general.
- **Dificultades:** Ninguna.
- **Commits:**
  - `fb182c1` `feat(Supabase): integrar logger en canal realtime`
  - `765cd1f` `feat(M4): crear service para reservas realtime`
  - `5d670b0` `feat(M4): utilizacion del service realtime`
  - `f3bef05` `feat(M4): bloqueo pesimista en reserva cancha repo`
  - `0dee3ec` `feat(M4): tests para supabase realtime en canchas`
  - `faadc0b` `feat(M4): inclusion del modulo de realtime`
  - `082edc7` `fix(M0): faltaba el campo es horario especial`
  - `03e1940` `feat(M2): compatibilidad de test por cambios en realtime service`
  - `0b09a93` `docs(log): actualizacion de bitacora`
  - `978b56e` `fix(entorno): reestablecer husky y eliminar settings`

---

#### 07/11/2026

#### Marcos Caraballo | Rol: TL - Desarrollador Full Stack

- **Actividades:**
  - Corrección en la composición del Patrón Strategy (`PrecioContextService`), garantizando que el descuento de socio se aplique sobre el costo base de la cancha y no sobre el recargo pico acumulado, eliminando la discrepancia entre cotización y confirmación de reserva.
  - Unificación de la lógica de tarifas en `ReservasCanchasService`, delegando en `CanchasService.cotizarTurno` para mantener una única fuente de verdad y validar consistencia de membresía activa y misma ciudad.
  - Corrección de fuga de abstracción en `ReservasCanchasService`, reemplazando consultas directas a Prisma por el método `obtenerMantenimientosPorFecha` de `ReservasCanchasRepository`.
  - Protección y autorización en `GET /reservas-canchas/:id`, permitiendo el acceso únicamente al titular de la reserva o a roles de staff (`gerente`, `recepcionista`, `administrador`).
  - Inclusión de los datos del usuario y parseo a tipo numérico de los campos `Decimal` en la consulta de reservas para consumo limpio desde el frontend.
  - Mantenimiento y actualización de suites de pruebas unitarias y de integración en M4.
- **Decisiones:**
  - Asegurar `GET /reservas-canchas/:id` validando titularidad y roles de usuario para evitar consultas de un cliente a reservas ajenas.
- **Dificultades:** Discrepancia de precios generada por calcular el descuento de socio sobre el subtotal con recargo pico en vez de sobre la tarifa base.
- **Commits:**
  - `1b43650` `fix(canchas): corregir calculo de precios`
  - `810eedf` `feat(M4): autorizacion en endpoint de reservas`
  - `2b87774` `docs(log): actualizacion de bitacora`

---

#### 07/11/2026

#### Marcos Caraballo | Rol: TL - Desarrollador Full Stack

- **Actividades:**
  - Habilitación de descuento de socio para usuarios con membresías suspendidas cuyo ciclo abonado continúe vigente (con pago aprobado).
  - Eliminación de IDs numéricos hardcodeados en M4 mediante resolución dinámica de estados en BD (`Pendiente de Pago` y `Confirmada`).
  - Blindaje de endpoints administrativos y transaccionales en controladores de M4 mediante `@UseGuards(SupabaseAuthGuard, RolesGuard)` y RBAC.
  - Saneamiento y limpieza de referencias y anotaciones de requisitos en controladores, DTOs y repositorios.
- **Decisiones:** Ninguna
- **Dificultades:**
  - Integrar compatibilidades con merges anteriores sobre beneficios de membresias desactivadas
  - Asegurar la correcta asignación del estado inicial `Pendiente de Pago` antes del impacto del webhook de cobro.
- **Commits:**
  - `17a7ee7` `refactor(M4): integrar beneficios, normalizar estados, blindar con useguards y limpieza`
  - `09c557c` `docs(log): actualizacion de bitacora`

---

#### 10/11/2026

#### Marcos Caraballo | Rol: TL - Desarrollador Full Stack

- **Actividades:**
  - Modularización y extracción del motor de cálculo y partición de slots en memoria a `CanchasDisponibilidadService`, manteniendo a `CanchasService` como Fachada para asegurar retrocompatibilidad.
  - Eliminación de valores repetidos hardcodeados en M4 mediante constantes centralizadas en `canchas.constants.ts` y utilidades comunes de fechas.
  - Unificación del flujo de cotización en `ReservasCanchasService` delegando en `CanchasService.cotizarTurno`.
  - Implementación de la suite de tests unitarios para `CanchasDisponibilidadService` (generación de slots, aperturas fraccionadas, bloqueos) y `ReservasCanchasService` - **Decisiones:**
    - Remover los valores repetidos primitivos optando por un archivo que contiene los valores como constantes.
    - Desligar lo relacionado a disponibilidad de canchas de cancha service en un archivo service dedicado a esa tarea.
- **Dificultades:** Ninguna.
- **Commits:**
  - `ade20f2` `feat(M4) tests para disponibilidad de cancha y reservas`
  - `458b8a3` `refactor(M4): refactorizacion de modulo 4`
  - `723e74b` `docs(log): actualizacion de bitacora`

---

#### 17/11/2026

#### Marcos Caraballo | Rol: TL - Desarrollador Full Stack

- **Actividades:**
  - Depuración y eliminación de los diagramas obsoletos previos en `docs/diagramas/`.
  - Incorporación de los archivos fuente Mermaid (`.mmd`) de los diagramas obligatorios: C4 (Niveles 1, 2 y 3 para Accesos y Canchas), DER físico y UML de clases del dominio.
  - Generación e inclusión de las versiones vectoriales legibles (`.svg`) de los 6 diagramas en `docs/diagramas/`.
  - Normalización de `docs/bitacoras/LOG-Caraballo.md` agregando los hashes cortos reales de Git en cada commit listado.
- **Decisiones:**
  - Versionar tanto los fuentes `.mmd` como los `.svg` exportados para facilitar su lectura y mantenimiento, manteniendo el UML enfocado en entidades core y patrones para preservar legibilidad.
- **Dificultades:** Ninguna.
- **Commits:**
  - `d428a9d` `docs(diagramas): eliminar diagramas obsoletos`
  - `9f9f65a` `docs(diagramas): incluir archivos fuente en repo`
  - `ad42520` `docs(diagramas): Agregar archivos svg legibles`

---

#### 18/11/2026

#### Marcos Caraballo | Rol: TL - Desarrollador Full Stack

- **Actividades:**
  - Redacción e incorporación en conjunto (en la rama `docs/adr` junto a Angelina Vialle) de tres nuevos ADRs:
    - Estrategia de pruebas y umbral de cobertura.
    - Estrategia de dockerización y despliegue.
    - Control de concurrencia para reservas de canchas.
- **Decisiones:** Usar bloqueo pesimista en control de concurrencia.
- **Dificultades:** Ninguna.
- **Commits:**
  - `c6dacd9` `docs(adr):  formato y creacion`

---

#### 18/11/2026

#### Marcos Caraballo | Rol: TL - Desarrollador Full Stack

- **Actividades:**
  - Corrección de tests unitarios sensibles a zona horaria UTC en M3 (`lista-espera.service.spec.ts` y `reservas-clases.service.spec.ts`) usando `getUTCDay()`.
  - Ampliación de la suite de pruebas unitarias (black-box y tipado estricto) en M5 Pagos, M1 Usuarios/Membresías/Storage, M2 Accesos/QR, M3 Repositorios, M4 Canchas, Guards comunes y `SupabaseService`, elevando la cobertura global (`47/47` suites y `425/425` tests pasando, `0 todo`).
  - Validación en `PlanesService.remove` (`countMembresiasByPlan` en `MembresiasRepository`) para responder `404` si el plan no existe y `409 Conflict` si tiene membresías asociadas, reemplazando el `it.todo` pendiente en `planes.controller.integration.spec.ts` por su test de integración real.
- **Decisiones:** Priorizar cobertura genuina sobre reglas de negocio, seguridad y casos borde en lugar de excluir archivos de métricas o agregar tests triviales.
- **Dificultades:** Ninguna.
- **Commits:**
  - `019764c` `tests: incluir tests relevantes donde faltaba`
  - `b822152` `feat(M1): conflicto al eliminar plan con membresias asociadas`
  - `b712a96` `tests(M1): tests para control de eliminar plan con membresias`

---
