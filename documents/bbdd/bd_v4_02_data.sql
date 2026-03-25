-- ESTA VERSION:
--      -  NO HAY SUBCATEGORIAS
--      -  HAY PIEZAS COMUNES DE PRUEBA (pieza1, pieza2, pieza3)
--      -  HAY 4 MUEBLES CON DISTINTAS COMBINACIONES DE PASOS Y CANTIDAD DE PIEZA POR PASO
--      -  HAY 1 MUEBLE DE PRUEBA REAL USADO EN LA RAMA FEATURE/THREEJS
--      -  HAY 1 MUEBLES REAL DE ACTIU

-- Para subir un mueble, se necesita en este orden:
--      - User (su proveedor)
--      - Part (partes del mueble)
--      - Furniture (mueble en sí)
--      - Furniture_Part (asocia las piezas al mueble)
--      - Step (se definen los pasos y sus dependencias)
--      - Step_Part (asocia las piezas a sus pasos correspondientes)


-- ============================
-- VACIAR BASE DE DATOS
-- ============================
TRUNCATE TABLE Step_Tool, Step_Part, Review, Issue, Furniture_Part, Furniture, Category, Part, Tool, Step, Color, File, "User" CASCADE;

-- ============================
-- RESTART IDENTITY
-- ============================
ALTER SEQUENCE "User_id_seq" RESTART WITH 1;
ALTER SEQUENCE step_id_seq RESTART WITH 1;
ALTER SEQUENCE category_id_seq RESTART WITH 1;
ALTER SEQUENCE furniture_id_seq RESTART WITH 1;
ALTER SEQUENCE issue_id_seq RESTART WITH 1;
ALTER SEQUENCE part_id_seq RESTART WITH 1;
ALTER SEQUENCE review_id_seq RESTART WITH 1;
ALTER SEQUENCE tool_id_seq RESTART WITH 1;
ALTER SEQUENCE color_id_seq RESTART WITH 1;

-- ============================
-- USERS
-- ============================
-- Contraseñas hasheadas con bcrypt para 'password' (salt rounds = 10): 
-- $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO "User" (
    email,
    name,
    cif,
    company_name,
    telephone,
    tax_address,
    image_url,
    role,
    created_at,
    password,
    registration_status,
    visible
)
VALUES
-- ADMIN
(
    'admin@gmail.com',
    'Admin',
    'CIF8372',
    NULL,
    '123456780',
    '456 User St',
    '',
    'admin',
    NOW(),
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    NULL,
    false
),
-- PROVIDER: Proveedor
(
    'proveedor@gmail.com',
    NULL,
    'F2837018R',
    'Proveedor',
    '1223456734',
    'Calle Mayor 3',
    'https://muebleslospacos.es/wp-content/uploads/2024/03/mueble-salon-class-806-salcedo-1024x673.jpg',
    'provider',
    NOW(),
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'approved',
    true
),
-- PROVIDER: IqUa
(
    'iqua@gmail.com',
    NULL,
    'CIF004',
    'IqUA',
    '123456782',
    '101 Provider St',
    'https://muebleslospacos.es/wp-content/uploads/2024/03/mueble-salon-class-806-salcedo-1024x673.jpg',
    'provider',
    NOW(),
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'approved',
    true
),
-- PROVIDER: Muebles Baratos
(
    'mueblesbaratos@gmail.com',
    NULL,
    'CIF005',
    'Muebles Baratos',
    '123456783',
    '102 Provider St',
    'https://www.muebleslozano.es/wp-content/uploads/2023/07/titulo-escoger-muebles-lozano.jpg',
    'provider',
    NOW(),
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'approved',
    true
),
-- PROVIDER: Decora
(
    'decora@gmail.com',
    NULL,
    'CIF006',
    'Decora',
    '123456783',
    '104 Provider St',
    'https://content.gnoss.ws/carq/imagenes/Documentos/imgsem/4c/4ce8/4ce8d437-612f-43bb-8d8e-d169d1a187e5/2cf38bd4-7d1d-42eb-8982-226c4c4b2c87.jpg',
    'provider',
    NOW(),
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'approved',
    true
),
-- PROVIDER: Actiu 
(
    'correo@activo.com',
    null,
    'E3945678A', 
    'Activo', 
    '+34 833 273 456', 
    'Calle Castelló 11, 38220', 
    'https://img.freepik.com/vector-gratis/plantilla-logotipo-ateismo-diseno-plano_23-2149242249.jpg?semt=ais_hybrid&w=740&q=80', 
    'provider', 
    NOW(),
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'approved',
    true
);

