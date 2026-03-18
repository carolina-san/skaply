import { ShaderResource } from '../resource/shader-resource';
import { TextureResource } from '../resource/texture-resource';
import { Entity } from './entity';
import { mat4 } from 'gl-matrix';

export interface MeshResource {
    vertices: Float32Array;
    normals: Float32Array;
    texCoords: Float32Array;
    indices: Uint32Array;
    texture?: TextureResource;
}

export class Mesh extends Entity {

    private vao?: WebGLVertexArrayObject;
    private indexCount: number = 0;
    private initialized = false;
    private isHighlighted = false;

    constructor(
        public resource: MeshResource,         
        private gl: WebGL2RenderingContext
    ) {  
        super();
    }

    setIsHighlighted (value: boolean) {
        this.isHighlighted = value;
    }

    getIsHighlighted () : boolean{
        return this.isHighlighted;
    }
    

    draw (modelMatrix: mat4, shader: ShaderResource): void {

        //console.log('mesh model matrix:' ,modelMatrix);
        const gl = this.gl;
        
        if (!this.initialized) { this.initializeBuffers(); }
        
        shader.setMat4("uModelMatrix", modelMatrix);
        shader.setFloat("uHighlight", this.isHighlighted ? 1 : 0);
        
        // Bind texture if available
        if (this.resource.texture) {
            this.resource.texture.bind(0);
            shader.setInt("uDiffuseTexture", 0);
        }
 
        gl.bindVertexArray(this.vao!);
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_INT, 0);
        gl.bindVertexArray(null);

        
        // logs
        //console.log('VAO bound:', gl.getParameter(gl.VERTEX_ARRAY_BINDING));
        //console.log('ELEMENT_ARRAY_BUFFER bound:', gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING));
        //console.log('Mesh.draw: indexCount=', this.indexCount, 'vao=', !!this.vao);
        
    }

    private createArrayBuffer(location: number, size: number, data: Float32Array) {
        const gl = this.gl;
        const vbo = gl.createBuffer()!; // VBO: Vertex Buffer Objet
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
        return vbo;
    }

    private createElementArrayBuffer(data: Uint32Array) {
        const gl = this.gl;            
        const ebo = gl.createBuffer()!; // EBO: Element Buffer Object
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
        return ebo;
    }


    private initializeBuffers() {

        const gl = this.gl;
        this.vao = gl.createVertexArray()!;
        gl.bindVertexArray(this.vao);

        // VBO vertices
        this.createArrayBuffer(0, 3, this.resource.vertices);

        // VBO normals
        if (this.resource.normals.length) {
            this.createArrayBuffer(1, 3, this.resource.normals);
        }

        // VBO text coords
        if (this.resource.texCoords.length) {
            this.createArrayBuffer(2, 2, this.resource.texCoords);
        } 

        // EBO indices
        this.createElementArrayBuffer(this.resource.indices);

        gl.bindVertexArray(null);
        this.indexCount = this.resource.indices.length;
        this.initialized = true;

    }

    drawRaw(shader: ShaderResource): void {
        const gl = this.gl;
        if (!this.initialized) { this.initializeBuffers(); }
        gl.bindVertexArray(this.vao!);
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_INT, 0);
        gl.bindVertexArray(null);
    }

}