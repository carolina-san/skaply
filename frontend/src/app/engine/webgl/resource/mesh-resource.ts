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
import { MaterialResource } from './material-resource';
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
    mat?:   MaterialResource;
};

export type NamedMesh = { 
    name:   string; 
    mesh:   Mesh 
};

// CLASS MESH RESOURCE 

export class MeshResource extends Resource {
    
    meshes: Mesh[] = [];
    private namedMeshes: NamedMesh[] = [];
    private materials = new Map<any, MaterialResource>();

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
        await this.loadMaterials(gltf);
        const meshGroups = this.extractRawMeshes(gltf);
        this.buildNamedMeshes(meshGroups);
        //console.log(`[MeshResource] loaded meshes: ${this.namedMeshes.map(m => m.name)}`);
    }

    // BOUNDING BOXES
    private computeBounds(verts: number[]): { min: Float32Array; max: Float32Array } {
        if (verts.length < 3) {
            return {
                min: new Float32Array([0, 0, 0]),
                max: new Float32Array([0, 0, 0])
            };
        }

        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        for (let i = 0; i < verts.length; i += 3) {
            const x = verts[i];
            const y = verts[i + 1];
            const z = verts[i + 2];

            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (z < minZ) minZ = z;

            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
            if (z > maxZ) maxZ = z;
        }

        return {
            min: new Float32Array([minX, minY, minZ]),
            max: new Float32Array([maxX, maxY, maxZ])
        };
    }


    // ---------------------------------------------

    // PRIVATE METHODS: PARSE GLTF

    private async fetchAndParseGLTF(url: string): Promise<any> {
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        const rawGltf = await load(buffer, GLTFLoader);
        return postProcessGLTF(rawGltf);
    }

    // PRIVATE METHODS: LOAD MATERIALS

    private async loadMaterials(gltf: any): Promise<void> {
        if (!gltf.materials) return;
        for (let i = 0; i < gltf.materials.length; i++) {
            const material = gltf.materials[i];
            const matResource = this.buildMaterialFromGltf(material, i);
            this.materials.set(material, matResource);
        }
    }

    private buildMaterialFromGltf(material: any, index: number): MaterialResource {
        const mat = new MaterialResource(`mat_${index}`, this.gl);
        const pbr = material.pbrMetallicRoughness;
        const image = pbr?.baseColorTexture?.texture?.source?.image;

        if (image) {
            mat.loadDiffuseFromImage(image);
            return mat;
        }

        if (pbr?.baseColorFactor) {
            const c = pbr.baseColorFactor;
            mat.loadDiffuseFromColor(
                Math.round(c[0] * 255),
                Math.round(c[1] * 255),
                Math.round(c[2] * 255),
                Math.round((c[3] ?? 1) * 255)
            );
            mat.setDiffuse(c[0], c[1], c[2]);
            if (pbr.roughnessFactor !== undefined) {
                mat.setShininess(Math.max(1, (1 - pbr.roughnessFactor) * 128));
            }
        } else {
            mat.loadDiffuseFromColor(255, 255, 255);
        }

        return mat;
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
            const mat   = this.getMaterial(primitive);

            return { verts, norms, uvs, inds, mat };
        }).filter(Boolean);
    }

    // PRIVATE METHODS: BUILD MESHES

    private buildNamedMeshes(meshGroups: { meshName: string, primitives: RawMesh[] }[]): void {
        this.namedMeshes = [];
        meshGroups.forEach(({ meshName, primitives }) => {
            primitives.forEach((raw, i) => {

                const bounds = this.computeBounds(raw.verts);

                const mesh = new Mesh({
                    vertices:  new Float32Array(raw.verts),
                    normals:   new Float32Array(raw.norms),
                    texCoords: new Float32Array(raw.uvs),
                    indices:   new Uint32Array(raw.inds),
                    material:  raw.mat,
                    boundsMin: bounds.min,
                    boundsMax: bounds.max
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

    private getMaterial(primitive: any): MaterialResource | undefined {
        return primitive.material
            ? this.materials.get(primitive.material)
            : undefined;
    }

    dispose(): void {
        this.materials.forEach(mat => mat.dispose());
        this.materials.clear();
        this.meshes.forEach(mesh => mesh.dispose());
        this.meshes = [];
        this.namedMeshes = [];
    }

}