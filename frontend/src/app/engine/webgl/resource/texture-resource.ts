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

    // FROM IMAGE

    public loadFromImage(image: TexImageSource): void {
        // On iOS < 15, @loaders.gl may provide an HTMLImageElement whose decode is still
        // in progress when texImage2D is called. Uploading an incomplete image gives a
        // white/garbage texture that makes the scene appear over-bright on first load.
        // Guard against this: use a neutral placeholder and re-upload once the image fires
        // its load event. ImageBitmap (iOS 15+, Android, desktop) is always ready.
        if (image instanceof HTMLImageElement && (!image.complete || image.naturalWidth === 0)) {
            this.loadFromColor(128, 128, 128);
            image.addEventListener('load', () => this.createTextureFromImage(image), { once: true });
        } else {
            this.createTextureFromImage(image);
        }
    }

    private createTextureFromImage(image: TexImageSource): void {
        const gl = this.gl;
        if (this.texture) { gl.deleteTexture(this.texture); }
        this.texture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); // set to true if UVs require it
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        this.setDefaultParameters();
        this.width = (image as HTMLImageElement).width ?? 0;
        this.height = (image as HTMLImageElement).height ?? 0;
    }

    private setDefaultParameters(): void {
        const gl = this.gl;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    // LOAD FROM BASE64

    async loadFromBase64(base64Data: string, formatHint: string): Promise<void> {
        const image = new Image();
        let format = formatHint.replace('.', '') || 'png';
        if (format === 'jpg') format = 'jpeg';
        // handle raw base64 string or complete data URI
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
        if (this.texture) { gl.deleteTexture(this.texture); }
        const data = new Uint8Array([r, g, b, a]);
        this.texture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.generateMipmap(gl.TEXTURE_2D);
        this.setDefaultParameters();
        this.width = 1;
        this.height = 1;
    }

    // BIND

    public bind(unit: number = 0): void {
        if (!this.texture) return;
        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
    }

    public dispose(): void {
        if (this.texture) {
            this.gl.deleteTexture(this.texture);
            this.texture = undefined;
        }
    }
}
