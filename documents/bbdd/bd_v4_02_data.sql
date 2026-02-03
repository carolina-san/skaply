-- ESTA VERSION:
--      -  NO HAY SUBCATEGORIAS
--      -  HAY PIEZAS COMUNES DE PRUEBA (pieza1, pieza2, pieza3)
--      -  HAY 4 MUEBLES CON DISTINTAS COMBINACIONES DE PASOS Y CANTIDAD DE PIEZA POR PASO

-- mueble1 |- pieza1 x1 -|
--         |             |- paso1
--         |- pieza2 x1 -|


-- mueble2 |- pieza1 x1 -|
--         |             |- paso1 -|
--         |- pieza2 x1 -|         |- paso2
--         |- pieza3 x1 -----------|


-- mueble3 |- pieza1 x1 -|
--         |             |- paso1 --|
--         |- pieza2 x1 -|          |- paso3
--         |- pieza1 x1 -|          |
--         |             |- paso2 --|
--         |- pieza2 x1 -|


-- mueble4 |- pieza1 x2 -|
--         |             |- paso1
--         |- pieza2 x2 -|


-- ============================
-- 1. Vaciar la base de datos
-- ============================
TRUNCATE TABLE Step_Tool, Step_Part, Review, Issue, KPIs, Furniture_Part, Furniture, Category, Part, Tool, Step, File, "User" CASCADE;
--RESTART IDENTITY;

ALTER SEQUENCE "User_id_seq" RESTART WITH 1;
ALTER SEQUENCE step_id_seq RESTART WITH 1;
ALTER SEQUENCE category_id_seq RESTART WITH 1;
ALTER SEQUENCE furniture_id_seq RESTART WITH 1;
ALTER SEQUENCE issue_id_seq RESTART WITH 1;
ALTER SEQUENCE kpis_id_seq RESTART WITH 1;
ALTER SEQUENCE part_id_seq RESTART WITH 1;
ALTER SEQUENCE review_id_seq RESTART WITH 1;
ALTER SEQUENCE tool_id_seq RESTART WITH 1;
ALTER SEQUENCE color_id_seq RESTART WITH 1;

