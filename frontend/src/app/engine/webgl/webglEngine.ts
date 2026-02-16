// import { Injectable } from '@angular/core';
// import { EngineFacade, GeometryConfig, MaterialConfig, RenderableObject, Vector3 } from '../interfaces';
// import { ResourceManager } from '../../engine/webgl/resource/resource-manager';
// import { MeshResource } from '../../engine/webgl/resource/mesh-resource';
// import { Node } from '../../engine/webgl/engine-core/node';
// import { ShaderResource } from '../../engine/webgl/resource/shader-resource';
// import { mat4, vec3 } from 'gl-matrix';


// class WebGlRenderableObject implements RenderableObject {

//     uuid = crypto.randomUUID();
//     userData: any = {};
//     castShadow = false;
//     receiveShadow = false;

//     children: WebGlRenderableObject[] = [];
//     visible = true;

//     position = { x: 0, y: 0, z: 0 };
//     rotation = { x: 0, y: 0, z: 0 };

//     constructor(
//         public node: Node 
//     ) {}

//     setPosition(x: number, y: number, z: number): void {
//         this.position = { x, y, z };
//         this.node.setTranslation(x, y, z);
//     }

//     setRotation(x: number, y: number, z: number): void {
//         this.rotation = { x, y, z };
//         this.node.setRotation(x, y, z);
//     }

//     // setVisible(visible: boolean): void {
//     //     this.visible = visible;
//     //     this.node.setVisible(visible);
//     // }

//     add(child: RenderableObject): void {

//     if (!(child instanceof WebGlRenderableObject)) {
//         throw new Error("Incompatible RenderableObject for this engine");
//     }

//     this.node.addChild(child.node);
// }

//     remove(child: RenderableObject): void {
//         //this.children = this.children.filter(c => c !== child);
//     }

//     getPosition(): Vector3 {
//         return this.position;
//     }

//     // lookAt(target: Vector3): void {
//     //     this.node.lookAt?.(target);
//     // }
// }

// @Injectable()
// export class WebGLEngineAdapter extends EngineFacade {

//     private gl!: WebGL2RenderingContext;
//     private canvas!: HTMLCanvasElement;

//     private sceneObjects: WebGlRenderableObject[] = [];

//     private shader!: any; 
//     private camera!: any;

//     private ready = false;

//     init(canvas: HTMLCanvasElement, width: number, height: number): void {

//         this.canvas = canvas;
//         this.gl = canvas.getContext('webgl2')!;
//         this.gl.enable(this.gl.DEPTH_TEST);
        
//         this.resize(width, height);

//         this.initializeAsyncShaderAndScene()
        
//         // camera
//         const view = mat4.create();
//         const projection = mat4.create();
//         mat4.lookAt(view, vec3.fromValues(0, 2, 5), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
//         mat4.perspective(projection, Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 100);
//     }
    
//     // ASYNC INITIALIZATION

//     private async initializeAsyncShaderAndScene() {
//         await this.initializeShader();
//         await this.createSceneGraph();
//         this.ready = true;
//     }

//     private async initializeShader(): Promise<void> {
//         this.shader = new ShaderResource(this.gl, "basic");
//         await this.shader.loadFile('assets/shaders/basic.vert', 'vertex');
//         await this.shader.loadFile('assets/shaders/basic.frag', 'fragment');
//         this.shader.buildProgram();
//     }
    
//     private async createSceneGraph(): Promise<void> {
//         this.sceneObjects = [];

//         // resource manager
//         const resourceManager = new ResourceManager();

//         // load mesh resource (glb)
//         const meshResource = await resourceManager.getResource(
//         '../../../storage/vital_pro.glb',
//         () => new MeshResource('vital_pro', this.gl)
//         );
//         const meshes = meshResource.getMeshes();

//         // root node
//         const root = new Node();

//         // model group node
//         const modelNode = new Node();
//         root.addChild(modelNode); // nodo grupo que contiene las transformaciones del modelo
//         for (let mesh of meshes) {
//             const node = new Node();
//             node.setEntity(mesh);
//             modelNode.addChild(node);
//         }
//     }


//     resize(width: number, height: number): void {
//         this.canvas.width = width;
//         this.canvas.height = height;
//         this.gl.viewport(0, 0, width, height);
//     }

//     render(): void {
//         if (!this.ready) return; // async shader and scene graph not ready yet

//         this.gl.clearColor(0.95, 0.95, 0.95, 1);
//         this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

//         this.shader.use();

//         // for (const obj of this.sceneObjects) {
//         //     if (!obj.visible) continue;
//         //     obj.nativeObject.draw?.(this.shader, this.camera);
//         // }
//     }

//     // ⚠️ METODOS QUE NECESITAN REVISIÓN ⚠️

//     createMesh(geometry: GeometryConfig, material: MaterialConfig): RenderableObject {

//         const mesh = this.createPrimitive(geometry, material);
//         const wrapper = new WebGlRenderableObject(mesh);

//         return wrapper;
//     }

//     createGroup(): RenderableObject {
//         return new WebGlRenderableObject({ children: [] });
//     }

//     createArrowHelper(): RenderableObject {
//         throw new Error("ArrowHelper not implemented yet");
//     }

//     addToScene(object: RenderableObject): void {
//         this.sceneObjects.push(object as WebGlRenderableObject);
//     }

//     removeFromScene(object: RenderableObject): void {
//         this.sceneObjects =
//             this.sceneObjects.filter(o => o !== object);
//     }

//     setBackground(color: number | string | null): void {

//         if (color === null) {
//             this.gl.clearColor(0, 0, 0, 0);
//             return;
//         }

//         const c = this.parseColor(color);
//         this.gl.clearColor(c.r, c.g, c.b, 1);
//     }

//     setCameraProps(position: Vector3, target: Vector3): void {
//         this.camera.setPosition(position);
//         this.camera.lookAt(target);
//     }

//     updateControls(): void {}
//     toggleControls(): void {}
//     setControlsAutoRotateSpeed(): void {}
//     resetControls(): void {}

//     raycast(): RenderableObject | null {
//         return null; // implementar más adelante
//     }

//     setHighlight(): void {}

//     checkControlsState(): boolean {
//         return false;
//     }

//     getCamera(): any {
//         return this.camera;
//     }

//     async loadGLTF(url: string): Promise<RenderableObject> {

//         const resource = new MeshResource("gltf", this.gl);
//         await resource.loadFile(url);

//         const group = new WebGlRenderableObject({ children: [] });

//         for (const mesh of resource.getMeshes()) {
//             const wrapper = new WebGlRenderableObject(mesh);
//             group.add(wrapper);
//             this.sceneObjects.push(wrapper);
//         }

//         return group;
//     }

//     wrapNativeObject(native: any): RenderableObject {
//         return new WebGlRenderableObject(native);
//     }

//     dispose(): void {
//         this.sceneObjects = [];
//     }

//     private createPrimitive(
//         geometry: GeometryConfig,
//         material: MaterialConfig
//     ) {
//         // aquí puedes usar tus generadores de box, plane, etc.
//         // y crear Mesh con textura 1x1 basada en material.color
//         return {};
//     }

//     private parseColor(color: number | string) {
//         if (typeof color === 'number') {
//             const r = ((color >> 16) & 255) / 255;
//             const g = ((color >> 8) & 255) / 255;
//             const b = (color & 255) / 255;
//             return { r, g, b };
//         }

//         return { r: 1, g: 1, b: 1 };
//     }
// }
