import { Resource } from './resource';

export class TextureResource extends Resource {

    texture?: WebGLTexture;
    width: number = 0;
    height: number = 0;

    constructor(name: string, private gl: WebGL2RenderingContext) { super(name); }

    // LOAD FROM URL
    async loadFile(url: string): Promise<void> {
        const image = new Image();
        image.src = url;
        await image.decode();
        this.createTextureFromImage(image);
    }

    // LOAD FROM BASE64
    async loadFromBase64(base64Data: string, formatHint: string): Promise<void> {
        const image = new Image();
        let format = formatHint.replace('.', '') || 'png';
        if (format === 'jpg') format = 'jpeg';
        // handle format raw base64 or complete data URI
        if (!base64Data.startsWith('data:')) {
            image.src = `data:image/${format};base64,${base64Data}`;
        } else {
            image.src = base64Data;
        }
        await image.decode();
        this.createTextureFromImage(image);
    }

    // LOAD FROM COLOR
    loadFromColor(r: number, g: number, b: number, a: number = 255): void {
        const gl = this.gl;
        const data = new Uint8Array([r, g, b, a]);
        this.texture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.generateMipmap(gl.TEXTURE_2D);
        this.width = 1;
        this.height = 1;
    }

    private createTextureFromImage(image: HTMLImageElement): void {
        const gl = this.gl;
        this.texture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        // Evitar problemas de imágenes con tamaño no potencia de 2
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); // O true si las UVs lo requieren (depende de Assimp)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        this.width = image.width;
        this.height = image.height;
    }
}
