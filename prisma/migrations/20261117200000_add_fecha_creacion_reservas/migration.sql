-- AlterTable: las reservas existentes quedan con NULL (no se conoce su fecha real de creación)
ALTER TABLE "cancha_reserva" ADD COLUMN "fecha_creacion" TIMESTAMP(3);
ALTER TABLE "cancha_reserva" ALTER COLUMN "fecha_creacion" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "clase_reserva" ADD COLUMN "fecha_creacion" TIMESTAMP(3);
ALTER TABLE "clase_reserva" ALTER COLUMN "fecha_creacion" SET DEFAULT CURRENT_TIMESTAMP;
