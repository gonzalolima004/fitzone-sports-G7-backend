-- Primero creamos la ciudad y la sede para cumplir con las claves foráneas
INSERT INTO "ciudad" ("id_ciudad", "nombre", "activo") 
VALUES (1, 'Buenos Aires', true) 
ON CONFLICT ("id_ciudad") DO NOTHING;

INSERT INTO "sede" ("id_sede", "nombre", "direccion", "aforo_maximo", "activo", "id_ciudad") 
VALUES (1, 'Sede Central', 'Av. Siempre Viva 123', 500, true, 1)
ON CONFLICT ("id_sede") DO NOTHING;

-- Estado de usuario y Usuario ID 1
INSERT INTO "usuario_estado" ("id_usuario_estado", "descripcion") 
VALUES (1, 'Activo')
ON CONFLICT ("id_usuario_estado") DO NOTHING;

INSERT INTO "usuario" ("id_usuario", "dni", "email", "password", "nombre", "apellido", "telefono", "modificado", "creacion", "id_sede", "id_usuario_estado") 
VALUES (1, '12345678', 'joaquin@fitzone.com', '123456', 'Joaquin', 'Ribarola', '123456789', NOW(), NOW(), 1, 1)
ON CONFLICT ("id_usuario") DO NOTHING;

-- Estados de la reserva para poder crear y cancelar (Confimada = 1, Cancelada = 2)
INSERT INTO "clase_reserva_estado" ("id_clase_reserva_estado", "descripcion") 
VALUES (1, 'Confirmada'), (2, 'Cancelada')
ON CONFLICT ("id_clase_reserva_estado") DO NOTHING;
