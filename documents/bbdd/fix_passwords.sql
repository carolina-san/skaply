-- Script para hashear las contraseñas existentes en la base de datos
-- Las contraseñas hasheadas con bcrypt para '12345' (salt rounds = 10)

UPDATE "User" SET password = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE email IN (
    'gmail.com',
    'lucia@gmail.com', 
    'carlos@gmail.com',
    'ikea@gmail.com',
    'mueblesbaratos@gmail.com'
);

-- Verificar los cambios
SELECT email, left(password, 20) || '...' as password_preview FROM "User" WHERE email IN (
    'gmail.com',
    'lucia@gmail.com', 
    'carlos@gmail.com',
    'ikea@gmail.com',
    'mueblesbaratos@gmail.com'
);