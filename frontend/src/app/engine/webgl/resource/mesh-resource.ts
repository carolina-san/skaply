import { Resource } from './resource';
import { Mesh } from '../engine-core/mesh';


export class MeshResource extends Resource {

    vertices!: Float32Array;
    normals!: Float32Array;
    texCoords!: Float32Array;
    indices!: Uint32Array;
    
    private textures: Map<number, WebGLTexture> = new Map();

    //mesh?: Mesh;
    meshes: Mesh[] = [];

    constructor(name: string, private gl: WebGL2RenderingContext) {
        super(name);
    }

    async loadFile(url: string): Promise<void> {

        console.log("Cargando modelo con Assimp:", url);

        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();

        const assimpModule = await import('assimpjs');

        const a = await assimpModule.default({
            locateFile: (file: string) => `assets/assimp/${file}`
        });

        const fileList = new a.FileList();
        fileList.AddFile(url, new Uint8Array(arrayBuffer));

        const result = a.ConvertFileList(fileList, 'assjson');

        if (!result.IsSuccess()) {
            throw new Error(result.GetErrorCode());
        }

        const json = JSON.parse(new TextDecoder().decode(result.GetFile(0).GetContent()));

        await this.loadTextures(json);

        const allMeshes = json.meshes;

        for (let m of allMeshes) {

            const vertices = new Float32Array(m.vertices.flat());

            const normals = m.normals
                ? new Float32Array(m.normals.flat())
                : new Float32Array();

            const texCoords = m.texturecoords?.length
                ? new Float32Array(m.texturecoords[0].flat())
                : new Float32Array();

            const indices = new Uint32Array(m.faces.flat());

            const materialIndex = m.materialindex;
            const texture = this.textures.get(materialIndex);

            const mesh = this.createMesh(vertices, normals, texCoords, indices, texture);
            this.meshes.push(mesh);
        }
    }

    private async loadTextures(json: any) {
        if (!json.materials) return;

        for (let i = 0; i < json.materials.length; i++) {

            const material = json.materials[i];
            const props = material.properties;

            const texProp = props?.find((p: any) => p.key === '$tex.file'); // ruta de imagen
            const colorProp = props?.find((p: any) => p.key === '$clr.diffuse'); // color base

            const gl = this.gl;

            if (texProp && typeof texProp.value === 'string') {
                // --- textura desde archivo ---
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
                // --- textura 1x1 de color ---
                const c = colorProp.value;
                const data = new Uint8Array([
                    Math.round(c[0] * 255),
                    Math.round(c[1] * 255),
                    Math.round(c[2] * 255),
                    Math.round((c[3] ?? 1) * 255),
                ]);

                const texture = gl.createTexture()!;
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    1,
                    1,
                    0,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    data
                );
                gl.generateMipmap(gl.TEXTURE_2D);

                this.textures.set(i, texture);

            } else {
                // --- fallback ---
                const data = new Uint8Array([255, 255, 255, 255]);
                const texture = gl.createTexture()!;
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    1,
                    1,
                    0,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    data
                );
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

        return new Mesh({
            vao,
            indexCount: indices.length,
            texture: texture, 
            indexType: gl.UNSIGNED_INT
        }, gl);
    }

    getMeshes(): Mesh[] {
        return this.meshes;
    }
}
