import { Entity } from './entity';
import { mat4 } from 'gl-matrix';

export interface MeshResource {
    vao: WebGLVertexArrayObject; // buffers, atributes and layout of the vertex
    indexCount: number; // number of vertex/triangles to draw
}

export class Mesh extends Entity {
    
    constructor(
    private resource: MeshResource, // mesh info (vao and indexCount)
    private gl: WebGL2RenderingContext) { // WebGL2 context
        super();
    }

    draw (modelMatrix: mat4): void {
        const gl = this.gl;
        // TODO: bind shader, set uniforms
        // Set model matrix uniform
        // gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix);

        // bind VAO
        gl.bindVertexArray(this.resource.vao);

        // draw
        gl.drawElements(gl.TRIANGLES, this.resource.indexCount, gl.UNSIGNED_SHORT, 0);
    }
}