-- ============================
-- CATEGORIES
-- ============================
INSERT INTO Category (name, subcategory_id) VALUES
('Sillas', NULL),
('Mesas', NULL),
('Sofás', NULL),
('Lámparas', NULL),
('Estanterías', NULL);

-- ============================
-- COLORS
-- ============================
INSERT INTO Color (name, hex) VALUES
('Beige', '#F5E6D3'),
('Verde', '#4CAF50'),
('Azul', '#2196F3'),
('Gris', '#9E9E9E'),
('Marrón', '#795548'),
('Negro', '#212121');

-- ============================
-- PARTS
-- ============================
INSERT INTO Part (file_uri, reference_number, color_id) VALUES
-- PARTES MUEBLE ACTIU VITAL RPO
('/storage/actiu/mesa_vital_pro/pata_0.8x0.05m.glb','pata_0.8x0.05m', 1),                 --1 pata
('/storage/actiu/mesa_vital_pro/travesanio_1.75x0.105m.glb','travesanio_1.75x0.105m', 1),   --2 travesaño
('/storage/actiu/mesa_vital_pro/tablero_1.8x0.8x0.025m.glb','tablero_1.8x0.8x0.025m', 1), --3 tablero
('/storage/tornillos/M8_cabeza_plana_20mm.glb','M8_cabeza_plana_20mm', 1),                 --4 M8 20mm
('/storage/tornillos/M8_cabeza_plana_17mm.glb','M8_cabeza_plana_17mm', 1),                 --5 M8 17mm
('/storage/tornillos/M8_cabeza_plana_16mm.glb','M8_cabeza_plana_16mm', 1),                 --6 M8 16mm
('/storage/tornillos/arandela_M8.glb','arandela_M8', 1),                                   --7 arandela

-- PARTES MUEBLE ACTIU ARMRIO MODULAR
('/storage/actiu/mueble_modular/tablon_inferior_0.76x0.38m.glb','tablon_inferior_0.76x0.38m', 1),   --pata01 y pata02 deberían de ser la misma pieza
('/storage/actiu/mueble_modular/tablon_izquierdo_1.09x0.4m.glb','tablon_izquierdo_1.09x0.4m', 1),
('/storage/actiu/mueble_modular/tablon_derecho_1.09x0.4m.glb','tablon_derecho_1.09x0.4m', 1),
('/storage/actiu/mueble_modular/tablon_trasero_0.76x1.09m.glb','tablon_trasero_0.76x1.09m', 1),
('/storage/actiu/mueble_modular/tablon_superior_0.8x0.4m.glb','tablon_superior_0.8x0.4m', 1),
('/storage/actiu/mueble_modular/balda_0.76x0.36m.glb','balda_0.76x0.36m', 1),
('/storage/actiu/mueble_modular/puerta_izquierda_0.4x0.7m.glb','puerta_izquierda_0.4x0.7m', 1),
('/storage/actiu/mueble_modular/puerta_derecha_0.4x0.7m.glb','puerta_derecha_0.4x0.7m', 1),
('/storage/tornillos/perno_40mm.glb','perno_40mm', 1)

;


-- ============================
-- TOOLS
-- ============================
INSERT INTO Tool (name,image_url) VALUES
('Destornillador','https://www.rztools.com/wp-content/uploads/160714-18-destornilladores-ph1.jpg'),
('Martillo','https://www.ferrokey.eu/media/catalog/product/cache/fd00e0b96a1c32b265511e0d53330673/1/3/13987.jpg'),
('Llave Allen','https://www.bt-ingenieros.com/15773/llaves-allen-con-punta-de-bola-9-piezas.jpg'),
('Taladro','https://www.sasmak.com/5774-large_default/taladro-percutor-compacto-m18-milwaukee-m18bpd-202c.jpg'),
('Alicates','https://mibricolaje.com/26480-large_default/alicate-universal-6-1000v-pamacon.jpg');

