-- Proveedor Actiu + mueble mesa sencilla LM1A011380CBFM0000 (versión simple de montaje)

INSERT INTO "User" (email, name, cif, company_name, telephone, tax_address, image_url, role, created_at, password, registration_status) VALUES
('correo@actiu.com',null,'A03137874', 'Actiu', '+34966560700', 'Parque Tecnológico Actiu, Autovía CV-80, salida Onil-Castalla, 03420 Castalla (Alicante)', 'https://actiucdn.net/cdn-cgi/image/width=941,height=663,fit=cover,format=auto,quality=95//uploads/images/autores/actiu-name-692.jpg', 'provider', NOW(),'$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'approved');

INSERT INTO Part (file_uri, reference_number, color_id) VALUES
('','esquina01', 1),
('','esquina02', 1),
('','esquina03', 1),
('','esquina04', 1),
('','pata01', 1),
('','pata02', 1),
('','pata03', 1),
('','pata04', 1),
('','tablero', 1);


INSERT INTO Furniture (file_uri, name, reference_number, category_id, provider_id, difficulty, color_id, short_description, image_url, qr_url) VALUES
('prueba_01_skaply.glb', 'Mesa de oficina', 'LM1A011380CBFM0000', 2, 4,'low', 3, 'Silla de madera cómoda y resistente', 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://skaply.ovh/catalogo?furniture=F001');

-- id 9 actiu

-- quantity no se usa de momento
INSERT INTO Furniture_Part (furniture_id, part_id, quantity, exploded_axis, exploded_distance) VALUES
(9,7,1,'y',0.1),
(9,8,1,'y',0.1),
(9,9,1,'y',0.1),                        
(9,10,1,'y',0.1),                        
(9,11,1,'y',0.1),                        
(9,12,1,'y',0.1),                        
(9,13,1,'y',0.1),                        
(9,14,1,'y',0.1),                        
(9,15,1,'y',0.1),                        


-- CAMBIAR ESTO !!               

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





