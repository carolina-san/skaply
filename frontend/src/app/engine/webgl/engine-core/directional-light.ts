import { ShaderResource } from '../resource/shader-resource';
import { Light } from './light';
import { vec3, mat4 } from 'gl-matrix';

export class DirectionalLight extends Light {

    // PARAMETERS

    private direction: vec3 = vec3.fromValues(0, -1, 0);
    private ambientIntensity: vec3 = vec3.fromValues(0.2, 0.2, 0.2);
    private diffuseIntensity: vec3 = vec3.fromValues(1.0, 1.0, 1.0);
    private specularIntensity: vec3 = vec3.fromValues(1.0, 1.0, 1.0);

    // SETTERS

    setDirection(x: number, y: number, z: number): void {
        vec3.set(this.direction, x, y, z);
        vec3.normalize(this.direction, this.direction);
    }

    setAmbientIntensity(intensity: vec3): void {
        vec3.copy(this.ambientIntensity, intensity);
    }

    setDiffuseIntensity(intensity: vec3): void {
        vec3.copy(this.diffuseIntensity, intensity);
    }

    setSpecularIntensity(intensity: vec3): void {
        vec3.copy(this.specularIntensity, intensity);
    }

    // UPLOAD

    uploadToShader(shader: ShaderResource, worldMatrix: mat4, index: number): void {
        shader.setVec3("uLightDirection", this.direction);
        shader.setVec3("uLightAmbient", this.ambientIntensity);
        shader.setVec3("uLightDiffuse", this.diffuseIntensity);
        shader.setVec3("uLightSpecular", this.specularIntensity);
    }
}
