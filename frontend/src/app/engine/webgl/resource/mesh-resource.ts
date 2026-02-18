import { Resource } from './resource';
import { Mesh } from '../engine-core/mesh';

// Export type for named mesh
export type NamedMesh = { name: string; mesh: Mesh };

export class MeshResource extends Resource {
    // Named meshes
    private namedMeshes: NamedMesh[] = [];

    vertices!: Float32Array;
    normals!: Float32Array;
    texCoords!: Float32Array;
    indices!: Uint32Array;

    private textures: Map<number, WebGLTexture> = new Map();
    meshes: Mesh[] = [];

    constructor(name: string, private gl: WebGL2RenderingContext) {
        super(name);
    }

    async loadFile(url: string): Promise<void> {
        console.log('Cargando modelo con Assimp:', url);

        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();

        const assimpModule = await import('assimpjs');
        const a = await assimpModule.default({
            locateFile: (file: string) => `assets/assimp/${file}`,
        });

        const fileList = new a.FileList();
        fileList.AddFile(url, new Uint8Array(arrayBuffer));

        const result = a.ConvertFileList(fileList, 'assjson');
        if (!result.IsSuccess()) {
            throw new Error(result.GetErrorCode());
        }

        const json = JSON.parse(new TextDecoder().decode(result.GetFile(0).GetContent()));

        // 1) Texturas/materiales
        await this.loadTextures(json);

        // 2) Crear todas las meshes (por índice)
        const allMeshes = json.meshes ?? [];
        const meshObjs: Mesh[] = [];

        for (let i = 0; i < allMeshes.length; i++) {
            const m = allMeshes[i];

            const vertices = new Float32Array((m.vertices ?? []).flat());
            const normals = m.normals ? new Float32Array(m.normals.flat()) : new Float32Array();
            const texCoords = m.texturecoords?.length ? new Float32Array(m.texturecoords[0].flat()) : new Float32Array();
            const indices = new Uint32Array((m.faces ?? []).flat());

            const materialIndex = m.materialindex;
            const texture = this.textures.get(materialIndex);

            const mesh = this.createMesh(vertices, normals, texCoords, indices, texture);
            meshObjs.push(mesh);
            this.meshes.push(mesh);
        }

        // 3) IMPORTANTÍSIMO: mapear NOMBRES desde el árbol de nodos (rootnode)
        //    Ahí es donde suele estar "patas", "tablon_inferior", etc.
        this.namedMeshes = [];
        const used = new Set<string>();

        const pushUnique = (base: string, meshIndex: number) => {
            let name = String(base || '').trim();
            if (!name) name = `mesh_${meshIndex}`;

            // evitar colisiones: "patas", "patas_2", ...
            if (used.has(name)) {
                let k = 2;
                while (used.has(`${name}_${k}`)) k++;
                name = `${name}_${k}`;
            }
            used.add(name);

            const mesh = meshObjs[meshIndex];
            if (mesh) this.namedMeshes.push({ name, mesh });
        };

        const root = json.rootnode;
        if (root) {
            this.traverseAssimpNode(root, (nodeName, meshIndex) => pushUnique(nodeName, meshIndex));
        }

        // 4) Fallback: si por lo que sea no hay nodos, usa mesh_i
        if (this.namedMeshes.length === 0) {
            for (let i = 0; i < meshObjs.length; i++) {
                this.namedMeshes.push({ name: `mesh_${i}`, mesh: meshObjs[i] });
            }
        }

        console.log('[MeshResource] namedMeshes:', this.namedMeshes.map(n => n.name));
    }

    // Recorre el árbol assjson: cada nodo puede referenciar índices de mesh
    private traverseAssimpNode(node: any, onMesh: (nodeName: string, meshIndex: number) => void) {
        const nodeName = String(node.name ?? '').trim();

        const meshes: number[] = Array.isArray(node.meshes) ? node.meshes : [];
        for (const mi of meshes) {
            if (typeof mi === 'number') onMesh(nodeName, mi);
        }

        const children: any[] = Array.isArray(node.children) ? node.children : [];
        for (const c of children) this.traverseAssimpNode(c, onMesh);
    }

    private async loadTextures(json: any) {
        if (!json.materials) return;

        for (let i = 0; i < json.materials.length; i++) {
            const material = json.materials[i];
            const props = material.properties;

            const texProp = props?.find((p: any) => p.key === '$tex.file');
            const colorProp = props?.find((p: any) => p.key === '$clr.diffuse');

            const gl = this.gl;

            if (texProp && typeof texProp.value === 'string') {
                try {
                    const img = new Image();
                    img.src = `assets/models/${texProp.value}`;
                    await img.decode();

                    const texture = gl.createTexture()!;
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                    gl.generateMipmap(gl.TEXTURE_2D);

                    this.textures.set(i, texture);
                } catch (e) {
                    console.warn(`No se pudo cargar la textura: ${texProp.value}`, e);
                }
            } else if (colorProp && Array.isArray(colorProp.value)) {
                const c = colorProp.value;
                const data = new Uint8Array([
                    Math.round(c[0] * 255),
                    Math.round(c[1] * 255),
                    Math.round(c[2] * 255),
                    Math.round((c[3] ?? 1) * 255),
                ]);

                const texture = gl.createTexture()!;
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
                gl.generateMipmap(gl.TEXTURE_2D);

                this.textures.set(i, texture);
            } else {
                const data = new Uint8Array([255, 255, 255, 255]);
                const texture = gl.createTexture()!;
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
                gl.generateMipmap(gl.TEXTURE_2D);
                this.textures.set(i, texture);
            }
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

        // vertices
        const vbo = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        // normals
        if (normals.length) {
            const nbo = gl.createBuffer()!;
            gl.bindBuffer(gl.ARRAY_BUFFER, nbo);
            gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        }

        // texcoords
        if (texCoords.length) {
            const tbo = gl.createBuffer()!;
            gl.bindBuffer(gl.ARRAY_BUFFER, tbo);
            gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
        }

        // indices
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
