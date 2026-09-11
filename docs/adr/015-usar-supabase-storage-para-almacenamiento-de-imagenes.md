# ADR-015: Usar supabase Storage para el almacenamiento de imágenes

* **Estado:** Aceptado
* **Fecha:** 2026-09-06

## Contexto
FitZone requiere almacenar contenido multimedia, tales como las fotos de perfil de los usuarios. Guardar estos archivos directamente como datos binarios dentro de la base de datos PostgreSQL degrada severamente el rendimiento de las consultas y aumenta el tamaño de los backups. Por otro lado, almacenarlos en el sistema de archivos local del servidor backend imposibilita el escalado horizontal del servicio e introduce riesgos de pérdida de datos ante reinicios de instancias. 

## Decisión
Vamos a utilizar Supabase Storage para la persistencia de todas las imágenes de la plataforma. La API de NestJS recibirá los archivos subidos por los usuarios, los enviará al bucket correspondiente mediante el SDK de Supabase y persistirá en la base de datos únicamente la URL pública o el path de acceso al recurso. 

## Consecuencias
Positivas: optimización de la base de datos: se mantiene la base de datos PostgreSQL liviana, almacenando solo referencias en texto en lugar de datos binarios masivos; aprovechamiento del ecosistema: integración nativa con la infraestructura de Supabase sin necesidad de configurar proveedores de almacenamiento de terceros.

Negativas: acoplamiento al proveedor: quedamos vinculados a las cuotas de almacenamiento y ancho de banda de la infraestructura de Supabase.

## Alternativas consideradas
(a) Almacenamiento en el sistema de archivos local del servidor: Descartada porque impide el escalado horizontal del backend y se pierden los datos si el contenedor se destruye (b) Guardar archivos como BLOB en PostgreSQL: Descartada por el impacto negativo en el tamaño de las bases de datos y la lentitud al procesar respuestas HTTP.


