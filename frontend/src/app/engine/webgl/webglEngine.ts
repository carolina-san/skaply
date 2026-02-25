import { Injectable } from '@angular/core';
import { EngineFacade, GeometryConfig, MaterialConfig, RenderableObject, Vector3 } from '../interfaces';
import { ResourceManager } from '../../engine/webgl/resource/resource-manager';
import { MeshResource } from '../../engine/webgl/resource/mesh-resource';
import { Node } from '../../engine/webgl/engine-core/node';
import { ShaderResource } from '../../engine/webgl/resource/shader-resource';
import { mat4, vec3 } from 'gl-matrix';
import { Camera } from './engine-core/camera';
import { Light } from './engine-core/light';


class WebGlRenderableObject implements RenderableObject {

    uuid = crypto.randomUUID();
    userData: any = {};
    castShadow = false;
    receiveShadow = false;
    
    // ⚠️NO SE NECESITA EN EL WRAPPER, SUPONDRIA DUPLICACION DE LOGICA 

    //children: WebGlRenderableObject[] = [];
    //visible = true;

    //position = { x: 0, y: 0, z: 0 };
    //rotation = { x: 0, y: 0, z: 0 };

    // ⚠️NO SE NECESITA EN EL WRAPPER, SUPONDRIA DUPLICACION DE LOGICA 


    constructor(public node: Node) {}

    get nativeObject(): Node {
        return this.node;
    }

    getPosition(): Vector3 {
        const t = this.node.getTranslation();
        return { x: t[0], y: t[1], z: t[2] };
    }

    setPosition(x: number, y: number, z: number): void {
        //this.position = { x, y, z };
        this.node.setTranslation(x, y, z);
    }

    setRotation(x: number, y: number, z: number): void {
        //this.rotation = { x, y, z };
        this.node.setRotation(x, y, z);
    }

    setVisible(visible: boolean): void {
        //this.visible = visible;
        //this.node.setVisible(visible);
    }

    add(child: RenderableObject): void {
        const webglChild = child as WebGlRenderableObject;
        this.node.addChild(webglChild.node);
    }

    remove(child: RenderableObject): void {
        const webglChild = child as WebGlRenderableObject;
        this.node.removeChild(webglChild.node);
    }


    lookAt(target: Vector3): void {
        //this.node.lookAt?.(target);
        // solo existe lokkAt en camara 
    }
}

@Injectable()
export class WebGLEngineAdapter extends EngineFacade {

    private gl!: WebGL2RenderingContext;
    private canvas!: HTMLCanvasElement;
    private clear = { r: 0, g: 0, b: 0, a: 0 };

    private resourceManager = new ResourceManager();
    private shader!: ShaderResource;

    private rootNode = new Node();

    private cameraEntity = new Camera();
    private cameraNode = new Node();

    private lightEntity = new Light();
    private lightNode = new Node();

    //private sceneObjects: WebGlRenderableObject[] = [];  // NO HACE FALTA
    private highlightedObjects: WebGlRenderableObject[] = [];

    private controlsEnabled = false;
    private controlsAutoRotate = false;
    private controlsAutoRotateSpeed = 2;

    private ready = false;

    init(canvas: HTMLCanvasElement, width: number, height: number): void {

        // gl 
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2')!;
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.CULL_FACE);
        this.resize(width, height);

        // camera 
        this.cameraEntity.setPerspective(45, width / height, 0.1, 100);
        this.cameraNode.setEntity(this.cameraEntity);
        this.cameraNode.setTranslation(0, 5, 10);
        this.rootNode.addChild(this.cameraNode);
        
        // light 
        this.lightEntity.setIntensity(vec3.fromValues(1, 1, 1));
        this.lightNode.setEntity(this.lightEntity);
        this.lightNode.setTranslation(8, 10, 5);
        this.rootNode.addChild(this.lightNode);

