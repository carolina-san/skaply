import { ShaderResource } from '../resource/shader-resource';
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

    draw(modelMatrix: mat4, shader: ShaderResource): void {
        // lights do not draw geometry 
        const localPos = vec3.fromValues(0, 0, 0);
        const worldPos = vec3.create();
        vec3.transformMat4(worldPos, localPos, modelMatrix);
        shader.setVec3("uLightPosition", worldPos);
        shader.setVec3("uLightColor", this.intensity);
    }

}
