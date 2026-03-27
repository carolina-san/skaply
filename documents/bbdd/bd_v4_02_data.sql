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
('Negro', '#212121'),
('Blanco', '#ffffff')
;


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
('/storage/tornillos/perno_40mm.glb','perno_40mm', 1),

-- Silla rustica
('/storage/iqua/silla_rustica/Brazo1.glb','Brazo1', 1),
('/storage/iqua/silla_rustica/Brazo2.glb','Brazo2', 1),
('/storage/iqua/silla_rustica/Pata1.glb','Pata1', 1),
('/storage/iqua/silla_rustica/Pata2.glb','Pata2', 1),
('/storage/iqua/silla_rustica/Refuerzo1.glb','Refuerzo1', 1),
('/storage/iqua/silla_rustica/Refuerzo2.glb','Refuerzo2', 1),
('/storage/iqua/silla_rustica/Sillon.glb','Sillon', 1),
('/storage/iqua/silla_rustica/Taco1.glb','Taco1', 1),
('/storage/iqua/silla_rustica/Taco2.glb','Taco2', 1),
('/storage/iqua/silla_rustica/Respaldo.glb','Respaldo', 1)


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
    1,
    'Vital Pro es la línea de mesas pensada para cubrir todo tipo de necesidades: mesas operativas, pasando por mesas con espacios de trabajo compartidos así como mesas de reuniones.', --de su web
    'https://www.oficinasmontiel.com/img/p/1/8/9/8/9/3/189893.jpg?_gl=1*yx77bx*_up*MQ..*_gs*MQ..&gclid=Cj0KCQjwj47OBhCmARIsAF5wUEH2hRH0qE6rC4VB8jPHwDbCzIJ6n5nFejVg8zppyY5oHN-Zs9zkpRsaAj5XEALw_wcB', --cambiar
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
    1,
    'Nuestros armarios modulares son la opción ideal para llevar el orden a cualquier espacio adaptándolo al estilo, a las dimensiones o a la filosofía de trabajo. Un sistema personalizable para mantener organizado cualquier entorno laboral.', --de su web
    'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTilEH05Ouz7Hf1GMGFyaOM4-RueO57otwlBJBfUWsbxMkEp6TXnnMBi75JAiK5fid7X1OSM-Rxd-AMzLgAkAManhGjylcG',
    'https://skaply.ovh/home?furniture=VR123456',
    'pdf2',
    true,
    NOW()
),
(
    '', 
    'Silla rústica',
    'VR232243',
    1,
    3,
    'medium',
    2,
    'Silla de estilo mid-century con tapizado en tono verde oliva, integrada en un ambiente cálido y natural que resalta su diseño elegante y funcional. La pieza se presenta colocada junto a la pared, creando un rincón acogedor y realista dentro del salón, ideal para zonas de lectura o descanso.', 
    --'https://i.ibb.co/JwVpPh5M/silla1.png',
    'https://i.postimg.cc/CxM7hhBx/silla1.png',
    'https://skaply.ovh/home?furniture=VR232243',
    'pdf3',
    true,
    NOW()
),
-- SILLAS
(
    '/storage/muebles/sillas/silla_1.glb', 
    'Silla de madera redondeada',
    'VR22891',
    1,
    3,
    'low',
    5,
    'Silla de madera de diseño moderno con acabado natural, respaldo curvo y reposabrazos integrados. Elegante, cómoda y resistente, ideal para comedor o espacios contemporáneos con estilo cálido.', 
    'https://i.postimg.cc/1zqVCQq7/cover-chair.png',
    'https://skaply.ovh/home?furniture=VR22891',
    'pdf4',
    true,
    NOW()
),
(
    '/storage/muebles/sillas/silla_2.glb', 
    'Silla de madera azul',
    'VR2342',
    1,
    3,
    'low',
    3,
    'Silla tapizada con diseño moderno y estampado artístico, patas de madera resistentes y asiento acolchado. Ideal para comedor o sala, aporta estilo, comodidad y un toque decorativo único al espacio.', 
    'https://i.postimg.cc/SsrZs5Gn/silla-azul-sencilla-2.png',
    'https://skaply.ovh/home?furniture=VR2342',
    'pdf4',
    true,
    NOW()
),
(
    '/storage/muebles/sillas/silla_3.glb', 
    'Silla de oficina negra',
    'SO234234',
    1,
    4,
    'medium',
    6,
    'Silla de oficina ergonómica con diseño moderno, tapizado en negro y estructura metálica. Giratoria, con ruedas y reposabrazos, ofrece comodidad y estilo profesional para espacios de trabajo.', 
    'https://i.postimg.cc/9f1XBXmS/office-chair.png',
    'https://skaply.ovh/home?furniture=SO234234',
    'pdf4',
    true,
    NOW()
),
-- ESTANTERIAS
(
    '/storage/muebles/estanterias/estanteria_1.glb', 
    'Estantería light',
    'E234234',
    5,
    4,
    'medium',
    7,
    'Estantería sencilla de 5 niveles con diseño moderno y compacto. Ideal para organizar libros y decoración, perfecta para integrarse en cualquier salón con estilo limpio y funcional.', 
    'https://i.postimg.cc/j2dGqnLQ/estanteria-1.jpg',
    'https://skaply.ovh/home?furniture=E234234',
    'pdf4',
    true,
    NOW()
),
(
    '/storage/muebles/estanterias/estanteria_2.glb', 
    'Estantería alta asimétrica',
    'E234255242',
    5,
    4,
    'medium',
    6,
    'Estantería moderna con estructura negra y baldas blancas. Diseño elegante y funcional, ideal para organizar y decorar espacios contemporáneos con estilo minimalista.', 
    'https://i.postimg.cc/Hn61b4fq/estanteria-2.jpg',
    'https://skaply.ovh/home?furniture=E234255242',
    'pdf4',
    true,
    NOW()
),
-- MESAS
(
    '/storage/muebles/mesas/mesa_1.glb',
    'Mesa de mármol',
    'M232342',
    2,
    4,
    'medium',
    7,
    'Mesa de mármol con diseño práctico y resistente, ideal para exterior, interior o eventos. Ligera, fácil de montar y perfecta para adaptarse a cualquier espacio del hogar.', 
    'https://i.postimg.cc/sX8gRmNg/mesa-1b.png',
    'https://skaply.ovh/home?furniture=M232342',
    'pdf4',
    true,
    NOW()
),
(
    '/storage/muebles/mesas/mesa_2.glb', 
    'Mesa de pino',
    'M23232535',
    2,
    4,
    'low',
    1,
    'Mesa de madera con patas metálicas grises, de diseño limpio y minimalista. Ideal para espacios de estilo japonés, aporta calma, funcionalidad y equilibrio al ambiente.', 
    'https://i.postimg.cc/sXWMnbT5/mesa-2.jpg',
    'https://skaply.ovh/home?furniture=M23232535',
    'pdf4',
    true,
    NOW()
),
(
    '/storage/muebles/mesas/mesa_3.glb', 
    'Mesa redonda auxiliar',
    'M232325245',
    2,
    4,
    'low',
    1,
    'Mesa auxiliar redonda de estilo clásico con base decorativa. Ideal para salones elegantes, perfecta para aportar un toque sofisticado y funcional al espacio.', 
    'https://i.postimg.cc/hv53SyFS/mesa-3.png',
    'https://skaply.ovh/home?furniture=M232325245',
    'pdf4',
    true,
    NOW()
),
-- SOFAS
(
    '/storage/muebles/sofas/sofa_1.glb', 
    'Sofa amplio claro',
    'S34524525',
    3,
    4,
    'medium',
    1,
    'Sofá de tres plazas con diseño minimalista y perfil bajo. Tapizado en beige claro con cojines amplios y mullidos. Líneas rectas, base discreta y estética contemporánea ideal para salones elegantes.', 
    'https://i.postimg.cc/BZ1TyV84/sofa-1.jpg',
    'https://skaply.ovh/home?furniture=S34524525',
    'pdf4',
    true,
    NOW()
),
(
    '/storage/muebles/sofas/sofa_2.glb', 
    'Sofá moderno',
    'S3452544345',
    3,
    4,
    'medium',
    4,
    'Sofá de diseño minimalista con estética nórdica. Destaca por su respaldo abierto y lineal, tapizado en tela gris jaspeada y patas de madera clara. Una pieza funcional, moderna y de aire ligero.', 
    'https://i.postimg.cc/d066sHrc/sofa-2.png',
    'https://skaply.ovh/home?furniture=S3452544345',
    'pdf4',
    true,
    NOW()
)


