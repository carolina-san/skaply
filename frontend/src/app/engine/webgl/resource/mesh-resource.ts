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

El código de Álvaro solo coge la textura de la 1ª PRIMITIVA como textura generica de todo el MESH. Es correcto esto?

*/

import { Resource } from './resource';
import { TextureResource } from './texture-resource';
import { Mesh } from '../engine-core/mesh';
import { load } from '@loaders.gl/core';
import { GLTFLoader, postProcessGLTF } from '@loaders.gl/gltf';
import { mat4, vec3, quat, mat3 } from 'gl-matrix';

// TYPES

export type RawMesh = {
    verts: number[];
    norms: number[];
    uvs: number[];
    inds: number[];
    tex?: TextureResource;
};

export type NamedMesh = { 
    name: string; 
    mesh: Mesh 
};

// CLASS MESH RESOURCE 

export class MeshResource extends Resource {
    
    meshes: Mesh[] = [];
    private namedMeshes: NamedMesh[] = [];
    private textures = new Map<any, TextureResource>();

    constructor(name: string, private gl: WebGL2RenderingContext) {
        super(name);
    }

    // GETTERS

    getMeshes(): Mesh[] { return this.meshes; }
    getNamedMeshes(): NamedMesh[] { return this.namedMeshes; }

    // LOAD FILE

    async loadFile(url: string): Promise<void> {
        console.log('Cargando modelo con @loaders.gl/gltf:', url);
        const gltf = await this.fetchAndParseGLTF(url);
        await this.loadTextures(gltf);
        const rawMeshObjs = this.extractRawMeshes(gltf);
        this.createMeshesFromRaw(rawMeshObjs, gltf);
        console.log(`[MeshResource] loaded meshes: ${this.namedMeshes.map(m => m.name)}`);
    }

    // --------------------------------------

    // PRIVATE METHODS: PARSE GLTF

    private async fetchAndParseGLTF(url: string): Promise<any> {
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        const rawGltf = await load(buffer, GLTFLoader);
        return postProcessGLTF(rawGltf);
    }


    // PRIVATE METHODS: CREATE MESHES

    private createMeshesFromRaw(rawMeshObjs: RawMesh[], gltf: any): void {
        this.meshes = rawMeshObjs.map(raw => new Mesh({
            vertices:  new Float32Array(raw.verts),
            normals:   new Float32Array(raw.norms),
            texCoords: new Float32Array(raw.uvs),
            indices:   new Uint32Array(raw.inds),
            texture:   raw.tex
        }, this.gl));

        this.namedMeshes = this.meshes.map((mesh, i) => {
            const nodeName = gltf.nodes[i]?.name || `mesh_${i}`;
            return { name: nodeName, mesh };
        });
    }

    // PRIVATE METHODS: LOAD TEXTURE

    private async loadTextures(gltf: any): Promise<void> {
        if (!gltf.materials) return;
        for (let i = 0; i < gltf.materials.length; i++) {
            const material = gltf.materials[i];
            const textureResource = this.buildTextureFromMaterial(material, i);
            this.textures.set(material, textureResource);
        }
    }

    private buildTextureFromMaterial(material: any, index: number): TextureResource {
        const texture = new TextureResource(`mat_${index}`, this.gl);
        const pbr = material.pbrMetallicRoughness;
        const image = pbr?.baseColorTexture?.texture?.source?.image;

        if (image) {
            texture.loadFromImage(image);
            return texture;
        }

        // fallback color
        if (pbr?.baseColorFactor) {
            const c = pbr.baseColorFactor;
            texture.loadFromColor(
                Math.round(c[0] * 255),
                Math.round(c[1] * 255),
                Math.round(c[2] * 255),
                Math.round((c[3] ?? 1) * 255)
            );
        } else {
            texture.loadFromColor(255, 255, 255);
        }

        return texture;
    }
    
    // PRIVATE METHODS: UTILS AND GETTERS
    
    private hasPosition(attributes: any): boolean {
        return !!attributes['POSITION'];
    }

    private emptyRawPrimitive() {
        return { verts: [], norms: [], uvs: [], inds: [], vertexCount: 0 };
    }
    
    private getVertices(attributes: any): number[] {
        return attributes['POSITION'].value;
    }

    private getNormals(attributes: any): number[] {
        return attributes['NORMAL']?.value ?? [];
    }

    private getUVs(attributes: any): number[] {
        return attributes['TEXCOORD_0']?.value ?? [];
    }

    private getIndices(primitive: any, baseIndex: number, vertexCount: number): number[] {
        if (primitive.indices?.value) {
            return primitive.indices.value.map((idx: number) => idx + baseIndex);
        } else {
            return Array.from({ length: vertexCount }, (_, i) => i + baseIndex);
        }
    }

    private getTexture(primitive: any): TextureResource  | undefined {
        return primitive.material 
            ? this.textures.get(primitive.material) 
            : undefined;
    }

    // PRIVATE METHODS: MERGE PRIMITIVES

    private extractRawMeshes(gltf: any): RawMesh[] {
        const meshes = gltf.meshes ?? [];
        return meshes.map((mesh: any) => this.buildRawMeshFromGLTFMesh(mesh));
    }

    private buildRawMeshFromGLTFMesh(mesh: any): RawMesh {
        if (!mesh.primitives || mesh.primitives.length === 0) {
            return { verts: [], norms: [], uvs: [], inds: [] };
        }
        const { merged, texture } = this.mergePrimitivesOfMesh(mesh.primitives);
        return { ...merged, tex: texture };
    }

    private mergePrimitivesOfMesh(primitives: any[]): {
        merged: { verts: number[]; norms: number[]; uvs: number[]; inds: number[] };
        texture?: TextureResource;
    } {
        type Accumulator = {
            verts: number[];
            norms: number[];
            uvs: number[];
            inds: number[];
        };

        let baseIndex = 0;
        let texture: TextureResource | undefined;

        const merged = primitives.reduce((acc: Accumulator, primitive: any) => {
            
            // extract primitive attributes
            const { verts, norms, uvs, inds, text: primitiveTexture, vertexCount } =
                this.mergePrimitive(primitive, baseIndex);

            if (!texture && primitiveTexture) { texture = primitiveTexture; }
           
            // update the total vertex count of the mesh
            baseIndex += vertexCount;

            return {
                // append current primitive data to the accumulated data
                verts: [...acc.verts, ...verts],
                norms: [...acc.norms, ...norms],
                uvs:   [...acc.uvs, ...uvs],
                inds:  [...acc.inds, ...inds]
            };
        }, { verts: [], norms: [], uvs: [], inds: [] } as Accumulator); // initial accumulator state

        return { merged, texture };
    }

    private mergePrimitive(primitive: any, baseIndex: number): 
    {   verts: number[]; 
        norms: number[]; 
        uvs:   number[]; 
        inds:  number[]; 
        text?: TextureResource; 
        vertexCount: number } {
        
        const attributes = primitive.attributes;

        if (!this.hasPosition(attributes)) { return this.emptyRawPrimitive(); }

        // extract attributes
        const verts = this.getVertices(attributes);
        const norms = this.getNormals(attributes);
        const uvs   = this.getUVs(attributes);
        const vertexCount = verts.length / 3; // verts = [x0,y0,z0,  x1,y1,z1,  ...]
        const inds = this.getIndices(primitive, baseIndex, vertexCount);
        const text = this.getTexture(primitive);

        return { verts, norms, uvs, inds, text, vertexCount };
    }

    getNamedMeshes(): NamedMesh[] {
        return this.namedMeshes;
    }
}