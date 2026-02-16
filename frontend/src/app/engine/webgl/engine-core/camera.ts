import { ShaderResource } from '../resource/shader-resource';
import { Entity } from './entity';
import { mat4, vec3 } from 'gl-matrix';

export class Camera extends Entity {

    // !! fixed parameters
    public isPerspective: boolean = true; // false for orthographic
    public near: number = 0.1;
    public far: number = 100;
    public fov: number = 45;
    public aspect: number = 1;

    public viewMatrix: mat4 = mat4.create();        // world coord -> camera coord
    public projectionMatrix: mat4 = mat4.create();  // camera coord -> clip coord
    public position: vec3 = vec3.create();          // camera's position (within world)
    public target: vec3 = vec3.create();            // point camera is looking at 

    // SETTERS

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

    // LOOKAT (CAMERA ORIENTATION)

    lookAt(position: vec3, target: vec3): void {
        vec3.copy(this.position, position);
        vec3.copy(this.target, target);
        mat4.lookAt(this.viewMatrix, this.position, this.target, [0, 1, 0]);
    }

    // DRAW

    draw(modelMatrix: mat4, shader: ShaderResource): void {

        console.log('Camera viewMatrix:', this.viewMatrix);
        console.log('Camera projectionMatrix:', this.projectionMatrix);
        
        // Camera does not draw geometry    
        shader.setMat4("uViewMatrix", this.viewMatrix);
        shader.setMat4("uProjectionMatrix", this.projectionMatrix);
    }
}
