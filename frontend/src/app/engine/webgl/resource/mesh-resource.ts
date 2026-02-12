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

    // LOAD FILE
    // !! version primeriza que solo coge el primer mesh del glb 

    async loadFile(url: string): Promise<void> {

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

    // DRAW (no hace falta porque se dibuja desde la funcion traverse del nodo raiz)

    // draw(transform: mat4) {
    //     if (!this.mesh) return;
    //     this.mesh.draw(transform);
    // }
}