-- ============================
-- FURNITURE
-- ============================
INSERT INTO Furniture (
    file_uri,
    name,
    reference_number,
    category_id,
    provider_id,
    difficulty,
    color_id,
    short_description,
    image_url,
    qr_url, -- (no tiene sentido si es casi el "reference_number") ??
    assemblyPDF_uri,
    visible,
    created_at
)
VALUES
-- MUEBLE DE ACTIU VITAL PRO
(
    --'/storage/vital_pro_tornillos.glb', -- prueba
    '',
    'Mesa individual Vital Pro',
    'VR515F200',
    2,
    6,
    'low',
    3,
    'Vital Pro es la línea de mesas pensada para cubrir todo tipo de necesidades: mesas operativas, pasando por mesas con espacios de trabajo compartidos así como mesas de reuniones.', --de su web
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', --cambiar
    'https://skaply.ovh/home?furniture=VR515F200',
    'pdf1',
    true,
    NOW()
),
    -- MUEBLE DE ACTIU ARMARIO MODULAR
(
    '', -- prueba
    'Armario modular',
    'VR123456',
    5,
    6,
    'medium',
    3,
    'Nuestros armarios modulares son la opción ideal para llevar el orden a cualquier espacio adaptándolo al estilo, a las dimensiones o a la filosofía de trabajo. Un sistema personalizable para mantener organizado cualquier entorno laboral.', --de su web
    'https://actiucdn.net/cdn-cgi/image/width=960,height=999,fit=contain,format=auto,quality=95/uploads/images/modules/5531/img-6-2.jpg', --cambiar
    'https://skaply.ovh/home?furniture=123456',
    'pdf2',
    true,
    NOW()
);

-- ============================
-- STEPS
-- ============================
INSERT INTO Step (furniture_id, step_number, description, used_in_step_with_id, scene_camera_angle, scene_camera_rotation_axis) VALUES 
-- MUEBLE DE ACTIU VITAL PRO 
(1,1,'Ensamblar patas y travesaño',NULL, NULL, NULL),       
(1,2,'2 Tornillos M8 L= 20 mm',NULL, NULL, NULL),             
(1,3,'2 Tornillos M8 L= 17 mm',NULL, NULL, NULL),           
(1,4,'2 Tornillos M8 L= 17 mm',NULL, NULL, NULL),           
(1,5,'4 Arandelas de tornillos',NULL, NULL, NULL),          
(1,6,'4 Tornillos M8 L= 20 mm',NULL, NULL, NULL),           
(1,7,'Ensamblar tablero',NULL, NULL, NULL),                 
(1,8,'4 Tornillos M6 L= 16 mm',NULL, 120.00, 'x'),          
-- MUEBLE DE ACTIU ARMARIO MODULAR
(2,1,'Atornillar 6 pernos al panel lateral',NULL, NULL, NULL),     
(2,2,'Ensamblar el tablero inferior y las dos baldas',NULL, NULL, NULL),    
(2,3,'Atornillar 6 pernos al tablero y las baldas',NULL, NULL, NULL),   
(2,4,'Ensamblar el panel lateral',NULL, NULL, NULL),     
(2,5,'Ensamblar el tablero trasero',NULL, NULL, NULL),  
(2,6,'Atornillar 6 pernos en la parte superior de los tableros',NULL, NULL, NULL),     
(2,7,'Ensamblar el tablero superior',NULL, NULL, NULL),     
(2,8,'Añadir la puerta derecha',NULL, NULL, NULL),
(2,9,'Añadir la puerta izquierda',NULL, NULL, NULL)   
;    

