import { mat4, vec3 } from 'gl-matrix';
import { Resource } from './resource';

export class ShaderResource extends Resource {
    private vertexSource: string = '';
    private fragmentSource: string = '';
    private program?: WebGLProgram;

    constructor(private gl: WebGL2RenderingContext, name: string) {
        super(name);
    }

    // LOAD FILE (ONLY SAVES SOURCES)

    async loadFile(url: string, type: 'vertex' | 'fragment' = 'vertex'): Promise<void> {
        // fetch shader source code from url and convert to text
        const source = await fetch(url).then(res => res.text());
        // save source code in the corresponding variable
        if (type === 'vertex') this.vertexSource = source;
        else this.fragmentSource = source;
    }

    // BUILD SHADER PROGRAM

    buildProgram(): void {
        if (!this.vertexSource || !this.fragmentSource) {
            throw new Error('Vertex or fragment shader is not loaded');
        }

        // compile shaders
        const vertexShader = this.compileShader(this.vertexSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(this.fragmentSource, this.gl.FRAGMENT_SHADER);

        // create program and link
        const program = this.gl.createProgram();
        if (!program) throw new Error('Program creation failed');
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            throw new Error('Error linking program: ' + this.gl.getProgramInfoLog(program));
        }

        // save program in class variable
        this.program = program;

        // delete shaders 
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
    }


    // COMPILE SHADER (PRIVATE, USED TO SHOW ERRORS)

    private compileShader(source: string, type: GLenum): WebGLShader {

        const shader = this.gl.createShader(type);
        if (!shader) throw new Error("Shader creation failed");
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        // check for compilation errors
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            throw new Error(`Error compiling shader: ${info}`);
        }

        return shader;
    }

    // USE SHADER PROGRAM

    use(): void {
        if (!this.program) throw new Error('Shader is not compiled');
        this.gl.useProgram(this.program);
    }

    // DISPOSE

    dispose(): void {
        if (this.program) {
            this.gl.deleteProgram(this.program);
            this.program = undefined;
        }
    }

    // SET UNIFORMS

    setInt(name: string, value: number): void {
        if (!this.program) return;
        const loc = this.gl.getUniformLocation(this.program, name);
        if (loc !== null) this.gl.uniform1i(loc, value);
    }

    setFloat(name: string, value: number): void {
        if (!this.program) return;
        const loc = this.gl.getUniformLocation(this.program, name);
        if (loc !== null) this.gl.uniform1f(loc, value);
    }

    setVec3(name: string, vec: vec3 | number[]): void {
        if (!this.program) return;
        const loc = this.gl.getUniformLocation(this.program, name);
        if (loc !== null) this.gl.uniform3fv(loc, vec as Float32List);
    }

    setVec2(name: string, arr: number[]): void {
        if (!this.program) return;
        const loc = this.gl.getUniformLocation(this.program, name);
        if (loc !== null) this.gl.uniform2fv(loc, arr);
    }

    setMat4(name: string, mat: mat4): void {
        if (!this.program) return;
        const loc = this.gl.getUniformLocation(this.program, name);
        if (loc !== null) this.gl.uniformMatrix4fv(loc, false, mat);
    }
}
