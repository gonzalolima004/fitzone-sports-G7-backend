# ADR-008: Utilizar Supabase Auth para la autenticación

* **Estado:** Aceptado
* **Fecha:** 2026-09-01

## Contexto
FitZone posee diferentes tipos de usuarios y roles, incluyendo socios, clientes externos, instructores, recepcionistas y gerentes centrales. El sistema necesita identificar a los usuarios que realizan solicitudes y proteger las funcionalidades según sus permisos. La implementación propia de autenticación implicaría gestionar credenciales, contraseñas, sesiones, tokens, recuperación de cuentas y aspectos relacionados con la seguridad.

## Decisión
Decidimos utilizar Supabase Auth para gestionar la autenticación de los usuarios de FitZone. La autenticación será delegada al servicio de Supabase Auth, mientras que el backend NestJS validará la identidad autenticada y aplicará las reglas de autorización correspondientes a los diferentes roles y recursos del sistema. Los datos propios del dominio, como membresías, sedes y roles específicos de FitZone, continuarán siendo responsabilidad del backend y de la base de datos de la aplicación.

## Consecuencias
Positivas: evita implementar desde cero el manejo de credenciales y sesiones; reduce la cantidad de código de seguridad que debe desarrollar el equipo; facilita implementar registro e inicio de sesión; reduce el riesgo de errores en una funcionalidad sensible; se integra con el ecosistema Supabase seleccionado.

Negativas: genera dependencia respecto de Supabase Auth; la autenticación queda condicionada por la disponibilidad del servicio; migrar a otro proveedor posteriormente no resultaría sencillo.

## Alternativas consideradas
(a) Implementar autenticación propia con JWT: descartada porque requeriría desarrollar y mantener el manejo de credenciales, tokens, recuperación de cuentas y otros mecanismos de seguridad. (b) Utilizar otro proveedor de identidad como Better Auth o Auth0: descartado para mantener una integración más simple con la plataforma Supabase elegida.

