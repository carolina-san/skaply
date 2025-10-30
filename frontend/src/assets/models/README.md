# Modelos 3D

Esta carpeta contiene los modelos 3D en formato GLB que se pueden visualizar en el visor 3D.

## Cómo agregar un modelo:

1. Coloca tu archivo `.glb` en esta carpeta
2. Actualiza la ruta en el componente `viewer-3d.ts` en la línea que dice:
   ```typescript
   const modelPath = '/assets/models/tu-modelo.glb';
   ```

## Formatos soportados:
- GLB (recomendado)
- GLTF

## Recomendaciones:
- Mantén los archivos pequeños (< 10MB) para mejor rendimiento
- Optimiza las texturas antes de exportar
- Usa herramientas como Blender o glTF-Pipeline para optimización

## Modelo de ejemplo:
Para probar el visor, puedes descargar modelos gratuitos de:
- https://sketchfab.com/
- https://poly.google.com/
- https://github.com/KhronosGroup/glTF-Sample-Models