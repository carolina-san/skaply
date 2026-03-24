// ⚠️ ESTE ARCHIVO NECESITA REVISIÓN

import { ShaderResource } from './resource/shader-resource';

export class OutlinePass {
  private msFbo!: WebGLFramebuffer;
  private msColorBuffer!: WebGLRenderbuffer;
  private msDepthBuffer!: WebGLRenderbuffer;

  private fbo!: WebGLFramebuffer;
  private texture!: WebGLTexture;
  private quadVao!: WebGLVertexArrayObject;
  private maskShader!: ShaderResource;
  private edgeShader!: ShaderResource;
  private width: number = 0;
  private height: number = 0;

  constructor(private gl: WebGL2RenderingContext) {}

  async init(width: number, height: number): Promise<void> {
    this.width = width;
    this.height = height;
    this.createFramebuffer(width, height);
    this.createQuad();
    await this.createShaders();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    // Recrear framebuffer con nuevo tamaño
    this.gl.deleteFramebuffer(this.msFbo);
    this.gl.deleteRenderbuffer(this.msColorBuffer);
    this.gl.deleteRenderbuffer(this.msDepthBuffer);

    this.gl.deleteFramebuffer(this.fbo);
    this.gl.deleteTexture(this.texture);
    this.createFramebuffer(width, height);
  }

  private createFramebuffer(width: number, height: number): void {
    const gl = this.gl;
    const samples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES));

    // 1. Multisampled FBO for rendering the mask
    this.msFbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.msFbo);

    this.msColorBuffer = gl.createRenderbuffer()!;
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.msColorBuffer);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, this.msColorBuffer);

    this.msDepthBuffer = gl.createRenderbuffer()!;
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.msDepthBuffer);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT16, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.msDepthBuffer);

    // 2. Resolve FBO (single sampled, with texture) for the edge shader
    this.texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private createQuad(): void {
    const gl = this.gl;
    // Quad fullscreen en NDC
    const verts = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.quadVao = vao;
  }

  private async createShaders(): Promise<void> {
    const gl = this.gl;

    // Shader para pintar la máscara (silueta sólida de la pieza)
    this.maskShader = new ShaderResource(gl, 'mask');
    await this.maskShader.loadFile('../../../assets/shaders/mask.vert', 'vertex');
    await this.maskShader.loadFile('../../../assets/shaders/mask.frag', 'fragment');
    this.maskShader.buildProgram();

    // Shader para detectar bordes y dibujarlos
    this.edgeShader = new ShaderResource(gl, 'edge');
    await this.edgeShader.loadFile('../../../assets/shaders/edge.vert', 'vertex');
    await this.edgeShader.loadFile('../../../assets/shaders/edge.frag', 'fragment');
    this.edgeShader.buildProgram();
  }

  // Renderiza la silueta de los meshes al FBO
  renderMask(
    meshes: { mesh: any; modelMatrix: any }[],
    viewMatrix: any,
    projectionMatrix: any
  ): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.msFbo);
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    this.maskShader.use();
    this.maskShader.setMat4('uViewMatrix', viewMatrix);
    this.maskShader.setMat4('uProjectionMatrix', projectionMatrix);

    for (const { mesh, modelMatrix } of meshes) {
      this.maskShader.setMat4('uModelMatrix', modelMatrix);
      mesh.drawRaw(this.maskShader);
    }

    // Resolve multisampled FBO to texture FBO
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.msFbo);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.fbo);
    gl.blitFramebuffer(
      0, 0, this.width, this.height,
      0, 0, this.width, this.height,
      gl.COLOR_BUFFER_BIT, gl.NEAREST
    );

    // Desvincular FBO — el caller restaurará el viewport
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // Dibuja los bordes detectados encima de la escena
  drawEdges(outlineColor: [number, number, number], thickness: number): void {
    const gl = this.gl;
    // console.log('drawEdges - texture:', this.texture, 'quadVao:', this.quadVao);
    // console.log('canvas size:', this.width, this.height);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.edgeShader.use();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    this.edgeShader.setInt('uMaskTexture', 0);
    this.edgeShader.setVec3('uOutlineColor', outlineColor);
    this.edgeShader.setFloat('uThickness', thickness);
    this.edgeShader.setFloat('uTexelWidth', 1.0 / this.width);
    this.edgeShader.setFloat('uTexelHeight', 1.0 / this.height);

    gl.bindVertexArray(this.quadVao);
    
    // Verificar errores GL antes del draw
    const errBefore = gl.getError();
    // console.log('GL error before draw:', errBefore);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); // ← OJO: el orden era (mode, first, count) — antes tenías (gl.TRIANGLE_STRIP, 4, 0) que está MAL
    
    const errAfter = gl.getError();
    // console.log('GL error after draw:', errAfter);
    
    gl.bindVertexArray(null);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
  }
}