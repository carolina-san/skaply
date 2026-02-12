import { mat4 } from 'gl-matrix';
import { Resource } from './resource';
import { Mesh } from '../engine-core/mesh';
import { load } from '@loaders.gl/core';
import { GLTFLoader } from '@loaders.gl/gltf';

export class MeshResource extends Resource {
    
    vertices: Float32Array;
    normals: Float32Array;
    texCoords: Float32Array;
    indices: Uint16Array;
    mesh?: Mesh;

    constructor(name: string) {
        super(name);
        this.vertices = new Float32Array();
        this.normals = new Float32Array();
        this.texCoords = new Float32Array();
        this.indices = new Uint16Array();
    }

    // LOAD FILE

    // !! version primeriza que solo coge el primer mesh del glb 
    async loadFile(url: string): Promise<void> {

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

        // get first mesh and its primitive (geometry)
        const mesh = json.meshes[0];
        const primitive = mesh.primitives[0];

        // accessor doesnt contain the actual vertex data
        // it just describes how to read it from the bufferView
        // mesh → accessor → bufferView → buffer
        const positionAccessor = json.accessors[primitive.attributes.POSITION];
        const normalAccessor = json.accessors[primitive.attributes.NORMAL];
        const indexAccessor = json.accessors[primitive.indices];

        const extractData = (accessor: any) => {
            const bufferView = json.bufferViews[accessor.bufferView];
            const buffer = buffers[bufferView.buffer];

            const byteOffset =
                (bufferView.byteOffset || 0) +
                (accessor.byteOffset || 0);

            const length =
                accessor.count * this.getNumComponents(accessor.type);

            return new Float32Array(buffer, byteOffset, length); // real vertex data
        };

        // save vertices and normals
        this.vertices = extractData(positionAccessor);
        this.normals = normalAccessor? extractData(normalAccessor): new Float32Array();

        // extract indices
        const indexBufferView = json.bufferViews[indexAccessor.bufferView];
        const indexBuffer = buffers[indexBufferView.buffer];

        // save indices
        this.indices = new Uint16Array(
            indexBuffer,
            indexBufferView.byteOffset || 0,
            indexAccessor.count
        );
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