import { ShaderResource } from '../resource/shader-resource';
import { Light } from './light';
import { vec3, mat4 } from 'gl-matrix';

export class PointLight extends Light {

    // PARAMETERS

    private intensity: vec3 = vec3.fromValues(1, 1, 1);

    private a0: number = 1.0;    // keeps denominator >= 1
    private a1: number = 0.014;  // linear falloff
    private a2: number = 0.0007; // quadratic falloff

    // GETTERS

    getIntensity(): vec3 {
        return this.intensity;
    }

    // SETTERS

    setIntensity(intensity: vec3): void {
        vec3.copy(this.intensity, intensity);
    }

    setAttenuation(a0: number, a1: number, a2: number): void {
        this.a0 = a0;
        this.a1 = a1;
        this.a2 = a2;
    }

    // DRAW

    draw(modelMatrix: mat4, shader: ShaderResource): void {

        const lightWorldPosition = vec3.create();
        vec3.transformMat4(lightWorldPosition, vec3.fromValues(0, 0, 0), modelMatrix);

        shader.setVec3("uLightPosition", lightWorldPosition);
        shader.setVec3("uLightColor", this.intensity);
        shader.setFloat("uAttA0", this.a0);
        shader.setFloat("uAttA1", this.a1);
        shader.setFloat("uAttA2", this.a2);
    }
}
