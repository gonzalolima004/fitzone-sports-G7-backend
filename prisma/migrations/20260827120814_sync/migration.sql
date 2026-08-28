-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contrasenia" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT,
    "foto" TEXT NOT NULL,
    "usuario_estado" INTEGER NOT NULL,
    "sede_id" TEXT NOT NULL,
    "creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_estados" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "usuarios_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socios" (
    "id" TEXT NOT NULL,
    "qr_secret" TEXT NOT NULL,
    "socio_estado_id" INTEGER NOT NULL,

    CONSTRAINT "socios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socios_estados" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "socios_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" TEXT NOT NULL,
    "empleado_estado_id" INTEGER NOT NULL,
    "empleado_rol_id" INTEGER NOT NULL,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados_roles" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "empleados_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados_estados" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "empleados_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membresias" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "membresias_planes_id" INTEGER NOT NULL,
    "membresias_estado_id" INTEGER NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "token_pasarela" TEXT,
    "renovacion_automatica" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "membresias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membresias_planes" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "membresias_planes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membresias_estados" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "membresias_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sedes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "aforo_maximo" INTEGER NOT NULL,
    "ciudad_id" INTEGER NOT NULL,
    "sede_estado_id" INTEGER NOT NULL,

    CONSTRAINT "sedes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sedes_estados" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "sedes_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciudades" (
    "id" SERIAL NOT NULL,
    "ciudad_estado_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "ciudades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciudades_estados" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "ciudades_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_accesos" (
    "id" TEXT NOT NULL,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_egreso" TIMESTAMP(3),
    "usuario_id" TEXT NOT NULL,
    "sede_id" TEXT NOT NULL,

    CONSTRAINT "registros_accesos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clases_grupales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "clase_grupal_estado_id" INTEGER NOT NULL,

    CONSTRAINT "clases_grupales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clases_grupales_estados" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "clases_grupales_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clases_agendadas" (
    "id" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "capacidad_maxima" INTEGER NOT NULL,
    "clase_grupal_id" TEXT NOT NULL,
    "sede_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "clase_agendada_estado_id" INTEGER NOT NULL,

    CONSTRAINT "clases_agendadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clases_agendadas_estados" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "clases_agendadas_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas_clases" (
    "id" TEXT NOT NULL,
    "fecha_reserva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" TEXT NOT NULL,
    "clase_agendada_id" TEXT NOT NULL,
    "reserva_clase_estado_id" INTEGER NOT NULL,

    CONSTRAINT "reservas_clases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas_clases_estados" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "reservas_clases_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socios_espera" (
    "id" TEXT NOT NULL,
    "clase_agendada_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "posicion" INTEGER NOT NULL,
    "fecha_en_espera" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "socios_espera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canchas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "costo_base" DECIMAL(10,2) NOT NULL,
    "sede_id" TEXT NOT NULL,
    "cancha_estado_id" INTEGER NOT NULL,
    "cancha_tipo_id" INTEGER NOT NULL,

    CONSTRAINT "canchas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canchas_estados" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "canchas_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canchas_tipos" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "canchas_tipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas_canchas" (
    "id" TEXT NOT NULL,
    "cancha_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "reserva_cancha_estado_id" INTEGER NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "descuento_aplicado_porcentaje" DECIMAL(5,2) NOT NULL,
    "es_horario_pico" BOOLEAN NOT NULL,
    "precio_congelado" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "reservas_canchas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas_canchas_estados" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "reservas_canchas_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_membresias" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "membresia_id" TEXT NOT NULL,
    "pago_estado_id" INTEGER NOT NULL,
    "url_comprobante" TEXT,
    "fecha_pago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token_transaccion" TEXT,

    CONSTRAINT "pagos_membresias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_canchas" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "reserva_cancha_id" TEXT NOT NULL,
    "pago_estado_id" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha_pago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token_transaccion" TEXT,
    "url_comprobante" TEXT,

    CONSTRAINT "pagos_canchas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_estados" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "pagos_estados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_dni_key" ON "usuarios"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "socios_qr_secret_key" ON "socios"("qr_secret");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_membresias_token_transaccion_key" ON "pagos_membresias"("token_transaccion");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_canchas_token_transaccion_key" ON "pagos_canchas"("token_transaccion");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_usuario_estado_fkey" FOREIGN KEY ("usuario_estado") REFERENCES "usuarios_estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "socios" ADD CONSTRAINT "socios_id_fkey" FOREIGN KEY ("id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "socios" ADD CONSTRAINT "socios_socio_estado_id_fkey" FOREIGN KEY ("socio_estado_id") REFERENCES "socios_estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_empleado_estado_id_fkey" FOREIGN KEY ("empleado_estado_id") REFERENCES "empleados_estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_empleado_rol_id_fkey" FOREIGN KEY ("empleado_rol_id") REFERENCES "empleados_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_id_fkey" FOREIGN KEY ("id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membresias" ADD CONSTRAINT "membresias_membresias_estado_id_fkey" FOREIGN KEY ("membresias_estado_id") REFERENCES "membresias_estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membresias" ADD CONSTRAINT "membresias_membresias_planes_id_fkey" FOREIGN KEY ("membresias_planes_id") REFERENCES "membresias_planes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membresias" ADD CONSTRAINT "membresias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "socios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sedes" ADD CONSTRAINT "sedes_ciudad_id_fkey" FOREIGN KEY ("ciudad_id") REFERENCES "ciudades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sedes" ADD CONSTRAINT "sedes_sede_estado_id_fkey" FOREIGN KEY ("sede_estado_id") REFERENCES "sedes_estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ciudades" ADD CONSTRAINT "ciudades_ciudad_estado_id_fkey" FOREIGN KEY ("ciudad_estado_id") REFERENCES "ciudades_estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_accesos" ADD CONSTRAINT "registros_accesos_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_accesos" ADD CONSTRAINT "registros_accesos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "socios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clases_grupales" ADD CONSTRAINT "clases_grupales_clase_grupal_estado_id_fkey" FOREIGN KEY ("clase_grupal_estado_id") REFERENCES "clases_grupales_estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clases_agendadas" ADD CONSTRAINT "clases_agendadas_clase_agendada_estado_id_fkey" FOREIGN KEY ("clase_agendada_estado_id") REFERENCES "clases_agendadas_estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clases_agendadas" ADD CONSTRAINT "clases_agendadas_clase_grupal_id_fkey" FOREIGN KEY ("clase_grupal_id") REFERENCES "clases_grupales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clases_agendadas" ADD CONSTRAINT "clases_agendadas_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clases_agendadas" ADD CONSTRAINT "clases_agendadas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_clases" ADD CONSTRAINT "reservas_clases_clase_agendada_id_fkey" FOREIGN KEY ("clase_agendada_id") REFERENCES "clases_agendadas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_clases" ADD CONSTRAINT "reservas_clases_reserva_clase_estado_id_fkey" FOREIGN KEY ("reserva_clase_estado_id") REFERENCES "reservas_clases_estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_clases" ADD CONSTRAINT "reservas_clases_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "socios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "socios_espera" ADD CONSTRAINT "socios_espera_clase_agendada_id_fkey" FOREIGN KEY ("clase_agendada_id") REFERENCES "clases_agendadas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "socios_espera" ADD CONSTRAINT "socios_espera_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "socios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canchas" ADD CONSTRAINT "canchas_cancha_estado_id_fkey" FOREIGN KEY ("cancha_estado_id") REFERENCES "canchas_estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canchas" ADD CONSTRAINT "canchas_cancha_tipo_id_fkey" FOREIGN KEY ("cancha_tipo_id") REFERENCES "canchas_tipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canchas" ADD CONSTRAINT "canchas_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_canchas" ADD CONSTRAINT "reservas_canchas_cancha_id_fkey" FOREIGN KEY ("cancha_id") REFERENCES "canchas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_canchas" ADD CONSTRAINT "reservas_canchas_reserva_cancha_estado_id_fkey" FOREIGN KEY ("reserva_cancha_estado_id") REFERENCES "reservas_canchas_estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_canchas" ADD CONSTRAINT "reservas_canchas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "socios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_membresias" ADD CONSTRAINT "pagos_membresias_membresia_id_fkey" FOREIGN KEY ("membresia_id") REFERENCES "membresias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_membresias" ADD CONSTRAINT "pagos_membresias_pago_estado_id_fkey" FOREIGN KEY ("pago_estado_id") REFERENCES "pagos_estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_membresias" ADD CONSTRAINT "pagos_membresias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "socios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_canchas" ADD CONSTRAINT "pagos_canchas_pago_estado_id_fkey" FOREIGN KEY ("pago_estado_id") REFERENCES "pagos_estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_canchas" ADD CONSTRAINT "pagos_canchas_reserva_cancha_id_fkey" FOREIGN KEY ("reserva_cancha_id") REFERENCES "reservas_canchas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_canchas" ADD CONSTRAINT "pagos_canchas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "socios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
