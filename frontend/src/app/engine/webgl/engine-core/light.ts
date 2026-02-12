import { Entity } from './entity';
import { vec3, mat4 } from 'gl-matrix';

export class Light extends Entity {
    
    // PARAMETERS

    public intensity: vec3 = vec3.fromValues(1, 1, 1); // white light

    // SETTERS

    setIntensity(intensity: vec3): void {
        vec3.copy(this.intensity, intensity);
    }

    // GETTERS

    getIntensity(): vec3 {
        return this.intensity;
    }

    // DRAW

    draw(modelMatrix: mat4): void {
        // Lights do not draw geometry in WebGL, but will pass data to shaders
    }
}
