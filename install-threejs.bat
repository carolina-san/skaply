@echo off
REM Script para instalar Three.js en el proyecto Angular

echo 🔧 Instalando dependencias de Three.js...

REM Navegar al directorio frontend
cd frontend

REM Instalar Three.js y tipos de TypeScript
npm install three @types/three

echo ✅ Three.js instalado correctamente!
echo 📦 Dependencias instaladas:
echo    - three: Biblioteca principal de Three.js
echo    - @types/three: Tipos de TypeScript para Three.js

echo.
echo 🚀 Para usar el visor 3D:
echo 1. Coloca tus modelos GLB en: src/assets/models/
echo 2. Actualiza la ruta del modelo en: src/app/layouts/viewer-3d/viewer-3d.ts
echo 3. Navega a /viewer-3d en tu aplicación

echo.
echo 💡 Para iniciar el servidor de desarrollo:
echo    cd frontend ^&^& npm start

pause