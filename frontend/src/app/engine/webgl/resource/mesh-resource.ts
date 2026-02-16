import { mat4 } from 'gl-matrix';
import { Resource } from './resource';
import { Mesh } from '../engine-core/mesh';
import { load } from '@loaders.gl/core';
import { GLTFLoader } from '@loaders.gl/gltf';

export interface Material {
    name: string;
    baseColorTexture?: WebGLTexture;
    metallicRoughnessTexture?: WebGLTexture;
    normalTexture?: WebGLTexture;
}

export class MeshResource extends Resource {
    
    vertices: Float32Array = new Float32Array();
    normals: Float32Array = new Float32Array();
    texCoords: Float32Array = new Float32Array();
    indices: Uint16Array = new Uint16Array();
    mesh?: Mesh;
    materials: Material[] = [];

    constructor(name: string, private gl: WebGL2RenderingContext) {
        super(name);
    }

    // LOAD FILE (LOAD GLTF AND SETUP BUFFERS)

    async loadFile(url: string): Promise<void> {
        await this.loadGLTF(url);
        this.setupBuffers();
    }

    // LOAD GLTF !! version primeriza que solo coge el primer mesh del glb 

    private async loadGLTF(url: string): Promise<void> {

        // INFO:
        // Dowload glTF file and parse it using loaders.gl
        // loaders.gl returns an object with the following structure:
        //  {
        //      json,     // estructura glTF
        //      buffers,  // datos binarios reales
        //      images
        //  }
        // json contains:
        //      json.meshes
        //      json.accessors
        //      json.bufferViews
        //      json.nodes
        //      json.materials

        const gltf: any = await load(url, GLTFLoader);
        const json = gltf.json;
        const buffers = gltf.buffers;
        const images = gltf.images;

        // get first mesh and its primitive (geometry)
        const mesh = json.meshes[0];
        const primitive = mesh.primitives[0];

        const extractData = (accessor: any) => {
            const bufferView = json.bufferViews[accessor.bufferView];
            const buffer = buffers[bufferView.buffer];

            const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
            const length = accessor.count * this.getNumComponents(accessor.type);

            return new Float32Array(buffer, byteOffset, length); // real vertex data
        };

        // INFO:
        // accessor doesnt contain the actual vertex data
        // it just describes how to read it from the bufferView
        // mesh → accessor → bufferView → buffer
        const positionAccessor = json.accessors[primitive.attributes.POSITION];
        const normalAccessor = json.accessors[primitive.attributes.NORMAL];
        const texCoordAccessor = primitive.attributes.TEXCOORD_0 ? json.accessors[primitive.attributes.TEXCOORD_0] : null;
        const indexAccessor = json.accessors[primitive.indices];

        // save vertices, normals, texCoords
        this.vertices = extractData(positionAccessor);
        this.normals = normalAccessor? extractData(normalAccessor): new Float32Array();
        this.texCoords = texCoordAccessor? extractData(texCoordAccessor): new Float32Array();

        // extract indices
        const indexBufferView = json.bufferViews[indexAccessor.bufferView];
        const indexBuffer = buffers[indexBufferView.buffer];

        // save indices
        this.indices = new Uint16Array(
            indexBuffer,
            indexBufferView.byteOffset || 0,
            indexAccessor.count
        );

        // extract materials and create WebGL textures for them
        if (json.materials && json.materials.length > 0) {
            
            this.materials = json.materials.map((mat: any) => {
                
                const material: Material = { name: mat.name };

                // Base color texture
                if (mat.pbrMetallicRoughness?.baseColorTexture) {
                    const texIndex = mat.pbrMetallicRoughness.baseColorTexture.index;
                    const image = images[texIndex];
                    if (image) {
                        const glTex = this.gl.createTexture()!;
                        this.gl.bindTexture(this.gl.TEXTURE_2D, glTex);
                        this.gl.texImage2D(
                            this.gl.TEXTURE_2D, 0, this.gl.RGBA,
                            this.gl.RGBA, this.gl.UNSIGNED_BYTE, image
                        );
                        this.gl.generateMipmap(this.gl.TEXTURE_2D);
                        material.baseColorTexture = glTex;
                    }
                }

                // Metallic-roughness texture
                if (mat.pbrMetallicRoughness?.metallicRoughnessTexture) {
                    const texIndex = mat.pbrMetallicRoughness.metallicRoughnessTexture.index;
                    const image = images[texIndex];
                    if (image) {
                        const glTex = this.gl.createTexture()!;
                        this.gl.bindTexture(this.gl.TEXTURE_2D, glTex);
                        this.gl.texImage2D(
                            this.gl.TEXTURE_2D, 0, this.gl.RGBA,
                            this.gl.RGBA, this.gl.UNSIGNED_BYTE, image
                        );
                        this.gl.generateMipmap(this.gl.TEXTURE_2D);
                        material.metallicRoughnessTexture = glTex;
                    }
                }

                // Normal texture
                if (mat.normalTexture) {
                    const texIndex = mat.normalTexture.index;
                    const image = images[texIndex];
                    if (image) {
                        const glTex = this.gl.createTexture()!;
                        this.gl.bindTexture(this.gl.TEXTURE_2D, glTex);
                        this.gl.texImage2D(
                            this.gl.TEXTURE_2D, 0, this.gl.RGBA,
                            this.gl.RGBA, this.gl.UNSIGNED_BYTE, image
                        );
                        this.gl.generateMipmap(this.gl.TEXTURE_2D);
                        material.normalTexture = glTex;
                    }
                }

                return material;
            });
        }
    }

    private getNumComponents(type: string): number {
        switch (type) {
            case 'SCALAR': return 1;
            case 'VEC2': return 2;
            case 'VEC3': return 3;
            case 'VEC4': return 4;
            default: return 3;
        }
    }

    // SETUP BUFFERS (CREATE VAO, VBOs, EBO)

    private setupBuffers(): void {
        
        const gl = this.gl;
        const vao = gl.createVertexArray()!;
        gl.bindVertexArray(vao);

        // POSITION
        const vboPos = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, vboPos);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        // NORMAL
        if (this.normals.length > 0) {
            const vboNormal = gl.createBuffer()!;
            gl.bindBuffer(gl.ARRAY_BUFFER, vboNormal);
            gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(1);
        }

        // TEXCOORD
        if (this.texCoords.length > 0) {
            const vboTex = gl.createBuffer()!;
            gl.bindBuffer(gl.ARRAY_BUFFER, vboTex);
            gl.bufferData(gl.ARRAY_BUFFER, this.texCoords, gl.STATIC_DRAW);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(2);
        }

        // EBO
        const ebo = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        // desbind VAO
        gl.bindVertexArray(null);

        this.mesh = new Mesh(
            { vao, indexCount: this.indices.length },
            gl
        );
    }

    // DRAW (no hace falta porque se dibuja desde la funcion traverse del nodo raiz)

    // draw(transform: mat4) {
    //     if (!this.mesh) return;
    //     this.mesh.draw(transform);
    // }
}