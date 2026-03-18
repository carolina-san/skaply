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
-- ADMIN: Maria
(
    'maria@gmail.com',
    'Maria',
    NULL,
    NULL,
    '123456789',
    '123 User St',
    '',
    'admin',
    NOW(),
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    NULL,
    false
),
-- ADMIN: Lucia
(
    'lucia@gmail.com',
    'Lucia',
    NULL,
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
-- ADMIN: Carlos
(
    'carlos@gmail.com',
    'Carlos',
    NULL,
    NULL,
    '123456781',
    '789 User St',
    '',
    'admin',
    NOW(),
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    NULL,
    false
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
    'A03137874', 
    'Activo', 
    '+34966560700', 
    'Avenida la libertad, 19, 03610, petrer (Alicante)', 
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
('/storage/actiu_pata_0.8x0.05m.glb','actiu_pata_0.8x0.05m', 1),                 --1 pata
('/storage/actiu_travesaño_1.75x0.105m.glb','actiu_travesaño_1.75x0.105m', 1),   --2 travesaño
('/storage/actiu_tablero_1.8x0.8x0.025m.glb','actiu_tablero_1.8x0.8x0.025m', 1), --3 tablero
('/storage/M8_cabeza_plana_20mm.glb','M8_cabeza_plana_20mm', 1),                 --4 M8 20mm
('/storage/M8_cabeza_plana_17mm.glb','M8_cabeza_plana_17mm', 1),                 --5 M8 17mm
('/storage/M8_cabeza_plana_16mm.glb','M8_cabeza_plana_16mm', 1),                 --6 M8 16mm
('/storage/arandela_M8.glb','arandela_M8', 1),                                   --7 arandela

-- PARTES MUEBLE ACTIU ARMRIO MODULAR
('','patas', 1),   --pata01 y pata02 deberían de ser la misma pieza
('','tablon_inferior', 1),   --pata01 y pata02 deberían de ser la misma pieza
('','tablon_izquierdo', 1),
('','tablon_derecho', 1),
('','tablon_trasero', 1),
('','tablon_superior', 1),
('','estante_1', 1),
('','estante_2', 1),
('','puerta_izquierda', 1),
('','puerta_derecha', 1)
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
    7,
    'low',
    3,
    'Vital Pro es la línea de mesas pensada para cubrir todo tipo de necesidades: mesas operativas, pasando por mesas con espacios de trabajo compartidos así como mesas de reuniones.', --de su web
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', --cambiar
    'https://skaply.ovh/catalogo?furniture=VR515F200',
    'pdf1',
    true,
    NOW()
),
    -- MUEBLE DE ACTIU ARMARIO MODULAR
(
    '/storage/armario_modular.glb', -- prueba
    'Armario modular',
    'VR123456',
    5,
    7,
    'medium',
    3,
    'Nuestros armarios modulares son la opción ideal para llevar el orden a cualquier espacio adaptándolo al estilo, a las dimensiones o a la filosofía de trabajo. Un sistema personalizable para mantener organizado cualquier entorno laboral.', --de su web
    'https://actiucdn.net/cdn-cgi/image/width=960,height=999,fit=contain,format=auto,quality=95/uploads/images/modules/5531/img-6-2.jpg', --cambiar
    'https://skaply.ovh/catalogo?furniture=123456',
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
(2,1,'Ensamblar tablon inferior y patas',NULL, NULL, NULL),     -- tablon inferior y patas
(2,2,'Ensamblar laterales',NULL, NULL, NULL),     -- (tablon inferior y patas) + laterales
(2,3,'Ensamblar tablon trasero',NULL, NULL, NULL),   -- (tablon inferior y patas + laterales) + tablon trasero
(2,4,'Ensamblar tablon superior',NULL, NULL, NULL),     -- (tablon inferior y patas + laterales + tablon trasero) + tablon superior
(2,5,'Ensamblar estantes',NULL, NULL, NULL),     -- (tablon inferior y patas + laterales + tablon trasero + tablon superior) + estantes
(2,6,'Ensamblar puerta izquierda',NULL, NULL, NULL),     -- (tablon inferior y patas + laterales + tablon trasero + tablon superior + estantes) + puerta izquierda
(2,7,'Ensamblar puerta derecha',NULL, NULL, NULL)    -- (tablon inferior y patas + laterales + tablon trasero + tablon superior + estantes + puerta izquierda) + puerta derecha
;    

-- ============================
-- FURNITURE_PART (asocia las partes con su mueble)
-- ============================
INSERT INTO Furniture_Part (furniture_id, part_id, step_id, exploded_axis, exploded_distance, assembled_pos_x, assembled_pos_y, assembled_pos_z) VALUES
-- MUEBLE DE ACTIU VITAL PRO
(1, 1,1,'y', 0.00, 0.8714, 0.0335 ,  0.0),       --pata
(1, 1,1,'y', 0.00,-0.8714, 0.0335 ,  0.0),       --pata
(1, 2,1,'y', 0.30, 0.00,   0.692009, 0.0),       --travesaño

(1, 4,2,'y', 0.25, 0.86, 0.69905, 0.000643),    --M8 20mm
(1, 4,2,'y', 0.25,-0.86, 0.69905, 0.000643),    --M8 20mm

(1, 5,3,'x', 0.25, -0.856, 0.675, 0.04),      --M8 17mm
(1, 5,3,'x', 0.25, -0.856, 0.675,-0.04),      --M8 17mm
(1, 5,4,'x',-0.25,  0.856, 0.675, 0.04),      --M8 17mm
(1, 5,4,'x',-0.25,  0.856, 0.675, -0.04),      --M8 17mm

(1, 7,5,'y', 0.25, -0.838712  , 0.712865 , -0.258286 ),       --arandela
(1, 7,5,'y', 0.25,  0.838712  , 0.712865 , -0.258286 ),       --arandela
(1, 7,5,'y', 0.25,  0.838712  , 0.712865 ,  0.258286 ),       --arandela
(1, 7,5,'y', 0.25, -0.838712  , 0.712865 ,  0.258286 ),       --arandela

(1, 4,6,'y', 0.25, 0.859, 0.7003, 0.26),  --M8 20mm
(1, 4,6,'y', 0.25, 0.859, 0.7003,-0.26),  --M8 20mm
(1, 4,6,'y', 0.25,-0.859, 0.7003, 0.26),  --M8 20mm
(1, 4,6,'y', 0.25,-0.859, 0.7003,-0.26),  --M8 20mm

(1, 3,7,'y', 0.30, 0.00, 0.7275, 0.0),   --tablero

(1, 6,8,'y',-0.35, 0.8324, 0.71645, 0.26), --M8 16mm
(1, 6,8,'y',-0.35, 0.8324, 0.71645,-0.26), --M8 16mm
(1, 6,8,'y',-0.35,-0.8324, 0.71645, 0.26), --M8 16mm
(1, 6,8,'y',-0.35,-0.8324, 0.71645,-0.26); --M8 16mm

-- MUEBLE DE ACTIU ARMARIO MODULAR
-- (2,1,1,'y',0.0, 0.0, 0.0, 0.0),    --patas
-- (2,1,1,'y',0.3, 0.0, 0.0, 0.0),    --tablon
-- (2,1,1,'y',0.5, 0.0, 0.0, 0.0),    --travesaño
-- (2,1,1,'y',0.5, 0.0, 0.0, 0.0),
-- (2,1,1,'z',-0.4, 0.0, 0.0, 0.0),
-- (2,1,1,'y',0.5, 0.0, 0.0, 0.0),
-- (2,1,1,'z',0.4, 0.0, 0.0, 0.0),
-- (2,1,1,'z',0.4, 0.0, 0.0, 0.0),
-- (2,1,1,'z',0.4, 0.0, 0.0, 0.0),              
-- (2,1,1,'z',0.4, 0.0, 0.0, 0.0);   --tablero     

-- ============================
-- SETP_PART (asocia las piezas a los pasos)
-- ============================
-- ⚠️DEJA DE USARSE
-- INSERT INTO Step_Part (stepId, part_id, quantity) VALUES
-- -- MUEBLE ACTIU VITAL PRO
-- (10,7,2),(10,8,1),                          --paso 1 patas + travesaño
-- (11,10,2),                                  --paso 2 (M8 18mm x2)
-- (12,11,2),                                  --paso 3 (M8 17mm x2)
-- (13,11,2),                                  --paso 4 (M8 17mm x2)
-- (14,13,4),                                  --paso 5 (arandelas x4)
-- (15,10,4),                                  --paso 6 (M8 20mm x4)
-- (16,9,1),                                   --paso 7 (tablero)
-- (17,12,4),                                  --paso 8 (M8 16mm x4)

-- -- MUEBLE ACTIU ARMARIO MODULAR
-- (18,26,1),(18,27,1),   -- paso 1
-- (19,28,1),(19,29,1),   -- paso 2
-- (20,30,1),             -- paso 3
-- (21,31,1),             -- paso 4
-- (22,32,1),(22,33,1),   -- paso 5
-- (23,34,1),             -- paso 6
-- (24,35,1)              -- paso 7
-- ;            
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

