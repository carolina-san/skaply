/*

EXPLICACIÓN TEÓRICA 
--------------------------------------------------------------------

Definición de MESH y PRIMITIVAS

    MESH -> PRIMITIVAS
    Cada objeto en blender es un MESH.
    Si el MESH tiene zonas con distintos materiales, cada zona es una PRIMITIVA.


Para dibujar las PRIMITIVAS como un solo MESH en GPU, se combinan sus atributos.

    Primitiva 1:
        Vértices:   [v0, v1, v2]
        Índices:    [0,1,2]       <- empiezan en 0

    Primitiva 2:
        Vértices:   [v3, v4, v5]
        Índices:    [0,1,2]       <- empiezan en 0 

    Combinación de atributos:
        Combinación de vértices: [v0,v1,v2,v3,v4,v5]
        Combinación de índices:  [0,1,2, 3,4,5]        <- se ajustan para ser secuenciales

--------------------------------------------------------------------

El código de Álvaro solo coge la textura de la 1ª PRIMITIVA como textura generica de todo el MESH. Es correcto esto? No lo sé.

*/

import { Resource } from './resource';
import { Mesh } from '../engine-core/mesh';
import { load } from '@loaders.gl/core';
import { GLTFLoader, postProcessGLTF } from '@loaders.gl/gltf';
import { mat4, vec3, quat, mat3 } from 'gl-matrix';


export type RawMesh = {
    verts: number[];
    norms: number[];
    uvs: number[];
    inds: number[];
    tex?: WebGLTexture;
};

export type NamedMesh = { 
    name: string; 
    mesh: Mesh 
};

export class MeshResource extends Resource {
    
    private namedMeshes: NamedMesh[] = [];
    private textures: Map<any, WebGLTexture> = new Map();
    meshes: Mesh[] = [];

    constructor(name: string, private gl: WebGL2RenderingContext) {
        super(name);
    }

    // PRIVATE METHODS

    private mergePrimitive(primitive: any, baseIndex: number): 
    {   verts: number[]; 
        norms: number[]; 
        uvs:   number[]; 
        inds:  number[]; 
        texture?: WebGLTexture; 
        vertexCount: number } {
        
        // get primitive attributes
        const attributes = primitive.attributes;

        // if primitive has no vertices (therefore, no position), return empty values
        if (!attributes['POSITION']) {
            return { verts: [], norms: [], uvs: [], inds: [], vertexCount: 0 };
        }

        // extract attributes
        const verts = attributes['POSITION'].value;
        const norms = attributes['NORMAL']?.value ?? [];
        const uvs   = attributes['TEXCOORD_0']?.value ?? [];

        // calculate number of vertex (verts = [x0,y0,z0,  x1,y1,z1,  ...] )
        const vertexCount = verts.length / 3;

        // adjust index
        const inds = primitive.indices?.value
            ? primitive.indices.value.map((idx: number)  => idx + baseIndex)
            : Array.from({ length: vertexCount }, (_, i) => i + baseIndex);

        // get texture
        const texture = primitive.material ? this.textures.get(primitive.material) : undefined;

        return { verts, norms, uvs, inds, texture, vertexCount };
    }

    // mala logica!! eliminar!
    private bakeRawMesh(raw: RawMesh, transformMatrix: mat4) {
        const finalVerts = new Float32Array(raw.verts.length);
        const finalNorms = new Float32Array(raw.norms.length);

        const normalMatrix = mat3.create();
        mat3.normalFromMat4(normalMatrix, transformMatrix);

        // Transform vertices
        for (let i = 0; i < raw.verts.length; i += 3) {
            const v = vec3.fromValues(raw.verts[i], raw.verts[i + 1], raw.verts[i + 2]);
            vec3.transformMat4(v, v, transformMatrix);
            finalVerts[i] = v[0];
            finalVerts[i + 1] = v[1];
            finalVerts[i + 2] = v[2];
        }

        // Transform normals
        for (let i = 0; i < raw.norms.length; i += 3) {
            const n = vec3.fromValues(raw.norms[i], raw.norms[i + 1], raw.norms[i + 2]);
            vec3.transformMat3(n, n, normalMatrix);
            vec3.normalize(n, n);
            finalNorms[i] = n[0];
            finalNorms[i + 1] = n[1];
            finalNorms[i + 2] = n[2];
        }

        return {
            verts: finalVerts,
            norms: finalNorms,
            uvs: new Float32Array(raw.uvs),
            inds: new Uint32Array(raw.inds),
            tex: raw.tex
        };
    }

    private generateUniqueName(base: string, used: Set<string>): string { 
        const clean = (base || '').trim() || 'mesh_unknown'; 
        let name = clean; 

        let counter = 2; 

        while (used.has(name)) { name = `${clean}_${counter++}`; } 

        used.add(name); 
        return name; 
    }




    // LOAD

    async loadFile(url: string): Promise<void> {
        console.log('Cargando modelo con @loaders.gl/gltf:', url);

        // download resource and parse to gltf
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        const rawGltf = await load(buffer, GLTFLoader);
        const gltf = postProcessGLTF(rawGltf);

        // get textures
        await this.loadTextures(gltf);

        const allMeshes = gltf.meshes ?? [];
        const rawMeshObjs: RawMesh[] = [];
        
        // process all meshes and their primitives (mesh -> primitives)
        for (const mesh of allMeshes) {
            
            // if mesh has no geometry (not renderable)
            if (!mesh.primitives || mesh.primitives.length === 0) {
                rawMeshObjs.push({ verts: [], norms: [], uvs: [], inds: [] });
                continue;
            }

            let baseIndex = 0; 
            let texture: WebGLTexture | undefined;

            // combine all primitive attributes into a single mesh
            const merged = mesh.primitives.reduce(
                (acc, primitive) => {
                    
                    // extract primitive attributes
                    const { 
                        verts, norms, uvs, inds, texture: primitiveTexture, vertexCount } = this.mergePrimitive(primitive, baseIndex);
                    
                    // if mesh has no texture assigned yet, use the first primitive's texture
                    if (!texture && primitiveTexture) { texture = primitiveTexture; }
                    
                    // update the total vertex count of the mesh
                    baseIndex += vertexCount;

                    return {
                        // append current primitive data to the accumulated data
                        verts:  [...acc.verts,  ...verts],
                        norms:  [...acc.norms,  ...norms],
                        uvs:    [...acc.uvs,    ...uvs],
                        inds:   [...acc.inds,   ...inds]
                    };
                },
                {   // initial accumulator state
                    verts: []   as number[], 
                    norms: []   as number[], 
                    uvs:   []   as number[], 
                    inds:  []   as number[] 
                }

            );
            
            // add raw mesh to array
            rawMeshObjs.push({
                verts:  merged.verts,
                norms:  merged.norms,
                uvs:    merged.uvs,
                inds:   merged.inds,
                tex:    texture
            });
        }

        console.log('Mallas procesadas:', rawMeshObjs.length);
    }

}
    


