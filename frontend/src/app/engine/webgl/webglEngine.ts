import { Injectable } from '@angular/core';
import { CameraState, EngineFacade, GeometryConfig, MaterialConfig, RenderableObject, Vector3 } from '../interfaces';
import { ResourceManager } from '../../engine/webgl/resource/resource-manager';
import { MeshResource } from '../../engine/webgl/resource/mesh-resource';
import { Node } from '../../engine/webgl/engine-core/node';
import { ShaderResource } from '../../engine/webgl/resource/shader-resource';
import { mat4, vec3 } from 'gl-matrix';
import { Camera } from './engine-core/camera';
import { Light } from './engine-core/light';
import { Entity } from './engine-core/entity';


class WebGlRenderableObject implements RenderableObject {

    uuid = crypto.randomUUID();
    userData: any = {};
    castShadow = false;
    receiveShadow = false;

    constructor(public node: Node) {}

    get nativeObject(): Node {
        return this.node;
    }

    get name(): string {
        return this.node.getName();
    }

    set name(value: string) {
        this.node.setName(value);
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
        this.node.setVisible(visible);
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

export class CameraController {

    // orbit state
    private radius: number;
    private theta: number;
    private phi: number;
    private target: vec3;
    
    // default state (for reset and checkState)
    private readonly defaultRadius: number;
    private readonly defaultTheta: number;
    private readonly defaultPhi: number;
    private readonly defaultTarget: vec3;
    
    // limits
    private readonly minRadius = 1;
    private readonly maxRadius = 10;

    // epsilon to avoid gimbal lock at poles
    private static readonly PHI_EPSILON = 0.01;

    constructor(
        private cameraNode: Node,
        private cameraEntity: Camera,
        private canvas: HTMLCanvasElement,
        isMobile: boolean
    ) {
        // initial orbit state (spherical coordinates)
        this.radius = isMobile ? 3.84 : 3.5355;
        this.theta  = isMobile ? 0.785 : 0.896;
        this.phi    = isMobile ? 1.17  : 1.132;
        this.target = vec3.fromValues(0, 1, 0);

        // save default state for reset and checkState
        this.defaultRadius = this.radius;
        this.defaultTheta  = this.theta;
        this.defaultPhi    = this.phi;
        this.defaultTarget = vec3.clone(this.target);

        this.updateOrbit();
        this.initListeners();
    }

    // GETTERS

    getCameraPosition(): Vector3 {
        const pos = vec3.create();
        vec3.transformMat4(pos, vec3.fromValues(0, 0, 0), this.cameraNode.getTransformMatrix());
        return { x: pos[0], y: pos[1], z: pos[2] };
    }

    getViewMatrix(): Float32Array {
        return new Float32Array(this.cameraEntity.getViewMatrix());
    }

    getProjectionMatrix(): Float32Array {
        return new Float32Array(this.cameraEntity.getProjectionMatrix());
    }

    getOrbitState() {
        return {
            radius: this.radius,
            theta: this.theta,
            phi: this.phi
        };
    }

    getTarget(): Vector3 {
        return {
            x: this.target[0],
            y: this.target[1],
            z: this.target[2]
        };
    }

    // ORBIT, ZOOM, PAN

    orbit(deltaTheta: number, deltaPhi: number): void {

        // update angles
        this.theta += deltaTheta;
        this.phi   += deltaPhi;

        // clamp phi to avoid gimbal lock 
        this.phi = this.normalizePhi(this.phi);

        this.updateOrbit();
    }

    zoom(delta: number): void {
        const zoomSpeed = 0.0015; 
        this.radius *= 1 + delta * zoomSpeed;
        this.radius = Math.max(this.minRadius, Math.min(this.maxRadius, this.radius));
        this.updateOrbit();
    }

    pan(deltaX: number, deltaY: number): void {

        // compute camera basis vectors
        const eye = this.computeEye();
        const { right, up } = this.computeCameraBasis(eye);

        // pan speed adjusted based on radius
        const panSpeed = 0.002 * this.radius;

        // move target in camera's right and up directions
        const moveX = vec3.create();
        const moveY = vec3.create();
        vec3.scale(moveX, right, -deltaX * panSpeed);
        vec3.scale(moveY, up, deltaY * panSpeed);
        vec3.add(this.target, this.target, moveX);
        vec3.add(this.target, this.target, moveY);

        this.updateOrbit();
    }

    // RESET & CHECK STATE

    reset(): void {
        this.radius = this.defaultRadius;
        this.theta  = this.defaultTheta;
        this.phi    = this.defaultPhi;
        vec3.copy(this.target, this.defaultTarget);
        this.updateOrbit();
    }

    hasMovedFromDefault(): boolean {

        // compare current eye and target to default values
        const eye        = this.computeEye();
        const defaultEye = this.computeEyeFrom(this.defaultRadius, this.defaultTheta, this.defaultPhi, this.defaultTarget);

        // check if current eye or target differ significantly from default
        return vec3.dist(eye, defaultEye) > 0.1
            || vec3.dist(this.target, this.defaultTarget) > 0.1;
    }

    // SET CAMERA PROPS 

    setCameraProps(position: Vector3, target: Vector3): void {
       
        // save target
        const targetVec = vec3.fromValues(target.x, target.y, target.z);
        vec3.copy(this.target, targetVec);

        // compute radius, theta, phi from position
        const dx = position.x - target.x;
        const dy = position.y - target.y;
        const dz = position.z - target.z;
        const computedRadius = Math.sqrt(dx * dx + dy * dy + dz * dz);
        this.radius = Math.min(this.maxRadius,Math.max(this.minRadius, computedRadius));
        const safeRadius = Math.max(this.radius, 0.00001); // avoid division by zero
        this.radius = Math.max(0.001, Math.sqrt(dx*dx + dy*dy + dz*dz));
        this.theta  = Math.atan2(dx, dz);
        this.phi    = Math.acos(Math.max(-1, Math.min(1, dy / safeRadius)));
        this.phi    = this.normalizePhi(this.phi); // avoid gimbal lock

        this.updateOrbit();
    }

    // DISPOSE

    dispose(): void {
        this.removeListeners();
    }

    // PRIVATE METHODS

    private normalizePhi(phi: number): number {
        const eps = CameraController.PHI_EPSILON;
        return Math.max(eps, Math.min(Math.PI - eps, phi));
    }

    private computeEye(): vec3 {
        return this.computeEyeFrom(this.radius, this.theta, this.phi, this.target);
    }

    private computeEyeFrom(radius: number, theta: number, phi: number, target: vec3): vec3 {
        const offset = this.sphericalToCartesian(radius, theta, phi);
        return vec3.add(vec3.create(), target, offset);
    }

    private sphericalToCartesian(radius: number, theta: number, phi: number): vec3 {
        const x = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.cos(theta);
        return vec3.fromValues(x, y, z);
    }

    private updateOrbit(): void {
        const eye = this.computeEye();
        this.cameraNode.setTranslation(eye[0], eye[1], eye[2]);
        this.cameraEntity.lookAt(this.cameraNode.getTransformMatrix(), this.target);
    }

    private computeCameraBasis(eye: vec3): { forward: vec3; right: vec3; up: vec3 } {
        const forward = vec3.create();
        const right = vec3.create();
        const up = vec3.create();

        // forward = target - eye
        vec3.sub(forward, this.target, eye);
        vec3.normalize(forward, forward);

        // right = forward x worldUp
        vec3.cross(right, forward, [0, 1, 0]);
        vec3.normalize(right, right);

        // up = right x forward
        vec3.cross(up, right, forward);
        vec3.normalize(up, up);

        return { forward, right, up };
    }

    // INTERACTION

    private isDragging   = false;   // for mouse and touch
    private lastMouseX   = 0;       // for mouse orbit/pan
    private lastMouseY   = 0;       // for mouse orbit/pan
    private lastTouchX   = 0;       // for touch orbit/pan
    private lastTouchY   = 0;       // for touch orbit/pan
    private lastTouchDist = 0;      // for touch zoom

    // bind event handlers to preserve 'this' context
    private _onMouseDown    = (e: MouseEvent)  => this.onMouseDown(e);
    private _onMouseMove    = (e: MouseEvent)  => this.onMouseMove(e);
    private _onMouseUp      = (_: MouseEvent)  => { this.isDragging = false; };
    private _onWheel        = (e: WheelEvent)  => { e.preventDefault(); this.zoom(e.deltaY); };
    private _onContextMenu  = (e: Event)       => { e.preventDefault(); e.stopPropagation(); };
    private _onTouchStart   = (e: TouchEvent)  => this.onTouchStart(e);
    private _onTouchMove    = (e: TouchEvent)  => this.onTouchMove(e);
    private _onTouchEnd     = (e: TouchEvent)  => { if (e.touches.length === 0) this.isDragging = false; };

    // add event listeners to canvas and window
    initListeners(): void {
        this.canvas.addEventListener('mousedown',    this._onMouseDown);
        this.canvas.addEventListener('wheel',        this._onWheel, { passive: false });
        this.canvas.addEventListener('contextmenu',  this._onContextMenu);
        this.canvas.addEventListener('touchstart',   this._onTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove',    this._onTouchMove,  { passive: false });
        this.canvas.addEventListener('touchend',     this._onTouchEnd);
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseup',   this._onMouseUp);
    }

    // remove event listeners (cleanup)
    private removeListeners(): void {
        this.canvas.removeEventListener('mousedown',   this._onMouseDown);
        this.canvas.removeEventListener('wheel',       this._onWheel);
        this.canvas.removeEventListener('contextmenu', this._onContextMenu);
        this.canvas.removeEventListener('touchstart',  this._onTouchStart);
        this.canvas.removeEventListener('touchmove',   this._onTouchMove);
        this.canvas.removeEventListener('touchend',    this._onTouchEnd);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup',   this._onMouseUp);
    }

    // handle mouse button press
    private onMouseDown(e: MouseEvent): void {
        if (e.button === 0 || e.button === 2) {     // left or right click
            if (e.button === 2) e.preventDefault(); // prevent context menu for right click
            this.isDragging = true;
            this.lastMouseX = e.clientX;  // store current mouse position
            this.lastMouseY = e.clientY;
        }
    }

    // handle mouse movement while dragging
    private onMouseMove(e: MouseEvent): void {
        if (!this.isDragging) return;   // do nothing if not dragging
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        if (e.buttons & 1) this.orbit(-dx * 0.005, -dy * 0.005); // left click  -> orbit 
        if (e.buttons & 2) this.pan(dx, dy);                     // right click -> pan 
    }

    // handle touch start
    private onTouchStart(e: TouchEvent): void {
        e.preventDefault(); // prevent default scrolling

        if (e.touches.length === 1) {  // single finger -> orbit
            this.lastTouchX = e.touches[0].clientX;
            this.lastTouchY = e.touches[0].clientY;
            this.isDragging = true;

        } else if (e.touches.length === 2) { // two fingers -> pan + pinch zoom
            
            // store center point between fingers for panning
            this.lastTouchX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            this.lastTouchY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

            // calculate distance between fingers for pinch zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            this.lastTouchDist = Math.sqrt(dx*dx + dy*dy);

            this.isDragging = true;
        }
    }

    // handle touch movement
    private onTouchMove(e: TouchEvent): void {
        e.preventDefault();
        if (!this.isDragging) return;

        if (e.touches.length === 1) { // single finger -> orbit
            const dx = e.touches[0].clientX - this.lastTouchX;
            const dy = e.touches[0].clientY - this.lastTouchY;
            this.lastTouchX = e.touches[0].clientX;
            this.lastTouchY = e.touches[0].clientY;
            this.orbit(-dx * 0.005, -dy * 0.005);

        } else if (e.touches.length === 2) { // two fingers -> pan + zoom
            
            // compute center movement for panning
            const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            this.pan(cx - this.lastTouchX, cy - this.lastTouchY);
            this.lastTouchX = cx;
            this.lastTouchY = cy;

            // compute distance change for pinch zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            this.zoom((this.lastTouchDist - dist) * 10); // scale for touch zoom
            this.lastTouchDist = dist;
        }
    }
}

@Injectable()
export class WebGLEngineAdapter extends EngineFacade {

    
    private readonly mobileThreshold = 768; // px

    private gl!: WebGL2RenderingContext;
    private canvas!: HTMLCanvasElement;
    private clear = { r: 0, g: 0, b: 0, a: 0 };
    
    private resourceManager = new ResourceManager();
    private shader!: ShaderResource;

    private rootNode = new Node();

    private cameraEntity = new Camera();
    private cameraNode = new Node();
    private cameraController!: CameraController;

    private lightEntity = new Light();
    private lightNode = new Node();
    
    private wrappers = new Set<WebGlRenderableObject>();  // ⚠️ VER SI HACE FALTA
    
    // ⚠️ DE MOMENTO NO HACEN FALTA
    private highlightedObjects: WebGlRenderableObject[] = [];
    private controlsEnabled = false;
    private controlsAutoRotate = false;
    private controlsAutoRotateSpeed = 2;
    
    private ready = false;

    // INIT
    
    async init(canvas: HTMLCanvasElement, width: number, height: number): Promise<void>  {

        // gl 
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2')!;
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.CULL_FACE); // ⚠️ CAMBIAR EN FUTURO! -> ARREGLAR TABLERO DEL .BLENDER
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
        
        this.cameraController = new CameraController(
            this.cameraNode,
            this.cameraEntity,
            canvas,
            width < this.mobileThreshold
        );

        await this.initShader();

        this.ready = true;
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

    // CAMERA

    setCameraProps(position: Vector3, target: Vector3): void {
        this.cameraController.setCameraProps(position, target);
    }

    // ⚠️ NO SE LLEGA A USAR NUNCA!
    updateControls(): void {
        // this.cameraController.updateOrbit();     
    }

    resetControls(): void { 
        this.cameraController.reset(); 
    }

    checkControlsState(): boolean { 
        if (!this.cameraController) {
            console.warn('Camera controller not yet initialized');
            return false;
        }
        return this.cameraController.hasMovedFromDefault(); 
    }

    toggleControls(enable: boolean): void {
        enable  ?  this.cameraController.initListeners()   // o exponer enable/disable
                :  this.cameraController.dispose();
    }

    setControlsAutoRotateSpeed(speed: number): void {

    }

    getCamera(): CameraState {
        return {
            position: this.cameraController.getCameraPosition(),
            target: this.cameraController.getTarget(),
            viewMatrix: this.cameraController.getViewMatrix(),
            projectionMatrix: this.cameraController.getProjectionMatrix(),
            mode: 'orbit',
            orbit: this.cameraController.getOrbitState()
        };
    }
    
    // RENDER 

    render(): void {
        if (!this.ready) return;
        this.gl.clearColor(this.clear.r, this.clear.g, this.clear.b, this.clear.a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.shader.use();

        // ⚠️NO SE SI HACE FALTA HACER ESTO AQUI! 
        // Sincronizar la posición de la cámara en el shader para el cálculo especular
        //const camPos = this.cameraController.getCameraPosition();
        //this.shader.setVec3("uViewPosition", vec3.fromValues(camPos.x, camPos.y, camPos.z));

        this.rootNode.traverse(this.shader);

        this.updateControls();
    }

    // DISPOSE

    dispose(): void {
        if (this.cameraController) {this.cameraController.dispose();} 
        this.wrappers.clear();
        this.ready = false;
        // ...resto cleanup...
    }

    // OBJECT MANAGEMENT

    async loadGLTF(url: string): Promise<RenderableObject> {
    
        const meshResource = await this.resourceManager.getResource(
            url, 
            () => new MeshResource(url, this.gl)
        );

        const modelNode = new Node();
        const namedMeshes = meshResource.getNamedMeshes();
        
        // meshResource.getMeshes().forEach(mesh => {
        //     const meshNode = new Node();
        //     meshNode.setEntity(mesh);
        //     modelNode.addChild(meshNode);
        // });

        // using namedMeshes instead (does it work??)
        namedMeshes.forEach(namedMesh => {
            const meshNode = new Node();
            meshNode.setEntity(namedMesh.mesh);
            meshNode.setName(namedMesh.name);
            modelNode.addChild(meshNode);
        });

        console.log('[WEBGL] Modelo cargado desde URL:', url);
        return this.wrapNativeObject(modelNode);
    }

    wrapNativeObject(native: any): RenderableObject {
        if (!(native instanceof Node)) {
            throw new Error("Object is not a WebGl valid Node.");
        }
        return new WebGlRenderableObject(native);
    }
    
    // ⚠️ FALTA POR HACER
    createArrowHelper(dir: Vector3, origin: Vector3, length: number, color: number | string): RenderableObject {
        const node = new Node();
        const wrapper = new WebGlRenderableObject(node);
        return wrapper;
    }
    
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
    
    // INTERACTION

    // ⚠️ FALTA POR HACER
    raycast(_x: number, _y: number): RenderableObject | null {
        return null;
    }

    // ⚠️ FALTA POR HACER (metodo de alvaro) 
    // ⚠️ CAMBIAR! -> debería ser Mesh quien guarde isHighlighted y highlightColor??
    setHighlight(objects: RenderableObject[]): void {
        // const cyan = vec3.fromValues(0, 1, 1);

        // this.wrappers.forEach(w => w.node.isHighlighted = false);

        // objects.forEach(o => {
        //     if (!o) return;
        //     const w = o as WebGlRenderableObject;

        //     const highlightSubtree = (n: Node | null) => {
        //         if (!n) return;
        //         n.isHighlighted = true;
        //         n.highlightColor = cyan;
        //         const children: Node[] = (n as any).children || [];
        //         children.forEach(highlightSubtree);
        //     };

        //     highlightSubtree(w.node);
        // });
    }

    rotateCamera(axis: 'x' | 'y' | 'z', angleDegrees: number): void {

    }

    // ------------------------------------------

    // metodo que no sé si hará falta o no.
    // private applyAutoRotation(): void {
    //     // Incrementally rotate the scene based on controlsAutoRotateSpeed
    //     const rotationDelta = (this.controlsAutoRotateSpeed * 0.016) * 0.01; // 0.016 ~ 60fps
    //     this.cameraNode.rotate(0, rotationDelta, 0);
    // }


}
