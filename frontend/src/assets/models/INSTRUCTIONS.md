# Modelo 3D de Demostración

## Instrucciones para agregar un modelo real:

1. **Obtén un modelo GLB:**
   - Descarga un modelo gratuito de [Sketchfab](https://sketchfab.com/3d-models?features=downloadable&sort_by=-likeCount)
   - O convierte un modelo existente usando [Blender](https://www.blender.org/) exportando como GLB

2. **Coloca el archivo:**
   - Guarda el archivo `.glb` en esta carpeta (`src/assets/models/`)
   - Renómbralo como `example-model.glb` o actualiza la ruta en el código

3. **Modelos recomendados para muebles:**
   - Sillas, mesas, sofás, estanterías
   - Mantén el tamaño de archivo bajo (< 5MB para mejor rendimiento)

## Modelo de prueba actual:
El visor muestra un mueble generado proceduralmente (mesa con lámpara) cuando no encuentra un archivo GLB válido.

## Optimización de modelos:
- Usa texturas de resolución apropiada (512x512 o 1024x1024)
- Reduce el número de polígonos si es necesario
- Comprime texturas para web