import { ShaderResource } from '../resource/shader-resource';
import { Entity } from './entity';
import { mat4 } from 'gl-matrix';

export interface MeshResource {
    vertices: Float32Array;
    normals: Float32Array;
    texCoords: Float32Array;
    indices: Uint32Array;
    texture?: WebGLTexture;
}

export class Mesh extends Entity {

    private vao?: WebGLVertexArrayObject;
    private indexCount: number = 0;
    private initialized = false;
    
    constructor(
        private resource: MeshResource,         
        private gl: WebGL2RenderingContext) 
        {  
        super();
    }

    draw (modelMatrix: mat4, shader: ShaderResource): void {
        const gl = this.gl;

        //console.log('mesh model matrix:' ,modelMatrix);
        
        if (!this.initialized) {
            this.initializeBuffers();
        }
        
        shader.setMat4("uModelMatrix", modelMatrix);
        
        // Bind texture if present
        // (some MeshResource producers may attach a texture)
        // @ts-ignore
        if ((this.resource as any).texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, (this.resource as any).texture as WebGLTexture);
            shader.setInt("uDiffuseTexture", 0);
        }
 
        gl.bindVertexArray(this.vao!);

        // logs
        //console.log('VAO bound:', gl.getParameter(gl.VERTEX_ARRAY_BINDING));
        //console.log('ELEMENT_ARRAY_BUFFER bound:', gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING));
        //console.log('Mesh.draw: indexCount=', this.indexCount, 'vao=', !!this.vao);

        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_INT, 0);
        gl.bindVertexArray(null);
    }

    private initializeBuffers() {

        const gl = this.gl;

        this.vao = gl.createVertexArray()!;
        gl.bindVertexArray(this.vao);

        // vertices
        const vbo = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.resource.vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        // normals
        if (this.resource.normals.length) {
            const nbo = gl.createBuffer()!;
            gl.bindBuffer(gl.ARRAY_BUFFER, nbo);
            gl.bufferData(gl.ARRAY_BUFFER, this.resource.normals, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        }

        // text coords
        if (this.resource.texCoords.length) {
            const tbo = gl.createBuffer()!;
            gl.bindBuffer(gl.ARRAY_BUFFER, tbo);
            gl.bufferData(gl.ARRAY_BUFFER, this.resource.texCoords, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
        }

        // indices
        const ebo = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.resource.indices, gl.STATIC_DRAW);

        this.indexCount = this.resource.indices.length;

        gl.bindVertexArray(null);

        this.initialized = true;
    }
}
