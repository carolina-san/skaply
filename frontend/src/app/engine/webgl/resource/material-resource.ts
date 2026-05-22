import { vec3 } from 'gl-matrix';
import { Resource } from './resource';
import { ShaderResource } from './shader-resource';
import { TextureResource } from './texture-resource';

export class MaterialResource extends Resource {

    // ATTRIBUTES

    private ambient: vec3 = vec3.fromValues(0.2, 0.2, 0.2); // Ka
    private diffuse: vec3 = vec3.fromValues(0.8, 0.8, 0.8); // Kd
    private specular: vec3 = vec3.fromValues(0.5, 0.5, 0.5); // Ks
    private shininess: number = 32;
    private diffuseTexture?: TextureResource;

    constructor(name: string, private gl: WebGL2RenderingContext) {
        super(name);
    }

    // SETTERS

    setAmbient(r: number, g: number, b: number): void { vec3.set(this.ambient, r, g, b); }
    setDiffuse(r: number, g: number, b: number): void { vec3.set(this.diffuse, r, g, b); }
    setSpecular(r: number, g: number, b: number): void { vec3.set(this.specular, r, g, b); }
    setShininess(value: number): void { this.shininess = value; }
    setDiffuseTexture(texture: TextureResource): void { this.diffuseTexture = texture; }

    // GETTERS

    getAmbient(): vec3 { return this.ambient; }
    getDiffuse(): vec3 { return this.diffuse; }
    getSpecular(): vec3 { return this.specular; }
    getShininess(): number { return this.shininess; }
    getDiffuseTexture(): TextureResource | undefined { return this.diffuseTexture; }

    // LOAD DIFFUSE TEXTURE FROM IMAGE OR COLOR (called by MeshResource)

    loadDiffuseFromImage(image: HTMLImageElement): void {
        const tex = new TextureResource(this.name + '_tex', this.gl);
        tex.loadFromImage(image);
        this.diffuseTexture = tex;
    }

    loadDiffuseFromColor(r: number, g: number, b: number, a: number = 255): void {
        const tex = new TextureResource(this.name + '_tex', this.gl);
        tex.loadFromColor(r, g, b, a);
        this.diffuseTexture = tex;
    }

    // LOAD FILE (properties from JSON — texture is set separately via loadDiffuse*)

    async loadFile(url: string): Promise<void> {
        const data = await fetch(url).then(res => res.json());
        if (data.ambient) vec3.set(this.ambient, ...(data.ambient as [number, number, number]));
        if (data.diffuse) vec3.set(this.diffuse, ...(data.diffuse as [number, number, number]));
        if (data.specular) vec3.set(this.specular, ...(data.specular as [number, number, number]));
        if (data.shininess !== undefined) this.shininess = data.shininess;
    }

    // BIND TO SHADER

    bind(shader: ShaderResource): void {
        shader.setVec3('uMaterial.ambient', this.ambient);
        shader.setVec3('uMaterial.diffuse', this.diffuse);
        shader.setVec3('uMaterial.specular', this.specular);
        shader.setFloat('uMaterial.shininess', this.shininess);
        if (this.diffuseTexture) {
            this.diffuseTexture.bind(0);
            shader.setInt('uDiffuseTexture', 0);
        }
    }

    // DISPOSE

    dispose(): void {
        this.diffuseTexture?.dispose();
        this.diffuseTexture = undefined;
    }
}