-- ============================
-- 2. Insertar usuarios
-- ============================
-- Las contraseñas hasheadas con bcrypt para 'password' (salt rounds = 10) -> $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO "User" (email, name, cif, company_name, telephone, tax_address, image_url, role, created_at,password, registration_status, visible) VALUES
('gmail.com','Maria','CIF001',null,'123456789','123 User St','','admin', NOW(),'$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, false),
('lucia@gmail.com','Lucia','CIF002',null,'123456780','456 User St','','admin', NOW(),'$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, false),
('carlos@gmail.com','Carlos','CIF003',null,'123456781','789 User St','','admin', NOW(),'$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, false),
('iqua@gmail.com',null,'CIF004','IqUA','123456782','101 Provider St', 'https://muebleslospacos.es/wp-content/uploads/2024/03/mueble-salon-class-806-salcedo-1024x673.jpg', 'provider', NOW(),'12345', 'approved', true),
('mueblesbaratos@gmail.com',null,'CIF005','Muebles Baratos','123456783','102 Provider St','https://www.muebleslozano.es/wp-content/uploads/2023/07/titulo-escoger-muebles-lozano.jpg','provider', NOW(),'12345', 'approved', true),
('decora@gmail.com',null,'CIF006','Decora','123456783','104 Provider St','https://content.gnoss.ws/carq/imagenes/Documentos/imgsem/4c/4ce8/4ce8d437-612f-43bb-8d8e-d169d1a187e5/2cf38bd4-7d1d-42eb-8982-226c4c4b2c87.jpg','provider', NOW(),'12345', 'approved', true);

-- ============================
-- 3. Insertar categorías
-- ============================
INSERT INTO Category (name, subcategory_id) VALUES
('Sillas', NULL),
('Mesas', NULL),
('Sofás', NULL),
('Lámparas', NULL),
('Estanterías', NULL);

-- ============================
-- 4. Insertar colores
-- ============================
INSERT INTO Color (name, hex) VALUES
('Beige', '#F5E6D3'),
('Verde', '#4CAF50'),
('Azul', '#2196F3'),
('Gris', '#9E9E9E'),
('Marrón', '#795548'),
('Negro', '#212121');

-- ============================
-- 5. Insertar partes
-- ============================
INSERT INTO Part (file_uri, reference_number, color_id) VALUES
('part1.stl','P001', 1),
('part2.stl','P002', 2),
('part3.stl','P003', 3),
('','PSILLA01', 4),
('','PSILLA02', 5),
('','PSILLA03', 6);

-- ============================
-- 6. Insertar herramientas
-- ============================
INSERT INTO Tool (name,image_url) VALUES
('Destornillador','https://www.rztools.com/wp-content/uploads/160714-18-destornilladores-ph1.jpg'),
('Martillo','https://www.ferrokey.eu/media/catalog/product/cache/fd00e0b96a1c32b265511e0d53330673/1/3/13987.jpg'),
('Llave Allen','https://www.bt-ingenieros.com/15773/llaves-allen-con-punta-de-bola-9-piezas.jpg'),
('Taladro','https://www.sasmak.com/5774-large_default/taladro-percutor-compacto-m18-milwaukee-m18bpd-202c.jpg'),
('Alicates','https://mibricolaje.com/26480-large_default/alicate-universal-6-1000v-pamacon.jpg');

-- ============================
-- 7. Insertar muebles
-- ============================
INSERT INTO Furniture (file_uri, name, reference_number, category_id, provider_id, difficulty, color_id, short_description, image_url, qr_url) VALUES
('furniture1.stl', 'Silla de madera', 'F001', 1, 4,'low', 3, 'Silla de madera cómoda y resistente', 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://skaply.ovh/catalogo?furniture=F001'),
('furniture2.stl', 'Mesa de comedor', 'F003', 2, 5,'high', 4, 'Mesa de comedor grande y elegante','https://plus.unsplash.com/premium_photo-1675744019321-f90d6d719da7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://skaply.ovh/catalogo?furniture=F003'),
('furniture3.stl', 'Sofa gris','F006', 3, 5,'medium', 5, 'Sofa gris de tres plazas con cojines suaves','https://images.unsplash.com/photo-1759722667832-48e555120458?q=80&w=754&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://skaply.ovh/catalogo?furniture=F006'),
('furniture4.stl', 'Lámpara de comedor','F007', 4, 4,'low', 5, 'Lámpara de comedor moderna con luz ajustable','https://images.unsplash.com/photo-1642399403814-360bc87e12fb?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fA%3D%3D', 'https://skaply.ovh/catalogo?furniture=F007'),
('silla.stl', 'Silla azul','F008', 1, 4,'low', 3, 'Silla azul apilable y ligera', 'https://plus.unsplash.com/premium_photo-1723874468810-3147a74bb3a7?q=80&w=1114&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://skaply.ovh/catalogo?furniture=F008');
-- mueble1 |- pieza1 x1 -|
--         |             |- paso1
--         |- pieza2 x1 -|


-- mueble2 |- pieza1 x1 -|
--         |             |- paso1 -|
--         |- pieza2 x1 -|         |- paso2
--         |- pieza3 x1 -----------|


-- mueble3 |- pieza1 x1 -|
--         |             |- paso1 --|
--         |- pieza2 x1 -|          |- paso3
--         |- pieza1 x1 -|          |
--         |             |- paso2 --|
--         |- pieza2 x1 -|


-- mueble4 |- pieza1 x2 -|
--         |             |- paso1
--         |- pieza2 x2 -|


-- silla   |- PSILLA01 x1 -|
--         |               |- paso1 -|
--         |- PSILLA02 x1 -|         |- paso2
--         |- PSILLA03 x1 -----------|


-- ============================
-- 8. Asignar las piezas a los muebles
-- ============================
INSERT INTO Furniture_Part (furniture_id, part_id, quantity, exploded_axis, exploded_distance) VALUES
(1,1,1,'y',0.0),(1,2,1,'y',0.0),                        
(2,1,1,'y',0.0),(2,2,1,'y',0.0), (2,3,1,'y',0.0),      
(3,1,2,'y',0.0),(3,2,2,'y',0.0),
(4,1,2,'y',0.0),(4,2,2,'y',0.0),
(5,4,1,'y',0.0),(5,5,1,'y',0.4), (5,6,1,'z',0.4) ;                      

-- ============================
-- 9. Insertar pasos de ensamblaje
-- ============================
INSERT INTO Step (furniture_id, step_number, used_in_step_with_id) VALUES -- step_depency es el id del step (hay que contar desde 1)
(1,1,NULL),                     -- mueble 1
(2,1,3),(2,2,NULL),             -- mueble 2: el paso1 se usa en el paso2 (id3)    
(3,1,6),(3,2,6),(3,3,NULL),     -- mueble 3: el paso1 y el paso2 se usan en el paso3 (id6)
(4,1,NULL),                     -- mueble 4
(5,1,9),(5,2,NULL);             -- silla azul

-- ============================
-- 10. Asignar piezas a los pasos
-- ============================
INSERT INTO Step_Part (stepId, part_id, quantity) VALUES
(1,1,1),(1,2,1),                    -- mueble 1
(2,1,1),(2,2,1),(3,3,1),            -- mueble 2   
(4,1,1),(4,2,1),(5,1,1),(5,2,1),    -- mueble 3
(7,1,2),(7,2,2),                    -- mueble 4
(8,4,1),(8,5,1),(9,6,1);            -- silla azul

-- ============================
-- 11. Asignar herramientas a pasos
-- ============================
INSERT INTO Step_Tool (stepId, tool_id) VALUES
(1,1),(1,2),                -- mueble 1
(2,1),(2,4),(3,5),          -- mueble 2
(4,2),(5,3),(6,4),(6,5),    -- mueble 3
(7,3),                      -- mueble 4
(8,1),(9,2);                -- silla

-- ============================
-- 12. Insertar issues
-- ============================
INSERT INTO Issue (description, user_email, furniture_id) VALUES
('Problema con el ensamblaje','user1@example.com',1),
('Problema con la pieza','user1@example.com',1),
('Falta de piezas','user2@example.com',2),
('Defecto de color','user1@example.com',3),
('Rasguño en superficie','user2@example.com',4);

-- ============================
-- 13. Insertar archivos
-- ============================
INSERT INTO File (uri, name, format, size, issue_id) VALUES
('file1.png','Foto problema 1','png',1.5,1),
('file1b.png','Foto problema 1b','png',1.5,1),
('file2.jpg','Foto problema 2','jpg',2.3,2),
('file3.png','Foto problema 3','png',1.2,3),
('file4.jpg','Foto problema 4','jpg',2.0,4);

-- ============================
-- 14. Insertar reviews
-- ============================
INSERT INTO Review (stars, text, furniture_id) VALUES
(5,'Excelente producto',1),
(5,'Excelente',1),
(4,'Muy bueno',2),
(3,'Aceptable',3),
(2,'No muy satisfecho',4);

-- ============================
-- 15. Insertar KPIs
-- ============================
INSERT INTO KPIs (n_issues, n_suppliers, n_reviews, provider_id) VALUES
(4,2,5,4),
(4,2,5,5);