-- ============================
-- FURNITURE_PART (asocia las partes con su mueble)
-- ============================
INSERT INTO Furniture_Part (furniture_id, part_id, step_id, exploded_axis, exploded_distance, assembled_pos_x, assembled_pos_y, assembled_pos_z, assembled_rot_x, assembled_rot_y, assembled_rot_z) VALUES

-- MUEBLE DE ACTIU VITAL PRO

  (1, 1, 1, NULL, 0, 0.870359, 0.422885, 0, 0, 3.141593, 0),
  (1, 1, 1, NULL, 0, -0.870359, 0.422885, 0, 0, 0, 0),
  (1, 2, 1, 'y', 0.30000001192092896, 0, 0.685, 0, 0, 0, 0),
  (1, 4, 2, 'y', 0.25, 0.858, 0.703, 0, 0, 0, 0),
  (1, 4, 2, 'y', 0.25, -0.858, 0.703, 0, 0, 0, 0),
  (1, 5, 3, 'x', 0.25, -0.8533, 0.678, 0.0334, 0, 0, -1.570796),
  (1, 5, 3, 'x', 0.25, -0.8533, 0.678, -0.0334, 0, 0, -1.570796),
  (1, 5, 4, 'x', -0.25, 0.8533, 0.678, 0.0334, 0, 0, 1.570796),
  (1, 5, 4, 'x', -0.25, 0.8533, 0.678, -0.0334, 0, 0, 1.570796),
  (1, 7, 5, 'y', 0.25, 0.8425, 0.7115, -0.25, 0, 0, 0),
  (1, 7, 5, 'y', 0.25, -0.8425, 0.7115, -0.25, 0, -3.141593, 0),
  (1, 7, 5, 'y', 0.25, -0.8425, 0.7115, 0.25, 0, -3.141593, 0),
  (1, 7, 5, 'y', 0.25, 0.8425, 0.7115, 0.25, 0, 0, 0),
  (1, 4, 6, 'y', 0.25, 0.8556, 0.70355, -0.25, 0, 0, 0),
  (1, 4, 6, 'y', 0.25, -0.8556, 0.70355, -0.25, 0, 0, 0),
  (1, 4, 6, 'y', 0.25, -0.8556, 0.70355, 0.25, 0, 0, 0),
  (1, 4, 6, 'y', 0.25, 0.8556, 0.70355, 0.25, 0, 0, 0),
  (1, 3, 7, 'y', 0.30000001192092896, 0, 0.7275, 0, 0, 0, 0),
  (1, 6, 8, 'y', -0.3499999940395355, 0.8385, 0.718, -0.25, 0, 0, 3.141593),
  (1, 6, 8, 'y', -0.3499999940395355, -0.8385, 0.718, -0.25, 0, 0, 3.141593),
  (1, 6, 8, 'y', -0.3499999940395355, -0.8385, 0.718, 0.25, 0, 0, 3.141593),
  (1, 6, 8, 'y', -0.3499999940395355, 0.8385, 0.718, 0.25, 0, 0, 3.141593),

