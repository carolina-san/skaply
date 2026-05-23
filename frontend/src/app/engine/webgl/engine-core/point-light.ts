import { ShaderResource } from '../resource/shader-resource';
import { Light } from './light';
import { vec3, mat4 } from 'gl-matrix';

export class PointLight extends Light {

    // PARAMETERS

    private intensity: vec3 = vec3.fromValues(1, 1, 1);

    private a0: number = 1.0;    // keeps denominator >= 1
    private a1: number = 0.014;  // linear falloff
    private a2: number = 0.0007; // quadratic falloff

    // SETTERS

    setIntensity(intensity: vec3): void {
        vec3.copy(this.intensity, intensity);
    }

    getIntensity(): vec3 {
        return this.intensity;
    }

    setAttenuation(a0: number, a1: number, a2: number): void {
        this.a0 = a0;
        this.a1 = a1;
        this.a2 = a2;
    }

    // UPLOAD

    uploadToShader(shader: ShaderResource, worldMatrix: mat4, index: number): void {
        const pos = vec3.create();
        vec3.transformMat4(pos, vec3.fromValues(0, 0, 0), worldMatrix);

        const p = `uPointLights[${index}]`;
        shader.setVec3(`${p}.position`, pos);
        shader.setVec3(`${p}.color`, this.intensity);
        shader.setFloat(`${p}.a0`, this.a0);
        shader.setFloat(`${p}.a1`, this.a1);
        shader.setFloat(`${p}.a2`, this.a2);
    }
}
