# ADR-008: Utilización de Supabase Auth para la autenticación

- **Estado:** Aceptado
- **Fecha:** 2026-09-01
- **Autor:** Marcos Ramón Caraballo y Angelina María Vialle
- **Sprint:** 1

## Contexto
FitZone posee diferentes tipos de usuarios y roles, incluyendo socios, clientes externos, instructores, recepcionistas y gerentes centrales. El sistema necesita identificar a los usuarios que realizan solicitudes y proteger las funcionalidades según sus permisos. La implementación propia de autenticación implicaría gestionar credenciales, contraseñas, sesiones, tokens, recuperación de cuentas y aspectos relacionados con la seguridad.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Implementación propia con JWT desde cero** | Control absoluto sobre el algoritmo, las tablas de usuarios y la emisión de tokens. | Requiere desarrollar y mantener flujos complejos de seguridad, hashing, recuperación de contraseñas y control de sesiones. | Descartado para evitar invertir tiempo de desarrollo en una funcionalidad estándar y propensa a fallos de seguridad. |
| **Proveedores de identidad alternativos (ej. Auth0 o Better Auth)** | Servicios especializados robustos enfocados exclusivamente en gestión de identidad. | Añade una capa de integración adicional ajena al ecosistema de base de datos ya seleccionado. | Se prefirió mantener una arquitectura unificada dentro de la misma plataforma Supabase. |
| **Supabase Auth** | Resuelve de manera nativa el registro, inicio de sesión y gestión de tokens integrada con PostgreSQL. | Vincula la autenticación directamente a la disponibilidad del servicio de Supabase. | **Seleccionada** por su integración directa con el ecosistema elegido y su seguridad robusta fuera de la caja. |

## Decisión
Decidimos utilizar Supabase Auth para gestionar la autenticación de los usuarios de FitZone. La autenticación será delegada al servicio de Supabase Auth, mientras que el backend NestJS validará la identidad autenticada y aplicará las reglas de autorización correspondientes a los diferentes roles y recursos del sistema. Los datos propios del dominio, como membresías, sedes y roles específicos de FitZone, continuarán siendo responsabilidad del backend y de la base de datos de la aplicación.

## Consecuencias
- **Positivas:** Evita programar desde cero el manejo crítico de credenciales, reduciendo el código de seguridad boilerplate y el riesgo de vulnerabilidades.
- **Negativas:** Genera acoplamiento con el servicio de identidad de Supabase.
- **Deuda asumida:** Configurar correctamente los mapeos de UUIDs entre Supabase Auth y las tablas de dominio del negocio en la base de datos.


