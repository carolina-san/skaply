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
INSERT INTO "User" (email, name, cif, company_name, professional_code, tax_address, role) VALUES
('gmail.com','Maria','CIF001',null,'PROF001','123 User St','admin'),
('lucia@gmail.com','Lucia','CIF002',null,'PROF002','456 User St','admin'),
('carlos@gmail.com','Carlos','CIF003',null,'PROF003','789 User St','admin'),
('ikea@gmail.com',null,'CIF004','Ikea','PROV001','101 Provider St','provider'),
('mueblesbaratos@gmail.com',null,'CIF005','Muebles Baratos','PROV002','102 Provider St','provider');

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
('part3.stl','P003', 3);

-- ============================
-- 6. Insertar herramientas
-- ============================
INSERT INTO Tool (name) VALUES
('Destornillador'),
('Martillo'),
('Llave Allen'),
('Taladro'),
('Alicates');

-- ============================
-- 7. Insertar muebles
-- ============================
INSERT INTO Furniture (file_uri, name, reference_number, category_id, provider_id,difficulty, color_id) VALUES
('furniture1.stl', 'Silla de madera', 'F001', 1, 4,'low', 3),
('furniture2.stl', 'Mesa de comedor', 'F003', 2, 5,'high', 4),
('furniture3.stl', 'Sofa gris','F006', 3, 5,'medium', 5),
('furniture4.stl', 'Lámpara de comedor','F007', 4, 4,'low', 5);

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
-- 8. Asignar las piezas a los muebles
-- ============================
INSERT INTO Furniture_Part (furniture_id, part_id, quantity) VALUES
(1,1,1),(1,2,1),                        
(2,1,1),(2,2,1), (2,3,1),      
(3,1,2),(3,2,2),
(4,1,2),(4,2,2);                     

-- ============================
-- 9. Insertar pasos de ensamblaje
-- ============================
INSERT INTO Step (furniture_id, step_number, used_in_step_with_id) VALUES -- step_depency es el id del step (hay que contar desde 1)
(1,1,NULL),                     -- mueble 1
(2,1,3),(2,2,NULL),             -- mueble 2: el paso1 se usa en el paso2 (id3)    
(3,1,6),(3,2,6),(3,3,NULL),     -- mueble 3: el paso1 y el paso2 se usan en el paso3 (id6)
(4,1,NULL);                     -- mueble 4

-- ============================
-- 10. Asignar piezas a los pasos
-- ============================
INSERT INTO Step_Part (stepId, part_id, quantity) VALUES
(1,1,1),(1,2,1),                    -- mueble 1
(2,1,1),(2,2,1),(3,3,1),            -- mueble 2   
(4,1,1),(4,2,1),(5,1,1),(5,2,1),    -- mueble 3
(7,1,2),(7,2,2);                    -- mueble 4

-- ============================
-- 11. Asignar herramientas a pasos
-- ============================
INSERT INTO Step_Tool (stepId, tool_id) VALUES
(1,1),(1,2),                -- mueble 1
(2,1),(2,4),(3,5),          -- mueble 2
(4,2),(5,3),(6,4),(6,5),    -- mueble 3
(7,3);                      -- mueble 4

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
