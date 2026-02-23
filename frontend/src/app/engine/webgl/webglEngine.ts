import { Injectable } from '@angular/core';
import { EngineFacade, GeometryConfig, MaterialConfig, RenderableObject, Vector3 } from '../interfaces';
import { ResourceManager } from '../../engine/webgl/resource/resource-manager';
import { MeshResource } from '../../engine/webgl/resource/mesh-resource';
import { Node } from '../../engine/webgl/engine-core/node';
import { ShaderResource } from '../../engine/webgl/resource/shader-resource';
import { mat4, vec3 } from 'gl-matrix';
import { Camera } from './engine-core/camera';


class WebGlRenderableObject implements RenderableObject {

    uuid = crypto.randomUUID();
    userData: any = {};
    castShadow = false;
    receiveShadow = false;
    

    //children: WebGlRenderableObject[] = [];
    //visible = true;

    //position = { x: 0, y: 0, z: 0 };
    //rotation = { x: 0, y: 0, z: 0 };

    constructor(public node: Node) {}

    get nativeObject(): Node {
        return this.node;
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

    getPosition(): Vector3 {
        const t = this.node.getTranslation();
        return { x: t[0], y: t[1], z: t[2] };
    }

    lookAt(target: Vector3): void {
        //this.node.lookAt?.(target);
    }
}

@Injectable()
export class WebGLEngineAdapter extends EngineFacade {

    private gl!: WebGL2RenderingContext;
    private canvas!: HTMLCanvasElement;
    private root!: Node;
    private camera!: Camera;
    private cameraNode!: Node;
    private shader!: any;
    private sceneObjects: WebGlRenderableObject[] = [];
    private highlightedObjects: WebGlRenderableObject[] = [];
    private controlsEnabled: boolean = false;
    private controlsAutoRotate: boolean = false;
    private controlsAutoRotateSpeed: number = 2;
    private initialControlsState: boolean = false;
    private resourceManager!: ResourceManager;

    init(canvas: HTMLCanvasElement, width: number, height: number): void {

        // gl context
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2')!;
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.CULL_FACE);
        this.gl.clearColor(0.95, 0.95, 0.95, 1);

        // resource manager
        this.resourceManager = new ResourceManager();

        // root node
        this.root = new Node();

        // camera setup
        this.camera = new Camera();
        this.cameraNode = new Node();
        this.cameraNode.setEntity(this.camera);
        this.root.addChild(this.cameraNode);
        
        // resize canvas
        this.resize(width, height);
    }
    
    // ASYNC INITIALIZATION - Métodos comentados sobre shaders
    // private async initializeAsyncShaderAndSceneGraph() { ... }
    // private async initializeShader(): Promise<void> { ... }
    // private async createSceneGraph(): Promise<void> { ... }

    resize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
        