        // shaders  
        this.initShader().then(() => {
            this.ready = true;
            //this.initControls();
        });
    }

    private async initShader(): Promise<void> {
        this.shader = new ShaderResource(this.gl, 'basic');
        await this.shader.loadFile('assets/shaders/basic.vert', 'vertex');
        await this.shader.loadFile('assets/shaders/basic.frag', 'fragment');
        this.shader.buildProgram();
    }

    resize(width: number, height: number): void {
        if (!this.canvas || !this.gl) return;
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
        this.cameraEntity.setPerspective(45, width / height, 0.1, 100);
    }

    render(): void {
        if (!this.ready) return;
        this.gl.clearColor(this.clear.r, this.clear.g, this.clear.b, this.clear.a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.shader.use();

        const identity = mat4.create();
        this.rootNode.traverse(identity, this.shader, false);

        this.updateControls();
    }

    // private applyAutoRotation(): void {
    //     // Incrementally rotate the scene based on controlsAutoRotateSpeed
    //     const rotationDelta = (this.controlsAutoRotateSpeed * 0.016) * 0.01; // 0.016 ~ 60fps
    //     this.cameraNode.rotate(0, rotationDelta, 0);
    // }


    // ===== OBJECT CREATION METHODS =====

    createMesh(geometry: GeometryConfig, material: MaterialConfig): RenderableObject {
        const mesh = this.createPrimitive(geometry, material);
        const wrapper = new WebGlRenderableObject(mesh);
        return wrapper;
    }

    createGroup(): RenderableObject {
        const groupNode = new Node();
        const wrapperGroupNode = new WebGlRenderableObject(groupNode);
        return wrapperGroupNode;
    }

    createArrowHelper(dir: Vector3, origin: Vector3, length: number, color: number | string): RenderableObject {
        // Create a group to hold the arrow components (shaft and head)
        const arrowGroup = new Node();
        const arrowWrapper = new WebGlRenderableObject(arrowGroup);

        // Normalize direction
        const dirVec = vec3.fromValues(dir.x, dir.y, dir.z);
        vec3.normalize(dirVec, dirVec);

        // Create shaft (cylinder)
        const shaftNode = new Node();
        shaftNode.setTranslation(origin.x, origin.y, origin.z);
        // TODO: Create cylinder mesh resource and set as entity
        arrowGroup.addChild(shaftNode);

        // Create arrowhead (cone)
        const headNode = new Node();
        headNode.setTranslation(origin.x + dirVec[0] * length, origin.y + dirVec[1] * length, origin.z + dirVec[2] * length);
        // TODO: Create cone mesh resource and set as entity
        arrowGroup.addChild(headNode);

        return arrowWrapper;
    }

    // ===== SCENE MANAGEMENT METHODS =====

    addToScene(object: RenderableObject): void {
        const obj = object as WebGlRenderableObject;
        this.rootNode.addChild(obj.node);
    }

    removeFromScene(object: RenderableObject): void {
        const obj = object as WebGlRenderableObject;
        this.rootNode.removeChild(obj.node);
    }

    setBackground(color: number | string | null): void {
        if (color === null) {
            this.clear = { r: 0, g: 0, b: 0, a: 0 };
            return;
        }
        // soporta number tipo 0xRRGGBB
        if (typeof color === 'number') {
            const r = ((color >> 16) & 255) / 255;
            const g = ((color >> 8) & 255) / 255;
            const b = (color & 255) / 255;
            this.clear = { r, g, b, a: 1 };
            return;
        }
        // string => fallback
        this.clear = { r: 0.95, g: 0.95, b: 0.95, a: 1 };
    }

    // ===== CAMERA & CONTROLS METHODS =====

    setCameraProps(position: Vector3, target: Vector3): void {
        this.cameraNode.setTranslation(position.x, position.y, position.z);
        
        const targetVec = vec3.fromValues(target.x, target.y, target.z);
        const cameraMatrix = this.cameraNode.getTransformMatrix();
        
        if (this.camera && this.camera.lookAt) {
            this.camera.lookAt(cameraMatrix, targetVec);
        }
    }

    updateControls(): void {
        // Update camera controls state - called per frame if controls are enabled
        if (this.controlsEnabled && this.controlsAutoRotate) {
            this.applyAutoRotation();
        }
    }

    toggleControls(enable: boolean, autoRotate: boolean): void {
        this.controlsEnabled = enable;
        this.controlsAutoRotate = autoRotate;
        this.initialControlsState = enable;
    }

    setControlsAutoRotateSpeed(speed: number): void {
        this.controlsAutoRotateSpeed = speed;
    }

    resetControls(): void {
        this.controlsEnabled = false;
        this.controlsAutoRotate = false;
        this.controlsAutoRotateSpeed = 2;
        
        // Reset camera to default position
        this.cameraNode.setTranslation(0, 5, 10);
    }

    // ===== INTERACTION METHODS =====

    raycast(x: number, y: number): RenderableObject | null {
        // Normalized device coordinates: x, y range from -1 to +1
        // TODO: Implement raycasting against scene objects
        // For now, return null - implement using camera projection and ray-mesh intersection
        return null;
    }

    setHighlight(objects: RenderableObject[]): void {
        // Clear previous highlights
        this.highlightedObjects.forEach(obj => {
            // Remove highlight material/effect if any
        });
        this.highlightedObjects = [];

        // Apply highlight to new objects
        for (const obj of objects) {
            const webglObj = obj as WebGlRenderableObject;
            this.highlightedObjects.push(webglObj);
            // TODO: Apply highlight shader/material effect to webglObj.node
        }
    }

    checkControlsState(): boolean {
        return this.controlsEnabled;
    }

    getCamera(): any {
        return this.camera;
    }


    // ===== RESOURCE LOADING METHODS =====

    async loadGLTF(url: string): Promise<RenderableObject> {
        const resource = new MeshResource("gltf", this.gl);
        await resource.loadFile(url);

        const groupNode = new Node();
        const group = new WebGlRenderableObject(groupNode);

        for (const mesh of resource.getMeshes()) {
            const meshNode = new Node();
            meshNode.setEntity(mesh);
            groupNode.addChild(meshNode);
            
            const wrapper = new WebGlRenderableObject(meshNode);
        }

        return group;
    }

    wrapNativeObject(native: any): RenderableObject {
        return new WebGlRenderableObject(native);
    }

    dispose(): void {
        this.highlightedObjects = [];
        // Clear the scene by resetting root node
        this.rootNode = new Node();
        this.cameraNode = new Node();
        this.cameraNode.setEntity(this.cameraEntity);
        this.rootNode.addChild(this.cameraNode);
    }
}
