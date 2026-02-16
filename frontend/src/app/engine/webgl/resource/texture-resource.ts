// !!LO COMENTO PORQUE EN PRINCIPIO NO HACE FALTA USAR ESTA CLASE
// !!LAS TEXTURAS SE COGEN DESDE LOS GLB DIRECTAMENTE EN EL MESH RESOURCE



// import { Resource } from './resource';

// export class TextureResource extends Resource {

//     texture?: WebGLTexture;
//     width: number = 0;
//     height: number = 0;

//     constructor(private gl: WebGL2RenderingContext, name: string) { super(name); }

//     // LOAD FILE

//     async loadFile(url: string): Promise<void> {
//         const image = new Image();
//         image.src = url;
//         await image.decode();

//         const gl = this.gl;
//         this.texture = this.gl.createTexture()!;
//         gl.bindTexture(gl.TEXTURE_2D, this.texture);
//         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
//         gl.generateMipmap(gl.TEXTURE_2D);

//         this.width = image.width;
//         this.height = image.height;
//     }
// }