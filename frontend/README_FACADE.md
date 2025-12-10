# Arquitectura de Fachada 3D

Este documento explica cómo funciona la "Fachada" que hemos implementado para el motor 3D de tu aplicación.

## ¿Qué es y para qué sirve?

Imagina que quieres conducir un coche. No necesitas saber cómo funciona el motor de combustión, la inyección electrónica o la transmisión. Solo necesitas conocer el volante, los pedales y la palanca de cambios.

- **Tu código (el conductor)**: Es el componente `InteractiveAssemblyComponent`.
- **La Fachada (el volante/pedales)**: Es la clase abstracta `EngineFacade`. Define QUÉ se puede hacer (crear objetos, mover cámara, etc.) pero no CÓMO.
- **El Adaptador (el motor real)**: Es `ThreeEngineAdapter`. Es quien realmente hace el trabajo sucio usando la librería **Three.js**.

**Ventaja principal**: Si mañana quieres cambiar el motor (por ejemplo, usar tu propio motor WebGL desde cero), solo tienes que crear un nuevo "Adaptador" y cambiar una línea de configuración. Tu componente ni se enterará del cambio.

## Estructura de Archivos

Ubicación: `frontend/src/app/engine-facade/`

1.  **`interfaces.ts`**: Aquí está el "contrato".
    *   **`EngineFacade` (Clase Abstracta)**: La lista de métodos que cualquier motor debe tener (`init`, `render`, `createMesh`, etc.).
    *   **`RenderableObject`**: Una forma genérica de representar un objeto 3D sin depender de tipos de Three.js.
    *   **Configs (`GeometryConfig`, `MaterialConfig`)**: Objetos simples para describir qué quieres crear (un cubo rojo, un cilindro de madera, etc.).

2.  **`three-adapter.ts`**: La implementación real.
    *   Hereda de `EngineFacade`.
    *   Convierte tus peticiones genéricas en código de Three.js.
    *   Ejemplo: Cuando llamas a `createMesh`, el adaptador crea un `THREE.Mesh` y te devuelve un envoltorio.

## Cómo usarlo en un Componente

### 1. Inyección (Dependency Injection)

En lugar de importar `Three`, pides el `EngineFacade`:

```typescript
// interactive-assembly.component.ts
import { EngineFacade } from '../../engine-facade/interfaces';
import { ThreeEngineAdapter } from '../../engine-facade/three-adapter';

@Component({
  // ...
  // Aquí es donde ocurre la MAGIA. Le dices a Angular:
  // "Cuando alguien pida un EngineFacade, dale el ThreeEngineAdapter"
  providers: [{ provide: EngineFacade, useClass: ThreeEngineAdapter }], 
})
export class InteractiveAssemblyComponent {
  // En el constructor pides la fachada, no el adaptador específico
  constructor(private engine: EngineFacade) {}
}
```

### 2. Uso

Ahora, en tu código, usa `this.engine` para todo:

```typescript
// ANTES (Directo con Three.js)
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(geometry, material);
this.scene.add(cube);

// AHORA (Con la Fachada)
const cube = this.engine.createMesh(
    { type: 'box', args: [1, 1, 1] }, 
    { type: 'standard', color: 0xff0000 }
);
this.engine.addToScene(cube);
```

## Resumen

Has logrado **desacoplar** tu lógica de ensamblaje de la librería gráfica. Esto hace que tu código sea:
1.  Más limpio y fácil de leer.
2.  Más fácil de testear.
3.  Preparado para el futuro (puedes cambiar Three.js por Babylon.js o tu propio motor sin romper nada).