        // Update camera aspect ratio if needed
        if (this.camera) {
            const aspect = width / height;
            this.camera.setPerspective(45, aspect, 0.1, 100);
        }
    }

    render(): void {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        const identity = mat4.create();
        this.root.traverse(identity, this.shader, false);

        // Apply auto-rotation if enabled
        if (this.controlsEnabled && this.controlsAutoRotate) {
            this.applyAutoRotation();
        }
    }

    private applyAutoRotation(): void {
        // Incrementally rotate the scene based on controlsAutoRotateSpeed
        const rotationDelta = (this.controlsAutoRotateSpeed * 0.016) * 0.01; // 0.016 ~ 60fps
        this.cameraNode.rotate(0, rotationDelta, 0);
    }


    // ===== OBJECT CREATION METHODS =====

    createMesh(geometry: GeometryConfig, material: MaterialConfig): RenderableObject {
        const mesh = this.createPrimitive(geometry, material);
        const wrapper = new WebGlRenderableObject(mesh);
        this.sceneObjects.push(wrapper);
        return wrapper;
    }

    createGroup(): RenderableObject {
        const groupNode = new Node();
        return new WebGlRenderableObject(groupNode);
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

        this.sceneObjects.push(arrowWrapper);
        return arrowWrapper;
    }

    // ===== SCENE MANAGEMENT METHODS =====

    addToScene(object: RenderableObject): void {
        const obj = object as WebGlRenderableObject;
        this.root.addChild(obj.node);
    }

    removeFromScene(object: RenderableObject): void {
        const obj = object as WebGlRenderableObject;
        this.root.removeChild(obj.node);
        
        // Remove from sceneObjects tracking
        const index = this.sceneObjects.indexOf(obj);
        if (index > -1) {
            this.sceneObjects.splice(index, 1);
        }
    }

    setBackground(color: number | string | null): void {
        if (color === null) {
            this.gl.clearColor(0, 0, 0, 0);
            return;
        }

        const c = this.parseColor(color);
        this.gl.clearColor(c.r, c.g, c.b, 1);
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
            this.sceneObjects.push(wrapper);
        }

        return group;
    }

    wrapNativeObject(native: any): RenderableObject {
        return new WebGlRenderableObject(native);
    }

    dispose(): void {
        this.sceneObjects = [];
        this.highlightedObjects = [];
        // Clear the scene by resetting root node
        this.root = new Node();
        this.cameraNode = new Node();
        this.cameraNode.setEntity(this.camera);
        this.root.addChild(this.cameraNode);
    }

    // ===== PRIVATE HELPER METHODS =====

    private createPrimitive(
        geometry: GeometryConfig,
        material: MaterialConfig
    ): Node {
        const node = new Node();

        // Create a simple colored mesh based on geometry type
        try {
            let mesh: any;

            switch (geometry.type) {
                case 'box':
                    mesh = this.createBoxMesh(geometry.args, material);
                    break;
                case 'cylinder':
                    mesh = this.createCylinderMesh(geometry.args, material);
                    break;
                case 'plane':
                    mesh = this.createPlaneMesh(geometry.args, material);
                    break;
                default:
                    console.warn(`Unknown geometry type: ${geometry.type}`);
                    break;
            }

            if (mesh) {
                node.setEntity(mesh);
            }
        } catch (error) {
            console.error('Error creating primitive:', error);
        }

        return node;
    }

    private createBoxMesh(args: number[], material: MaterialConfig): any {
        // args: [width, height, depth]
        const [width, height, depth] = args.length >= 3 ? args : [1, 1, 1];
        
        // TODO: Create actual mesh with vertices, normals, UVs
        // For now, return a placeholder that can be rendered
        return {
            type: 'box',
            dimensions: { width, height, depth },
            material: material,
            draw: () => { /* TODO: Implement */ }
        };
    }

    private createCylinderMesh(args: number[], material: MaterialConfig): any {
        // args: [radiusTop, radiusBottom, height, radialSegments]
        const [radiusTop, radiusBottom, height, radialSegments] = 
            args.length >= 4 ? args : [1, 1, 2, 32];

        return {
            type: 'cylinder',
            dimensions: { radiusTop, radiusBottom, height, radialSegments },
            material: material,
            draw: () => { /* TODO: Implement */ }
        };
    }

    private createPlaneMesh(args: number[], material: MaterialConfig): any {
        // args: [width, height]
        const [width, height] = args.length >= 2 ? args : [1, 1];

        return {
            type: 'plane',
            dimensions: { width, height },
            material: material,
            draw: () => { /* TODO: Implement */ }
        };
    }

    private parseColor(color: number | string) {
        if (typeof color === 'number') {
            const r = ((color >> 16) & 255) / 255;
            const g = ((color >> 8) & 255) / 255;
            const b = (color & 255) / 255;
            return { r, g, b };
        }

        // Handle string colors (e.g., '#FFFFFF', 'blue', etc.)
        if (typeof color === 'string') {
            if (color.startsWith('#')) {
                const hex = color.slice(1);
                const num = parseInt(hex, 16);
                const r = ((num >> 16) & 255) / 255;
                const g = ((num >> 8) & 255) / 255;
                const b = (num & 255) / 255;
                return { r, g, b };
            }
        }

        return { r: 1, g: 1, b: 1 };
    }
}
