import { Resource } from './resource';
import { Mesh } from '../engine-core/mesh';
import { TextureResource } from './texture-resource';
import { load } from '@loaders.gl/core';
import { GLTFLoader, postProcessGLTF } from '@loaders.gl/gltf';
import { mat4, vec3, quat, mat3 } from 'gl-matrix';

// Export type for named mesh
export type NamedMesh = { name: string; mesh: Mesh };

export class MeshResource extends Resource {
    // Named meshes
    private namedMeshes: NamedMesh[] = [];

    private textures: Map<any, WebGLTexture> = new Map();
    meshes: Mesh[] = [];

    constructor(name: string, private gl: WebGL2RenderingContext) {
        super(name);
    }

    async loadFile(url: string): Promise<void> {
        console.log('Cargando modelo con @loaders.gl/gltf:', url);

        // Fetch direct and parse
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();

        const rawGltf = await load(buffer, GLTFLoader);
        const gltf = postProcessGLTF(rawGltf);

        // 1) Texturas/materiales
        await this.loadTextures(gltf);

        // 2) Parse all raw primitives (do not send to GPU yet)
        const allMeshes = gltf.meshes ?? [];

        type RawMesh = { verts: number[], norms: number[], uvs: number[], inds: number[], tex?: WebGLTexture };
        const rawMeshObjs: RawMesh[] = [];

        for (let i = 0; i < allMeshes.length; i++) {
            const m = allMeshes[i];

            if (!m.primitives || m.primitives.length === 0) {
                rawMeshObjs.push({ verts: [], norms: [], uvs: [], inds: [] });
                continue;
            }

            let mergedVerts: number[] = [];
            let mergedNormals: number[] = [];
            let mergedUvs: number[] = [];
            let mergedIndices: number[] = [];
            let baseIndex = 0;
            let texture: WebGLTexture | undefined = undefined;

            for (const primitive of m.primitives) {
                const attributes = primitive.attributes;
                if (!attributes['POSITION']) continue;

                const v = attributes['POSITION'].value;
                const n = attributes['NORMAL']?.value;
                const uv = attributes['TEXCOORD_0']?.value;

                if (!texture && primitive.material) {
                    texture = this.textures.get(primitive.material);
                }

                for (let j = 0; j < v.length; j++) mergedVerts.push(v[j]);
                if (n) for (let j = 0; j < n.length; j++) mergedNormals.push(n[j]);
                if (uv) for (let j = 0; j < uv.length; j++) mergedUvs.push(uv[j]);

                if (primitive.indices && primitive.indices.value) {
                    for (let j = 0; j < primitive.indices.value.length; j++) {
                        mergedIndices.push(primitive.indices.value[j] + baseIndex);
                    }
                } else {
                    const count = v.length / 3;
                    for (let j = 0; j < count; j++) {
                        mergedIndices.push(baseIndex + j);
                    }
                }
                baseIndex += v.length / 3;
            }

            rawMeshObjs.push({
                verts: mergedVerts,
                norms: mergedNormals,
                uvs: mergedUvs,
                inds: mergedIndices,
                tex: texture
            });
        }

        // 3) Traversing and Baking transforms
        this.namedMeshes = [];
        const used = new Set<string>();

        const pushUnique = (base: string, rawMesh: RawMesh, transform: mat4) => {
            if (!rawMesh || rawMesh.verts.length === 0) return;

            let name = String(base || '').trim();
            if (!name) name = `mesh_unknown`;

            if (used.has(name)) {
                let k = 2;
                while (used.has(`${name}_${k}`)) k++;
                name = `${name}_${k}`;
            }
            used.add(name);

            // Bake transform into vertices and normals
            const finalVerts = new Float32Array(rawMesh.verts.length);
            const finalNorms = new Float32Array(rawMesh.norms.length);

            const normalMatrix = mat3.create();
            mat3.normalFromMat4(normalMatrix, transform);

            for (let j = 0; j < rawMesh.verts.length; j += 3) {
                const vec = vec3.fromValues(rawMesh.verts[j], rawMesh.verts[j + 1], rawMesh.verts[j + 2]);
                vec3.transformMat4(vec, vec, transform);
                finalVerts[j] = vec[0];
                finalVerts[j + 1] = vec[1];
                finalVerts[j + 2] = vec[2];
            }

            for (let j = 0; j < rawMesh.norms.length; j += 3) {
                const norm = vec3.fromValues(rawMesh.norms[j], rawMesh.norms[j + 1], rawMesh.norms[j + 2]);
                vec3.transformMat3(norm, norm, normalMatrix);
                vec3.normalize(norm, norm);
                finalNorms[j] = norm[0];
                finalNorms[j + 1] = norm[1];
                finalNorms[j + 2] = norm[2];
            }

            const mesh = this.createMesh(
                finalVerts,
                finalNorms,
                new Float32Array(rawMesh.uvs),
                new Uint32Array(rawMesh.inds),
                rawMesh.tex
            );

            this.meshes.push(mesh);
            this.namedMeshes.push({ name, mesh });
        };

        const traverseNodes = (nodes: any[], parentMatrix: mat4) => {
            if (!nodes) return;
            for (const node of nodes) {

                const localMatrix = mat4.create();

                if (node.matrix && node.matrix.length === 16) {
                    mat4.copy(localMatrix, node.matrix);
                } else {
                    const translation = node.translation ? vec3.fromValues(node.translation[0], node.translation[1], node.translation[2]) : vec3.create();
                    const rotation = node.rotation ? quat.fromValues(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3]) : quat.create();
                    const scale = node.scale ? vec3.fromValues(node.scale[0], node.scale[1], node.scale[2]) : vec3.fromValues(1, 1, 1);
                    mat4.fromRotationTranslationScale(localMatrix, rotation, translation, scale);
                }

                const currentMatrix = mat4.create();
                mat4.multiply(currentMatrix, parentMatrix, localMatrix);

                if (node.mesh !== undefined && node.mesh !== null) {
                    const nodeName = node.name || node.id || 'node';

                    let meshIndex = -1;
                    if (typeof node.mesh === 'number') {
                        meshIndex = node.mesh;
                    } else {
                        meshIndex = gltf.meshes.indexOf(node.mesh);
                    }

                    if (meshIndex !== -1 && meshIndex < rawMeshObjs.length) {
                        pushUnique(nodeName, rawMeshObjs[meshIndex], currentMatrix);
                    }
                }

                if (node.children && Array.isArray(node.children)) {
                    traverseNodes(node.children, currentMatrix);
                }
            }
        };

