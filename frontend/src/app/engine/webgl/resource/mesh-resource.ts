/*

EXPLICACIÓN TEÓRICA 
--------------------------------------------------------------------

Definición de MESH y PRIMITIVAS

    MESH -> PRIMITIVAS
    Cada objeto en blender es un MESH.
    Si el MESH tiene zonas con distintos materiales, cada zona es una PRIMITIVA.

--------------------------------------------------------------------

*/

import { Resource } from './resource';
import { TextureResource } from './texture-resource';
import { Mesh } from '../engine-core/mesh';
import { load } from '@loaders.gl/core';
import { GLTFLoader, postProcessGLTF } from '@loaders.gl/gltf';
import { mat4, vec3, quat, mat3 } from 'gl-matrix';

// TYPES

export type RawMesh = {
    verts:  number[];
    norms:  number[];
    uvs:    number[];
    inds:   number[];
    tex?:   TextureResource;
};

export type NamedMesh = { 
    name:   string; 
    mesh:   Mesh 
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
        const meshGroups = this.extractRawMeshes(gltf);
        this.buildNamedMeshes(meshGroups);
        //console.log(`[MeshResource] loaded meshes: ${this.namedMeshes.map(m => m.name)}`);
    }

    // ---------------------------------------------

    // PRIVATE METHODS: PARSE GLTF

    private async fetchAndParseGLTF(url: string): Promise<any> {
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        const rawGltf = await load(buffer, GLTFLoader);
        return postProcessGLTF(rawGltf);
    }

    // PRIVATE METHODS: LOAD TEXTURES

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

    // PRIVATE METHODS: EXTRACT RAW MESHES 

    private extractRawMeshes(gltf: any): { meshName: string, primitives: RawMesh[] }[] {
        return (gltf.meshes ?? []).map((mesh: any) => ({
            meshName: mesh.name || 'mesh',
            primitives: this.extractPrimitivesFromMesh(mesh),
        }));
    }

    private extractPrimitivesFromMesh(mesh: any): RawMesh[] {
        if (!mesh.primitives || mesh.primitives.length === 0) return [];
        return mesh.primitives.map((primitive: any) => {
            const attributes = primitive.attributes;
            if (!this.hasPosition(attributes)) return null;

            const verts = this.getVertices(attributes);
            const norms = this.getNormals(attributes);
            const uvs   = this.getUVs(attributes);
            const vertexCount = verts.length / 3;
            const inds  = this.getIndices(primitive, 0, vertexCount);
            const tex   = this.getTexture(primitive);

            return { verts, norms, uvs, inds, tex };
        }).filter(Boolean);
    }

    // PRIVATE METHODS: BUILD MESHES

    private buildNamedMeshes(meshGroups: { meshName: string, primitives: RawMesh[] }[]): void {
        this.namedMeshes = [];
        meshGroups.forEach(({ meshName, primitives }) => {
            primitives.forEach((raw, i) => {
                const mesh = new Mesh({
                    vertices:  new Float32Array(raw.verts),
                    normals:   new Float32Array(raw.norms),
                    texCoords: new Float32Array(raw.uvs),
                    indices:   new Uint32Array(raw.inds),
                    texture:   raw.tex
                }, this.gl);

                this.namedMeshes.push({
                    name: primitives.length === 1 ? meshName : `${meshName}_${i}`,
                    mesh
                });
            });
        });
        this.meshes = this.namedMeshes.map(n => n.mesh);
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

}