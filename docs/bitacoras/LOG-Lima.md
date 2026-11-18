#### 22/08/2026

#### Gonzalo Lima | Rol: Desarrollador Backend

- **Actividades**
  - Creación del repositorio en GitHub y del proyecto base en NestJS.
- **Decisiones** Separar backend y frontend en dos repositorios.
- **Dificultades** Ninguna
- **Commits:** `chore: Dependencias de NestJS y Prisma`

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

---

#### 24/09/2026

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

#### 27/09/2026

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

---

#### 29/10/2026

#### Gonzalo Lima | Rol: Desarrollador Backend

- **Actividades:**
  - Endpoint de verificación de membresía: inclusión de fecha_inicio en el DTO de respuesta y ajuste en la detección de mora considerando estado 'Vencida' o expiración de fecha fin.
  - Flujo de pagos: reutilización de intenciones de membresía suspendidas y pagos pendientes para evitar registros huérfanos al reintentar checkout, y exclusión de pagos pendientes abandonados en el historial del socio.
  - Depuración del inicio de pago: remoción del parámetro y persistencia de renovación automática en DTO, repositorio y servicio.
- **Decisiones:**
  - Reutilizar la intención de pago pendiente previa en lugar de crear registros duplicados si el usuario no completó la transacción anterior.
- **Dificultades:** Ninguna.
- **Commits:**
  - `fix(membresias): corregir deteccion de mora y devolver fecha_inicio en verificacion`
  - `fix(pagos): reutilizar intenciones suspendidas y omitir pagos pendientes huerfanos en historial`
  - `refactor(pagos): remover campo renovacion_automatica en flujo de inicio de pago`

---

#### 04/11/2026

#### Gonzalo Lima | Rol: Desarrollador Backend

- **Actividades:**
  - Acreditación de membresías y cambio de rol: actualización de `confirmarPagoTransaccional` en `PagosRepository` y `MembresiasRepository` para que, al acreditarse el pago y activarse la membresía, el usuario con rol `"externo"` pase a tener el rol `"socio"` de forma permanente.
  - Reconciliación de pagos pendientes: incorporación de búsqueda por `external_reference` en `MercadoPagoService` y sincronización automática en `PagosService` al consultar el detalle o historial de pagos.
- **Decisiones:**
  - Ejecutar la promoción de `"externo"` a `"socio"` dentro de la misma transacción (`$transaction`) que aprueba el pago y activa la membresía para garantizar consistencia atómica.
  - Reconciliar pagos pendientes consultando directamente a Mercado Pago por `external_reference` (`membresia-X`) para cubrir entornos locales donde no llega el webhook ni la redirección automática del checkout.
- **Dificultades:** Sandbox de Mercado Pago oculta el botón de retorno cuando las `back_urls` apuntan a `localhost`, lo que impedía recibir el `payment_id` por URL; se solucionó reconciliando los pagos pendientes mediante `payment.search` por referencia externa.
- **Commits:**
  - `feat: acreditar pagos de membresia y promover rol externo a socio`

---

#### 07/11/2026

#### Gonzalo Lima | Rol: Desarrollador Backend

- **Actividades:**
  - Seguridad en comprobantes y pagos: se protegió la consulta de comprobantes y la creación de pagos para que cada usuario solo pueda ver y abonar sus propias membresías o reservas.
  - Estandarización de estados de pago: se reemplazaron los identificadores fijos y repetidos en el código por un sistema centralizado que gestiona automáticamente los estados (Pendiente, Aprobado, Rechazado).
  - Suspensión de membresía: se agregó la posibilidad de que el socio suspenda su membresía activa. Mantiene todos sus beneficios (acceso al club, reserva de clases y descuentos en canchas) hasta el último día que ya pagó, y al terminar ese ciclo no se le genera ningún cobro pendiente.
- **Decisiones:**
  - Proteger las rutas de comprobantes exigiendo inicio de sesión para cuidar los datos personales del socio (nombre, DNI y montos abonados).
  - Conservar los beneficios del socio hasta el vencimiento del período ya abonado para que no pierda los días pagados.
- **Dificultades:** Ninguna.
- **Commits:**
  - `feat(pagos): proteger comprobantes con guard y reemplazar estados hardcodeados por estadosService`
  - `feat(membresias): permitir suspension de membresia activa`
  - `feat(reservas): habilitar beneficios en clases y canchas para membresías suspendidas vigentes`

---
