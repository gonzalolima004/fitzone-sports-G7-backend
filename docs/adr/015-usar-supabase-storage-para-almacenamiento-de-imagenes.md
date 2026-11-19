# ADR-015: Usar Supabase Storage para el almacenamiento de imágenes

- **Estado:** Aceptado
- **Fecha:** 2026-09-06
- **Autor:** Marcos Ramón y Angelina María Vialle
- **Sprint:** 1

## Contexto
FitZone requiere almacenar contenido multimedia, tales como las fotos de perfil de los usuarios. Guardar estos archivos directamente como datos binarios dentro de la base de datos PostgreSQL degrada severamente el rendimiento de las consultas y aumenta el tamaño de los backups. Por otro lado, almacenarlos en el sistema de archivos local del servidor backend imposibilita el escalado horizontal del servicio e introduce riesgos de pérdida de datos ante reinicios de instancias. 

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Almacenamiento en el sistema de archivos local del contenedor** | Cero dependencias externas y máxima simplicidad de configuración inicial. | Impide el escalado horizontal y provoca la pérdida irreversible de archivos si el contenedor Docker es recreado. | Descartado por vulnerar las buenas prácticas de despliegue en contenedores efímeros. |
| **Servicio de almacenamiento dedicado de terceros (ej. AWS S3)** | Solución estándar corporativa altamente robusta y flexible. | Requiere configurar credenciales, políticas IAM y contratos de facturación independientes ajenos al stack principal. | Se prefirió aprovechar los servicios integrados nativos de la plataforma ya elegida. |
| **Supabase Storage (Buckets administrados)** | Almacenamiento en la nube integrado con el ecosistema de Supabase, con SDKs nativos y control por políticas. | Genera dependencia del almacenamiento y transferencia del proveedor. | **Seleccionada** por su perfecta integración nativa y por mantener la base de datos ligera guardando únicamente las rutas o URLs. |

## Decisión
Vamos a utilizar Supabase Storage para la persistencia de todas las imágenes de la plataforma. La API de NestJS recibirá los archivos subidos por los usuarios, los enviará al bucket correspondiente mediante el SDK de Supabase y persistirá en la base de datos únicamente la URL pública o el path de acceso al recurso. 

## Consecuencias
**Positivas:** Mantiene la base de datos PostgreSQL ligera almacenando solo referencias en texto y aprovecha la infraestructura nativa sin configurar proveedores externos adicionales.
**Negativas:** Vincula la gestión multimedia a las políticas de cuotas y ancho de banda de Supabase.
**Deuda asumida:** Validar estrictamente en el backend los tipos MIME y tamaños máximos permitidos antes de enviar los archivos al bucket.

## Requisitos relacionados
Unidad II, Unidad IV


