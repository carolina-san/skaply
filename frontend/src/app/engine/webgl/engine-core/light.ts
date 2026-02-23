import { ShaderResource } from '../resource/shader-resource';
import { Entity } from './entity';
import { vec3, mat4 } from 'gl-matrix';

export class Light extends Entity {
    
    // PARAMETERS

    private intensity: vec3 = vec3.fromValues(1, 1, 1); // white light

    // GETTERS

    getIntensity(): vec3 {
        return this.intensity;
    }

    // SETTERS

    setIntensity(intensity: vec3): void {
        vec3.copy(this.intensity, intensity);
    } 

    // DRAW

    draw(modelMatrix: mat4,shader: ShaderResource): void {
        
        // lights do not draw geometry 

        const lightLocalPosition = vec3.fromValues(0, 0, 0);
        const lightWorldPosition = vec3.create();
        vec3.transformMat4(lightWorldPosition, lightLocalPosition, modelMatrix);
        
        shader.setVec3("uLightPosition", lightWorldPosition);
        shader.setVec3("uLightColor", this.intensity);
    }

}
