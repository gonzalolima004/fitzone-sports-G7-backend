/**
 * ARCHIVO: usuario.entity.ts
 * PROPÓSITO: Representa la Entidad de Dominio o el Modelo de Base de Datos.
 * Aquí se definen las columnas y relaciones de la tabla "Usuarios".
 */

// EJEMPLO: Esta clase representa cómo se ve un Usuario guardado en nuestro sistema.
// Si estuviéramos usando TypeORM o Prisma, aquí irían los decoradores como @Entity() o @Column()
export class Usuario {
  id: number;
  nombre: string;
  email: string;
  // Nota: normalmente la contraseña real no se devuelve al cliente, 
  // pero la ponemos aquí para representar la tabla completa.
  password: string; 
  fechaCreacion: Date;
}