        let rootNodes: any[] = [];
        if (gltf.scenes && gltf.scenes.length > 0) {
            const scene = gltf.scene || gltf.scenes[0];
            rootNodes = scene.nodes || [];
        } else if (gltf.nodes) {
            rootNodes = gltf.nodes;
        }

        const identityMatrix = mat4.create();
        traverseNodes(rootNodes, identityMatrix);

        if (this.namedMeshes.length === 0) {
            // fallback if no nodes instances were found just dump un-transformed meshes
            for (let i = 0; i < rawMeshObjs.length; i++) {
                pushUnique(gltf.meshes[i]?.name || `mesh_${i}`, rawMeshObjs[i], identityMatrix);
            }
        }

        console.log('[MeshResource] namedMeshes resolucion OK. Nodos:', this.namedMeshes.map(n => n.name));
    }

    private async loadTextures(gltf: any) {
        if (!gltf.materials) return;

        for (let i = 0; i < gltf.materials.length; i++) {
            const material = gltf.materials[i];
            const pbr = material.pbrMetallicRoughness;

            const textureResource = new TextureResource(`mat_${i}`, this.gl);

            if (pbr && pbr.baseColorTexture && pbr.baseColorTexture.texture) {
                // In browser environment, image source typically resolves to ImageBitmap or HTMLImageElement
                // Under PostProcessGLTF, texture.source gives the image object directly
                const img = pbr.baseColorTexture.texture.source?.image;
                if (img) {
                    try {
                        const gl = this.gl;
                        const texture = gl.createTexture()!;
                        gl.bindTexture(gl.TEXTURE_2D, texture);
                        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                        gl.generateMipmap(gl.TEXTURE_2D);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

                        this.textures.set(material, texture);
                        continue;
                    } catch (e) {
                        console.warn('Error al aplicar textura baseColorTexture', e);
                    }
                }
            }

            if (pbr && pbr.baseColorFactor) {
                const c = pbr.baseColorFactor;
                textureResource.loadFromColor(
                    Math.round(c[0] * 255),
                    Math.round(c[1] * 255),
                    Math.round(c[2] * 255),
                    Math.round((c[3] ?? 1) * 255)
                );
            } else {
                textureResource.loadFromColor(255, 255, 255);
            }

            this.textures.set(material, textureResource.texture!);
        }
    }

    private createMesh(
        vertices: Float32Array,
        normals: Float32Array,
        texCoords: Float32Array,
        indices: Uint32Array,
        texture?: WebGLTexture
    ): Mesh {
        const gl = this.gl;

        const vao = gl.createVertexArray()!;
        gl.bindVertexArray(vao);

        const vbo = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        if (normals && normals.length > 0) {
            const nbo = gl.createBuffer()!;
            gl.bindBuffer(gl.ARRAY_BUFFER, nbo);
            gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        }

        if (texCoords && texCoords.length > 0) {
            const tbo = gl.createBuffer()!;
            gl.bindBuffer(gl.ARRAY_BUFFER, tbo);
            gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
        }

        const ebo = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        gl.bindVertexArray(null);

        return new Mesh(
            {
                vao,
                indexCount: indices.length,
                texture: texture,
                indexType: gl.UNSIGNED_INT,
            },
            gl
        );
    }

    getMeshes(): Mesh[] {
        return this.meshes;
    }

    getNamedMeshes(): NamedMesh[] {
        return this.namedMeshes;
    }
}
