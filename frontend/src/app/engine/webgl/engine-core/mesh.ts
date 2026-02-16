import { ShaderResource } from '../resource/shader-resource';
import { Entity } from './entity';
import { mat4 } from 'gl-matrix';

export interface MeshResource {
    vao: WebGLVertexArrayObject; // buffers, atributes and layout of the vertex
    indexCount: number; // number of vertex/triangles to draw
    texture?: WebGLTexture,
    indexType?: GLenum
}

export class Mesh extends Entity {
    
    constructor(
    private resource: MeshResource,         // mesh info (vao and indexCount)
    private gl: WebGL2RenderingContext) {   // WebGL2 context
        super();
    }

    draw (modelMatrix: mat4, shader: ShaderResource): void {
        const gl = this.gl;

        console.log('mesh model matrix:' ,modelMatrix);
        shader.setMat4("uModelMatrix", modelMatrix);

        // Bind texture if present
        // (some MeshResource producers may attach a texture)
        // @ts-ignore
        if ((this.resource as any).texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, (this.resource as any).texture as WebGLTexture);
            shader.setInt("uDiffuseTexture", 0);
        }

        // choose index type if provided
        const indexType = (this.resource as any).indexType ?? gl.UNSIGNED_SHORT;

        
        gl.bindVertexArray(this.resource.vao);

        console.log('VAO bound:', gl.getParameter(gl.VERTEX_ARRAY_BINDING));
        console.log('ELEMENT_ARRAY_BUFFER bound:', gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING));
        console.log('INDEX_TYPE:', indexType);
        console.log('Mesh.draw: indexCount=', this.resource.indexCount, 'vao=', !!this.resource.vao, 'indexType=', indexType);

        gl.drawElements(gl.TRIANGLES, this.resource.indexCount, indexType, 0);
        gl.bindVertexArray(null);
    }
}
