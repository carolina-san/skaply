import { ShaderResource } from '../resource/shader-resource';
import { Light } from './light';
import { vec3, mat4 } from 'gl-matrix';

export class SpotLight extends Light {

    // PARAMETERS

    private direction: vec3 = vec3.fromValues(0, -1, 0);
    private ambientIntensity: vec3 = vec3.fromValues(0.0, 0.0, 0.0);
    private diffuseIntensity: vec3 = vec3.fromValues(1.0, 1.0, 1.0);
    private specularIntensity: vec3 = vec3.fromValues(1.0, 1.0, 1.0);

    // stored as cosines for shader efficiency, avoids acos per fragment
    private innerCos: number = Math.cos(Math.PI / 14.4); // 12.5° aprox
    private outerCos: number = Math.cos(Math.PI / 10.3); // 17.5° aprox

    // attenuation coefficients
    private a0: number = 1.0;
    private a1: number = 0.014;
    private a2: number = 0.0007;

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

    // angles in degrees, converted to cosines internally
    setAngles(innerDeg: number, outerDeg: number): void {
        this.innerCos = Math.cos(innerDeg * Math.PI / 180);
        this.outerCos = Math.cos(outerDeg * Math.PI / 180);
    }

    setAttenuation(a0: number, a1: number, a2: number): void {
        this.a0 = a0;
        this.a1 = a1;
        this.a2 = a2;
    }

    // DRAW

    draw(modelMatrix: mat4, shader: ShaderResource): void {
        const worldPosition = vec3.create();
        vec3.transformMat4(worldPosition, vec3.fromValues(0, 0, 0), modelMatrix);

        shader.setInt("uSpotEnabled", 1);
        shader.setVec3("uSpotPosition", worldPosition);
        shader.setVec3("uSpotDirection", this.direction);
        shader.setVec3("uSpotAmbient", this.ambientIntensity);
        shader.setVec3("uSpotDiffuse", this.diffuseIntensity);
        shader.setVec3("uSpotSpecular", this.specularIntensity);
        shader.setFloat("uSpotInnerCos", this.innerCos);
        shader.setFloat("uSpotOuterCos", this.outerCos);
        shader.setFloat("uSpotAttA0", this.a0);
        shader.setFloat("uSpotAttA1", this.a1);
        shader.setFloat("uSpotAttA2", this.a2);
    }
}
