-- OJO!!! Dará problemas porque los ids no se resetean y en cada PC se guardan diferente.


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

-- VERSION 1 SIMPLE -> cada pata + esquina es 1 paso.

-- quantity no se usa de momento
INSERT INTO Furniture_Part (furniture_id, part_id, quantity, exploded_axis, exploded_distance) VALUES
(9,7,1,'y',0.0),
(9,8,1,'y',0.0),
(9,9,1,'y',0.0),                        
(9,10,1,'y',0.0),                        
(9,11,1,'y',0.1),                        
(9,12,1,'y',0.1),                        
(9,13,1,'y',0.1),                        
(9,14,1,'y',0.1),                        
(9,15,1,'y',0.1);                                   

-- step_depency es el id del step (hay que contar desde 1)
INSERT INTO Step (furniture_id, step_number, used_in_step_with_id) VALUES    
(9,1,NULL),
(9,2,NULL),
(9,3,NULL),
(9,4,NULL),
(9,5,NULL);


UPDATE Step
SET used_in_step_with_id = 14
WHERE furniture_id = 9
  AND step_number in (1,2,3,4);

-- part_id son solo las piezas NUEVAS de ese paso!
INSERT INTO Step_Part (stepId, part_id, quantity) VALUES  
(10,7,1),(10,11,1),
(11,8,1),(11,12,1),
(12,9,1),(12,13,1),
(13,10,1),(13,14,1),
(14,15,1);







