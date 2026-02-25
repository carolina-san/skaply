import { ShaderResource } from '../resource/shader-resource';
import { Entity } from './entity';
import { mat4, vec3 } from 'gl-matrix';

export class Camera extends Entity {

    //private target: vec3 = vec3.create(); // point camera is looking at
    
    private viewMatrix: mat4 = mat4.create(); // world coord -> camera coord
    private projectionMatrix: mat4 = mat4.create(); // camera coord -> clip coord
    
    private isPerspective: boolean = true; // false for orthographic
    private near: number = 0.1;
    private far: number = 100;
    private fov: number = 45;
    private aspect: number = 1.0; // aspect ratio (width / height)

    
    // GETTERS

    // getTarget(): vec3 { return this.target; }
    getViewMatrix(): mat4 { return this.viewMatrix; }
    getProjectionMatrix(): mat4 { return this.projectionMatrix; }
    getIsPerspective(): boolean { return this.isPerspective; }
    getNear(): number { return this.near; }
    getFar(): number { return this.far; }
    getFov(): number { return this.fov; }
    getAspect(): number { return this.aspect; }

    // SETTERS

    // setTarget(target: vec3) {
    //     vec3.copy(this.target, target);
    //     this.updateViewMatrix();
    // }

    setPerspective(fov: number, aspect: number, near: number, far: number): void {
        this.isPerspective = true;
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        mat4.perspective(this.projectionMatrix, fov, aspect, near, far);
    }

    setOrthographic(left: number, right: number, bottom: number, top: number, near: number, far: number): void {
        this.isPerspective = false;
        mat4.ortho(this.projectionMatrix, left, right, bottom, top, near, far);
    }

    // LOOK AT
    
    lookAt(modelMatrix: mat4, target: vec3): void {
        const cameraLocalPosition = vec3.fromValues(0, 0, 0);
        const cameraWorldPosition = vec3.create();
        vec3.transformMat4(cameraWorldPosition, cameraLocalPosition, modelMatrix);
        mat4.lookAt(this.viewMatrix, cameraWorldPosition, target, [0, 1, 0]);
    }
    
    // DRAW
    
    draw(modelMatrix: mat4, shader: ShaderResource): void {
        
        //console.log('Camera viewMatrix:', this.viewMatrix);
        //console.log('Camera projectionMatrix:', this.projectionMatrix);

        // update camera lookAt (fixed)
        this.lookAt(modelMatrix, vec3.fromValues(0, 0, 0)); 
        
        // camera world position    
        const cameraLocalPosition = vec3.fromValues(0, 0, 0);
        const cameraWorldPosition = vec3.create();
        vec3.transformMat4(cameraWorldPosition, cameraLocalPosition, modelMatrix);

        // send to shader
        shader.setMat4("uViewMatrix", this.viewMatrix);
        shader.setMat4("uProjectionMatrix", this.projectionMatrix);
        shader.setVec3("uViewPosition", cameraWorldPosition);
    }

    // PRIVATE METHODS

    // private updateViewMatrix() {
    //     mat4.lookAt(this.viewMatrix, this.position, this.target, [0, 1, 0]);
    // }
}