;

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
(2,1,'Atornillar 6 pernos al panel lateral',NULL, 90.00,'z'),     
(2,2,'Ensamblar el tablero inferior y las dos baldas',NULL, 90.00, 'z'),    
(2,3,'Atornillar 6 pernos al tablero y las baldas',NULL, 90.00, 'z'),   
(2,4,'Ensamblar el panel lateral',NULL, 90.00,'z'),     
(2,5,'Ensamblar el tablero trasero',NULL, 200.00, 'y'),  
(2,6,'Atornillar 6 pernos en la parte superior de los tableros',NULL, 200.00, 'y'),     
(2,7,'Ensamblar el tablero superior',NULL, 90.00, 'z'),     
(2,8,'Añadir la puerta derecha',NULL, NUll, NULL),
(2,9,'Añadir la puerta izquierda',NULL, NULL, NULL),
-- Silla rustica
(3,1,'Colocar tacos en la pata 1',NULL,NULL,NULL),
(3,2,'Fijar refuerzo lateral',NULL,NULL,NULL),
(3,3,'Colocar tacos adicionales',NULL,NULL,NULL),
(3,4,'Instalar brazo lateral',NULL,NULL,NULL),
(3,5,'Colocar la segunda pata',NULL,NULL,NULL),
(3,6,'Asegurar tacos de unión',NULL,NULL,NULL),
(3,7,'Fijar refuerzo estructural',NULL,NULL,NULL),
(3,8,'Colocar tacos de ajuste',NULL,NULL,NULL),
(3,9,'Instalar segundo brazo',NULL,NULL,NULL),
(3,10,'Colocar tacos finales',NULL,NULL,NULL),
(3,11,'Fijar asiento principal',NULL,NULL,NULL),
(3,12,'Asegurar tacos del asiento',NULL,NULL,NULL),
(3,13,'Instalar respaldo del asiento',NULL,NULL,NULL);   



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
  (2, 15, 17, 'z', 0.3499999940395355, 0.197691, 0.392026, 0.216871, 0, 0, 0),

  -- silla rustica
  (3, 24, 18, 'x', 0.20000000298023224, -0.2712, 0.384208, 0.47331, 0, 0, -1.570796),
  (3, 19, 18, NULL, 0, -0.294369, 0.344123, 0.251144, 0, 0, 0),
  (3, 24, 18, 'x', 0.20000000298023224, -0.2712, 0.324208, -0.00669, 0, 0, -1.570796),
  (3, 21, 19, 'x', 0.30000001192092896, -0.253363, 0.355363, 0.231662, 0, 0, 0),
  (3, 25, 20, 'y', 0.20000000298023224, -0.29439, 0.62, 0.20331, 0, -3.141593, 0),
  (3, 17, 21, 'y', 0.30000001192092896, -0.294388, 0.63572, 0.161824, 0, 0, 0),
  (3, 20, 22, NULL, 0, 0.348492, 0.344173, 0.251129, 0, 0, 0),
  (3, 24, 23, 'x', -0.20000000298023224, 0.32242, 0.384208, 0.47331, 0, 0, -1.570796),
  (3, 24, 23, 'x', -0.20000000298023224, 0.32242, 0.324208, -0.00669, 0, 0, -1.570796),
  (3, 22, 24, 'x', -0.30000001192092896, 0.307486, 0.351184, 0.234553, 0, 0, 0),
  (3, 25, 25, 'y', 0.20000000298023224, 0.34561, 0.62, 0.20331, 0, -3.141593, 0),
  (3, 18, 26, 'y', 0.30000001192092896, 0.348473, 0.63572, 0.161824, 0, 0, 0),
  (3, 24, 27, 'y', 0.20000000298023224, -0.2512, 0.354208, 0.10331, 0, -3.141593, 0),
  (3, 24, 27, 'y', 0.20000000298023224, -0.2512, 0.384208, 0.36331, 0, -3.141593, 0),
  (3, 24, 27, 'y', 0.20000000298023224, 0.30242, 0.354208, 0.10331, 0, -3.141593, 0),
  (3, 24, 27, 'y', 0.20000000298023224, 0.30242, 0.384208, 0.36331, 0, -3.141593, 0),
  (3, 23, 28, 'y', 0.30000001192092896, 0.025937, 0.436019, 0.277643, 0, 0, 0),
  (3, 24, 29, 'y', 0.30000001192092896, -0.1912, 0.444208, -0.01669, 0, -3.141593, 0),
  (3, 24, 29, 'y', 0.30000001192092896, 0.24242, 0.444208, -0.01669, 0, -3.141593, 0),
  (3, 24, 29, 'y', 0.30000001192092896, 0.02561, 0.444208, -0.01669, 0, -3.141593, 0),
  (3, 26, 30, 'y', 0.30000001192092896, 0.028409, 0.752572, -0.108157, 0, 0, 0);

          
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