-- MUEBLE DE ACTIU ARMARIO MODULAR

  (2, 16, 9, 'x', -0.25, 0.366957, 0.032736, -0.124559, 0, 0, 1.570796),
  (2, 16, 9, 'x', -0.25, 0.366957, 0.032736, 0.141442, 0, 0, 1.570796),
  (2, 16, 9, 'x', -0.25, 0.366957, 0.394736, -0.124559, 0, 0, 1.570796),
  (2, 16, 9, 'x', -0.25, 0.366957, 0.394736, 0.141442, 0, 0, 1.570796),
  (2, 16, 9, 'x', -0.25, 0.366957, 0.755236, 0.141442, 0, 0, 1.570796),
  (2, 16, 9, 'x', -0.25, 0.366957, 0.755236, -0.124559, 0, 0, 1.570796),
  (2, 10, 9, NULL, 0, 0.388602, 0.565288, 0.008967, 0, 0, 0),
  (2, 13, 10, 'x', -0.3499999940395355, 0.001714, 0.394736, 0.004157, 0, 0, 0),
  (2, 8, 10, 'x', -0.3499999940395355, 0.000421, 0.013171, 0.017713, 0, 0, 0),
  (2, 13, 10, 'x', -0.3499999940395355, 0.001714, 0.755236, 0.004157, 0, 0, 0),
  (2, 16, 11, 'x', -0.25, -0.36692, 0.755236, -0.124559, 0, 0, -1.570796),
  (2, 16, 11, 'x', -0.25, -0.36692, 0.394767, -0.124559, 0, 0, -1.570796),
  (2, 16, 11, 'x', -0.25, -0.36692, 0.032767, -0.124559, 0, 0, -1.570796),
  (2, 16, 11, 'x', -0.25, -0.36692, 0.032767, 0.141471, 0, 0, -1.570796),
  (2, 16, 11, 'x', -0.25, -0.36692, 0.394767, 0.141471, 0, 0, -1.570796),
  (2, 16, 11, 'x', -0.25, -0.36692, 0.755267, 0.141471, 0, 0, -1.570796),
  (2, 9, 12, 'x', -0.3499999940395355, -0.388602, 0.565288, 0.008967, 0, 0, 0),
  (2, 11, 13, 'z', -0.3499999940395355, 0.002391, 0.571203, -0.183135, 0, 0, 0),
  (2, 16, 14, 'y', 0.25, -0.297609, 1.096975, -0.183135, 0, 0, 3.141592),
  (2, 16, 14, 'y', 0.25, 0.388257, 1.096975, 0.141442, 0, 0, 3.141593),
  (2, 16, 14, 'y', 0.25, -0.388257, 1.096975, 0.142105, 0, 0, 3.141592),
  (2, 16, 14, 'y', 0.25, -0.388257, 1.096975, -0.123895, 0, 0, 3.141593),
  (2, 16, 14, 'y', 0.25, 0.388158, 1.096975, -0.123895, 0, 0, 3.141593),
  (2, 16, 14, 'y', 0.25, 0.302391, 1.096975, -0.183135, 0, 0, 3.141592),
  (2, 12, 15, 'y', 0.3499999940395355, 0, 1.122959, 0.017566, 0, 0, 0),
  (2, 14, 16, 'z', 0.3499999940395355, -0.19816, 0.391562, 0.216814, 0, 0, 0),
  (2, 15, 17, 'z', 0.3499999940395355, 0.197691, 0.392026, 0.216871, 0, 0, 0);
          
-- ============================
-- STEP_TOOL (asocia herramientas a los pasos)
-- ============================
INSERT INTO Step_Tool (stepId, tool_id) VALUES
(1, 3),  -- paso 1 Vital Pro: Llave Allen
(2, 3),  -- paso 2: Llave Allen
(3, 3),  -- paso 3: Llave Allen
(4, 3),  -- paso 4: Llave Allen
(5, 3),  -- paso 5: Llave Allen
(6, 3),  -- paso 6: Llave Allen
(7, 3),  -- paso 7: Llave Allen
(8, 3);  -- paso 8: Llave Allen

-- ============================
-- ISSUES
-- ============================
INSERT INTO Issue (description, user_email, furniture_id) VALUES
('Problema con el ensamblaje','user1@example.com',1),
('Problema con la pieza','user1@example.com',1),
('Falta de piezas','user2@example.com',1),
('Defecto de color','user1@example.com',2),
('Rasguño en superficie','user2@example.com',2);

-- ============================
-- FILES
-- ============================
INSERT INTO File (uri, name, format, size, issue_id) VALUES
('file1.png','Foto problema 1','png',1.5,1),
('file1b.png','Foto problema 1b','png',1.5,1),
('file2.jpg','Foto problema 2','jpg',2.3,2),
('file3.png','Foto problema 3','png',1.2,3),
('file4.jpg','Foto problema 4','jpg',2.0,4);

-- ============================
-- REVIEWS
-- ============================
INSERT INTO Review (stars, text, furniture_id) VALUES
(5,'Excelente producto',1),
(5,'Excelente',1),
(4,'Muy bueno',1),
(3,'Aceptable',2),
(2,'No muy satisfecho',2);

