import { Injectable } from '@angular/core';
import { CameraState, EngineFacade, GeometryConfig, MaterialConfig, RenderableObject, Vector3 } from '../interfaces';
import { ResourceManager } from '../../engine/webgl/resource/resource-manager';
import { MeshResource } from '../../engine/webgl/resource/mesh-resource';
import { Node } from '../../engine/webgl/engine-core/node';
import { ShaderResource } from '../../engine/webgl/resource/shader-resource';
import { mat4, vec3 } from 'gl-matrix';
import { Camera } from './engine-core/camera';
import { Light } from './engine-core/light';
import { Mesh } from './engine-core/mesh';
import { Entity } from './engine-core/entity';
import { OutlinePass } from './outline-pass';
import { rotate } from 'three/src/nodes/TSL.js';


class WebGlRenderableObject implements RenderableObject {

    uuid = crypto.randomUUID();
    userData: any = {};
    castShadow = false;
    receiveShadow = false;

    constructor(public node: Node) { }

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

    getRotation(): Vector3 {
        const t = this.node.getRotation();
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

    setScale(x: number, y: number, z: number): void {
        //this.rotation = { x, y, z };
        this.node.setScale(x, y, z);
    }

    setVisible(visible: boolean): void {
        this.node.setVisible(visible);
    }

    setOpacity(value: number): void {
        this.collectMeshesAndApply(this.node, mesh => mesh.setOpacity(value));
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

    private collectMeshesAndApply(node: Node, fn: (mesh: Mesh) => void): void {
        const entity = node.getEntity();
        if (entity instanceof Mesh) fn(entity);
        const children = node.getChildren();
        if (children) children.forEach(child => this.collectMeshesAndApply(child, fn));
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
        this.theta = isMobile ? 0.785 : 0.896;
        this.phi = isMobile ? 1.17 : 1.132;
        this.target = vec3.fromValues(0, 1, 0);

        // save default state for reset and checkState
        this.defaultRadius = this.radius;
        this.defaultTheta = this.theta;
        this.defaultPhi = this.phi;
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
        this.phi += deltaPhi;

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
        this.theta = this.defaultTheta;
        this.phi = this.defaultPhi;
        vec3.copy(this.target, this.defaultTarget);
        this.updateOrbit();
    }

    hasMovedFromDefault(): boolean {

        // compare current eye and target to default values
        const eye = this.computeEye();
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
        this.radius = Math.min(this.maxRadius, Math.max(this.minRadius, computedRadius));
        const safeRadius = Math.max(this.radius, 0.00001); // avoid division by zero
        this.radius = Math.max(0.001, Math.sqrt(dx * dx + dy * dy + dz * dz));
        this.theta = Math.atan2(dx, dz);
        this.phi = Math.acos(Math.max(-1, Math.min(1, dy / safeRadius)));
        this.phi = this.normalizePhi(this.phi); // avoid gimbal lock

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

    private isDragging = false;   // for mouse and touch
    private lastMouseX = 0;       // for mouse orbit/pan
    private lastMouseY = 0;       // for mouse orbit/pan
    private lastTouchX = 0;       // for touch orbit/pan
    private lastTouchY = 0;       // for touch orbit/pan
    private lastTouchDist = 0;      // for touch zoom

    // bind event handlers to preserve 'this' context
    private _onMouseDown = (e: MouseEvent) => this.onMouseDown(e);
    private _onMouseMove = (e: MouseEvent) => this.onMouseMove(e);
    private _onMouseUp = (_: MouseEvent) => { this.isDragging = false; };
    private _onWheel = (e: WheelEvent) => { e.preventDefault(); this.zoom(e.deltaY); };
    private _onContextMenu = (e: Event) => { e.preventDefault(); e.stopPropagation(); };
    private _onTouchStart = (e: TouchEvent) => this.onTouchStart(e);
    private _onTouchMove = (e: TouchEvent) => this.onTouchMove(e);
    private _onTouchEnd = (e: TouchEvent) => { if (e.touches.length === 0) this.isDragging = false; };

    // add event listeners to canvas and window
    initListeners(): void {
        this.canvas.addEventListener('mousedown', this._onMouseDown);
        this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
        this.canvas.addEventListener('contextmenu', this._onContextMenu);
        this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this._onTouchEnd);
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseup', this._onMouseUp);
    }

    // remove event listeners (cleanup)
    private removeListeners(): void {
        this.canvas.removeEventListener('mousedown', this._onMouseDown);
        this.canvas.removeEventListener('wheel', this._onWheel);
        this.canvas.removeEventListener('contextmenu', this._onContextMenu);
        this.canvas.removeEventListener('touchstart', this._onTouchStart);
        this.canvas.removeEventListener('touchmove', this._onTouchMove);
        this.canvas.removeEventListener('touchend', this._onTouchEnd);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup', this._onMouseUp);
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
            this.lastTouchDist = Math.sqrt(dx * dx + dy * dy);

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
            const dist = Math.sqrt(dx * dx + dy * dy);
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
    private outlineShader!: ShaderResource;
    private outlinePass!: OutlinePass;

    private rootNode = new Node();

    private cameraEntity = new Camera();
    private cameraNode = new Node();
    private cameraController!: CameraController;

    private lightEntity = new Light();
    private lightNode = new Node();

    private wrappers = new Set<WebGlRenderableObject>();  // ⚠️ VER SI HACE FALTA

    private highlightedNodes: Set<Node> = new Set();

    // Variales para la rotación entre pasos para hacerlo smooth
    private transitionTargetPosition: Vector3 | null = null;// A donde va la camara
    private transitionTargetLookAt: Vector3 | null = null; // Hacia donde vamoh a mirar en la transición!
    private isTransitioning = false;  // Si hay una rotación en curso
    private transitionLerpFactor = 0.1; //Suavizado
    private defaultCameraPosition: Vector3 | null = null;
    private defaultCameraTarget: Vector3 | null = null;

    // ⚠️ DE MOMENTO NO HACEN FALTA
    private controlsEnabled = false;
    private controlsAutoRotate = false;
    private controlsAutoRotateSpeed = 2;

    private ready = false;

    // INIT

    async init(canvas: HTMLCanvasElement, width: number, height: number): Promise<void> {

        // gl 
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2', { stencil: true })!;
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.CULL_FACE); // ⚠️ CAMBIAR EN FUTURO! -> ARREGLAR TABLERO DEL .BLENDER
        this.resize(width, height);

        this.outlinePass = new OutlinePass(this.gl);
        await this.outlinePass.init(width, height);

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

        // Variables para la rotacion de pasos de cámara
        const initialCamera = this.getCamera();
        this.defaultCameraPosition = { ...initialCamera.position };
        this.defaultCameraTarget = { ...initialCamera.target };

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

        this.outlinePass?.resize(width, height);
    }

    // CAMERA

    setCameraProps(position: Vector3, target: Vector3): void {
        this.cameraController.setCameraProps(position, target);
    }

    // ⚠️  Ya se usa con las variables de rotateCamera()
    updateControls(): void {
        if (                                // Hay una transación activa? Hay posicion destino? Hay target?
        this.isTransitioning &&
        this.transitionTargetPosition &&
        this.transitionTargetLookAt
        ) {
            const cam = this.getCamera();  //Coge la camara y calcula la siguiente posición con el vector y la acerca un poco 

            const nextPosition: Vector3 = {
                x: cam.position.x + (this.transitionTargetPosition.x - cam.position.x) * this.transitionLerpFactor,
                y: cam.position.y + (this.transitionTargetPosition.y - cam.position.y) * this.transitionLerpFactor,
                z: cam.position.z + (this.transitionTargetPosition.z - cam.position.z) * this.transitionLerpFactor
            };

            const nextTarget: Vector3 = {
                x: cam.target.x + (this.transitionTargetLookAt.x - cam.target.x) * this.transitionLerpFactor,
                y: cam.target.y + (this.transitionTargetLookAt.y - cam.target.y) * this.transitionLerpFactor,
                z: cam.target.z + (this.transitionTargetLookAt.z - cam.target.z) * this.transitionLerpFactor
            };

            this.cameraController.setCameraProps(nextPosition, nextTarget);

            const dx = this.transitionTargetPosition.x - nextPosition.x;  // Aqui calcula cuanto le falta en cada eje para llegar a la posición de destino
            const dy = this.transitionTargetPosition.y - nextPosition.y;
            const dz = this.transitionTargetPosition.z - nextPosition.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);  // Calcula la distancia real (3D) entre actual y destino
             if (distance < 0.001) {
                this.cameraController.setCameraProps(   //Coloca la camara en el destino
                    this.transitionTargetPosition,
                    this.transitionTargetLookAt
                );
                this.isTransitioning = false;  //Marca que ha terminado y ya no entrará en el bloque
            }

            return;
        }  
    }

    resetControls(): void {
        //this.cameraController.reset();

         if (!this.defaultCameraPosition || !this.defaultCameraTarget) { // Comprueba si está guardada la cámara por defecto
        this.cameraController.reset();
        return;
        }

        this.transitionTargetPosition = {
            ...this.defaultCameraPosition // Se vuelve a usar el spread para optimizar el código
        };

        this.transitionTargetLookAt = {
            ...this.defaultCameraTarget
        };

        this.isTransitioning = true;

    }

    checkControlsState(): boolean {
        if (!this.cameraController) {
            console.warn('Camera controller not yet initialized');
            return false;
        }
        return this.cameraController.hasMovedFromDefault();
    }

    toggleControls(enable: boolean, autoRotate: boolean): void { 
        enable ? this.cameraController.initListeners()   // o exponer enable/disable
            : this.cameraController.dispose();
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
        const gl = this.gl;

        // Asegurar que estamos en el canvas principal
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(this.clear.r, this.clear.g, this.clear.b, this.clear.a);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.disable(gl.CULL_FACE); // ⚠️

        // shader normal
        this.shader.use();
        this.rootNode.traverse(this.shader);

        // outline
        if (this.highlightedNodes.size > 0) {
            const cam = this.getCamera();

            const meshesWithMatrix = Array.from(this.highlightedNodes)
                .map(node => {
                    const mesh = node.getEntity() as Mesh;
                    const modelMatrix = node.getLastModelMatrix(); // ← desde Node
                    return mesh ? { mesh, modelMatrix } : null;
                })
                .filter(Boolean) as { mesh: Mesh, modelMatrix: mat4 }[];

            if (meshesWithMatrix.length > 0) {
                this.outlinePass.renderMask(meshesWithMatrix, cam.viewMatrix, cam.projectionMatrix);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.viewport(0, 0, this.canvas.width, this.canvas.height);
                this.outlinePass.drawEdges([0, 1, 1], 2.0);
                gl.enable(gl.DEPTH_TEST);
                gl.disable(gl.BLEND);
            }
        }

        this.updateControls();
    }

    // DISPOSE

    dispose(): void {
        if (this.cameraController) { this.cameraController.dispose(); }
        this.wrappers.clear();
        this.ready = false;
        // ...resto cleanup...
    }

    // Helper para unir Bounds y crea una caja que las cubre todas

    private computeCombinedBounds(meshes: Mesh[]): { min: vec3; max: vec3 } | null {
        if (meshes.length === 0) return null;

        const firstMin = meshes[0].resource.boundsMin;
        const firstMax = meshes[0].resource.boundsMax;

        const min = vec3.fromValues(firstMin[0], firstMin[1], firstMin[2]);
        const max = vec3.fromValues(firstMax[0], firstMax[1], firstMax[2]);

        for (let i = 1; i < meshes.length; i++) {
            const meshMin = meshes[i].resource.boundsMin;
            const meshMax = meshes[i].resource.boundsMax;

            min[0] = Math.min(min[0], meshMin[0]);
            min[1] = Math.min(min[1], meshMin[1]);
            min[2] = Math.min(min[2], meshMin[2]);

            max[0] = Math.max(max[0], meshMax[0]);
            max[1] = Math.max(max[1], meshMax[1]);
            max[2] = Math.max(max[2], meshMax[2]);
        }

        return { min, max };
    }

    // OBJECT MANAGEMENT

    async loadGLTF(url: string): Promise<RenderableObject> {

        const meshResource = await this.resourceManager.getResource(
            url,
            () => new MeshResource(url, this.gl)
        );

        const namedMeshes = meshResource.getNamedMeshes();

        // only one primitive (one texture)
        if (namedMeshes.length === 1) {
            const meshNode = new Node();
            meshNode.setEntity(namedMeshes[0].mesh);
            meshNode.setName(namedMeshes[0].name);

            // Para las bounding boxes con una primitiva
            const singleMin = namedMeshes[0].mesh.resource.boundsMin;
            const singleMax = namedMeshes[0].mesh.resource.boundsMax;
            meshNode.setPickBounds(
                vec3.fromValues(singleMin[0], singleMin[1], singleMin[2]),
                vec3.fromValues(singleMax[0], singleMax[1], singleMax[2])
            );

            return this.wrapNativeObject(meshNode);
        }
        
        // multiple primitives (diferent textures) 
        else {
            const modelNode = new Node();
            namedMeshes.forEach(namedMesh => {
                const meshNode = new Node();
                meshNode.setEntity(namedMesh.mesh);
                meshNode.setName(namedMesh.name);
                modelNode.addChild(meshNode);
            });

            // Caso de multiples primitivas bounding boxes
            const bounds = this.computeCombinedBounds(namedMeshes.map(namedMesh => namedMesh.mesh));
            if (bounds) {
                modelNode.setPickBounds(bounds.min, bounds.max);
            }

            return this.wrapNativeObject(modelNode);
        }
    }

    wrapNativeObject(native: any): RenderableObject {
        if (!(native instanceof Node)) {
            throw new Error("Object is not a WebGl valid Node.");
        }
        return new WebGlRenderableObject(native);
    }

    private setArrowRotationFromDir(arrow: RenderableObject, dir: { x: number, y: number, z: number }) {
        arrow.setRotation(0, 0, 0);
        if (dir.x === 1) { arrow.setRotation(0, 0, -Math.PI / 2); }
        else if (dir.x === -1) { arrow.setRotation(0, 0, Math.PI / 2); }
        else if (dir.y === -1) { arrow.setRotation(Math.PI, 0, 0); }
        else if (dir.z === 1) { arrow.setRotation(Math.PI / 2, 0, 0); }
        else if (dir.z === -1) { arrow.setRotation(-Math.PI / 2, 0, 0); }
    }

    async createArrowHelper(dir: Vector3, origin: Vector3, length: number): Promise<RenderableObject> {
        const arrow = await this.loadGLTF('storage/flecha.glb');
        arrow.setPosition(origin.x, origin.y, origin.z);
        arrow.setScale(length, length, length);
        this.setArrowRotationFromDir(arrow, dir);
        return arrow;
    }

    private createArrowMesh(arrowLenght: number): Mesh {

        const segments = 12;
        const cilinderRadius = arrowLenght * 0.02;
        const coneRadius = arrowLenght * 0.05;

        //    .                  -|
        //   /_\   cone 25%       |
        //    |                   |
        //    |                   |  arrowLenght
        //    |    cilinder 75%   |
        //    |                  -|

        const coneLength = arrowLenght * 0.25;
        const cilinderLength = arrowLenght - coneLength;

        const verts: number[] = []; // [x,y,z, x,y,z, x,y,z ...]
        const inds: number[] = [];

        for (let i = 0; i < segments; i++) {

            // CILINDER VERTICES
            const point = this.getCirclePoint(i, segments, cilinderRadius);
            verts.push(point.x, 0, point.z); // bottom ring
            verts.push(point.x, cilinderLength, point.z); // top ring

            //        top ring
            //       2──4──6──8               y = cilinderLength
            //  (0)  │  │  │  │  (2phirad)                         
            //       1──3──5──7               y = 0
            //       bottom ring

            // CILINDER INDEX
            const next = (i + 1) % segments;
            const botomIndex = i * 2;
            const topIndex = i * 2 + 1;
            const botomNextIndex = next * 2;
            const topNextIndex = next * 2 + 1;
            inds.push(botomIndex, topIndex, botomNextIndex);    // a
            inds.push(topIndex, topNextIndex, botomNextIndex);  // b

            //     topIndex  ●──●  topNextIndex
            //               │\b│
            //               │a\│ 
            //  bottomIndex  ●──●  botomNextIndex
        }

        const coneStartIndex = verts.length / 3;
        const tipIndex = verts.length / 3;
        verts.push(0, arrowLenght, 0);

        for (let i = 0; i < segments; i++) {

            // CONE VERTICES
            const point = this.getCirclePoint(i, segments, coneRadius);
            verts.push(point.x, cilinderLength, point.z);

            // CONE INDEX
            const next = (i + 1) % segments;
            inds.push(coneStartIndex + i, coneStartIndex + next, tipIndex);

            //              tipIndex  ●
            //                       / \
            //                      /   \
            //  coneStartIndex + i ●─────● coneStartIndex + next
        }

        const mesh = new Mesh({
            vertices: new Float32Array(verts),
            normals: new Float32Array(verts.length),
            texCoords: new Float32Array(0),
            indices: new Uint32Array(inds),
            // Bounding Boxes
            boundsMin: new Float32Array([0, 0, 0]),
            boundsMax: new Float32Array([0, 0, 0])
        }, this.gl);

        return mesh;

    }

    private getCirclePoint(iteration: number, totalSegments: number, radius: number) {
        const progress = iteration / totalSegments;
        const fullCircleRadians = Math.PI * 2;
        const angle = progress * fullCircleRadians;

        //                z
        //                ●
        //            ●       ●
        //          ●           ●
        //  x <-   ●      Y      ●  -> x
        //          ●           ●
        //            ●       ●
        //                ●
        //                z

        return {
            x: Math.cos(angle) * radius,
            z: Math.sin(angle) * radius
        };
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

    private buildWorldRayFromNdc(x: number, y: number): { origin: vec3; direction: vec3 } {
        const view = this.cameraController.getViewMatrix() as mat4;
        const projection = this.cameraController.getProjectionMatrix() as mat4;

        const viewProjection = mat4.create();
        mat4.multiply(viewProjection, projection, view);

        const inverseViewProjection = mat4.create();
        mat4.invert(inverseViewProjection, viewProjection);

        const nearPoint = vec3.fromValues(x, y, -1);
        const farPoint = vec3.fromValues(x, y, 1);

        const nearWorld = vec3.transformMat4(vec3.create(), nearPoint, inverseViewProjection);
        const farWorld = vec3.transformMat4(vec3.create(), farPoint, inverseViewProjection);

        const direction = vec3.create();
        vec3.sub(direction, farWorld, nearWorld);
        vec3.normalize(direction, direction);

        return {
            origin: nearWorld,
            direction
        };
    }

    private intersectRayAabbLocal(
        origin: vec3,
        direction: vec3,
        min: vec3,
        max: vec3
    ): number | null {
        const EPSILON = 1e-8;

        let tMin = -Infinity;
        let tMax = Infinity;

        for (let axis = 0; axis < 3; axis++) {
            const o = origin[axis];
            const d = direction[axis];
            const minVal = min[axis];
            const maxVal = max[axis];

            if (Math.abs(d) < EPSILON) {
                if (o < minVal || o > maxVal) {
                    return null;
                }
                continue;
            }

            let t1 = (minVal - o) / d;
            let t2 = (maxVal - o) / d;

            if (t1 > t2) {
                const temp = t1;
                t1 = t2;
                t2 = temp;
            }

            tMin = Math.max(tMin, t1);
            tMax = Math.min(tMax, t2);

            if (tMin > tMax) {
                return null;
            }
        }

        if (tMax < 0) {
            return null;
        }

        return tMin >= 0 ? tMin : tMax;
    }

   private transformRayToLocalSpace(
        origin: vec3,
        direction: vec3,
        worldMatrix: mat4
    ): { origin: vec3; direction: vec3 } | null {
        const inverseWorld = mat4.create();

        if (!mat4.invert(inverseWorld, worldMatrix)) {
            return null;
        }

        const localOrigin = vec3.transformMat4(vec3.create(), origin, inverseWorld);

        const worldTarget = vec3.create();
        vec3.add(worldTarget, origin, direction);

        const localTarget = vec3.transformMat4(vec3.create(), worldTarget, inverseWorld);

        const localDirection = vec3.create();
        vec3.sub(localDirection, localTarget, localOrigin);
        vec3.normalize(localDirection, localDirection);

        return {
            origin: localOrigin,
            direction: localDirection
        };
    }

    private getPickableRootNodes(): readonly Node[] {
        return this.rootNode
            .getChildren()
            .filter(node => node.isVisible() && node.getPickBounds() !== null);
    }

    raycast(x: number, y: number): RenderableObject | null {

        if (!this.ready) return null;
        
        const ray = this.buildWorldRayFromNdc(x, y);
        const pickableNodes = this.getPickableRootNodes();

        let bestNode: Node | null = null;
        let bestHit = Infinity;

        for (const node of pickableNodes) {
            const bounds = node.getPickBounds();
            if (!bounds) continue;

            const localRay = this.transformRayToLocalSpace(
                ray.origin,
                ray.direction,
                node.getTransformMatrix()
            );

            if (!localRay) continue;

            const hit = this.intersectRayAabbLocal(
                localRay.origin,
                localRay.direction,
                bounds.min,
                bounds.max
            );

            if (hit !== null && hit < bestHit) {
                bestHit = hit;
                bestNode = node;
            }
        }

        if (bestNode) {
            //console.log('picked node', bestNode.getName(), bestHit);
            return this.wrapNativeObject(bestNode);
        }

        return null;
    }

    setHighlight(objects: RenderableObject[]): void {
        
        // clear prevous highlights
        for (const node of this.highlightedNodes) {
            node.setIsHighlighted(false);
        }
        this.highlightedNodes.clear();

        for (const obj of objects) {
            const webglObject = obj as WebGlRenderableObject;
            this.collectNodesFromNode(webglObject.nativeObject as Node);
        }

        // highlight nodes
        for (const node of this.highlightedNodes) {
            node.setIsHighlighted(true);
        }
    }

    private collectNodesFromNode(node: Node): void {
        if (!node.isVisible()) return;
        
        if (node.getEntity() instanceof Mesh) {
            this.highlightedNodes.add(node);
        }
        const children = node.getChildren();
        if (children) {
            children.forEach(child => this.collectNodesFromNode(child));
        }
    }

    rotateCamera(axis: 'x' | 'y' | 'z', angleDegrees: number): void {
        const cam = this.getCamera();

        const position = vec3.fromValues(  //Convertimos la posición actual a un vector de gl-matrix para que lo pueda interpretar la librería
            cam.position.x,
            cam.position.y,
            cam.position.z
        );

        const target = vec3.fromValues(
            cam.target.x,
            cam.target.y,
            cam.target.z
        );

        const rotatedPosition = vec3.create(); // Para guardar la posición final
        const angleRadians = angleDegrees * (Math.PI/180); //La libreria solo trabaja en radianes, convertimos grados a radianes

        if (axis === 'x') { //Elige el eje de giro
            vec3.rotateX(rotatedPosition, position, target, angleRadians);
        } else if (axis === 'y') {
            vec3.rotateY(rotatedPosition, position, target, angleRadians);
        } else if (axis === 'z') {
            vec3.rotateZ(rotatedPosition, position, target, angleRadians);
        }

        // this.cameraController.setCameraProps( //Nueva posición de la camara:
        //     {
        //         x: rotatedPosition[0],
        //         y: rotatedPosition[1],
        //         z: rotatedPosition[2]
        //     },
        //     cam.target
        // );

        this.transitionTargetPosition = { // Ahora guarda la posición en lugar de moverlo directamente para luego pasar a updatecontorls.
            x: rotatedPosition[0],
            y: rotatedPosition[1],
            z: rotatedPosition[2]
        };

        this.transitionTargetLookAt = {
            ...cam.target // Esto es el operador spread de objetos y equivale a mandarle todas las posiciones de target (x, y, z)
        };

        this.isTransitioning = true;
    }

    // ------------------------------------------

    // metodo que no sé si hará falta o no.
    // private applyAutoRotation(): void {
    //     // Incrementally rotate the scene based on controlsAutoRotateSpeed
    //     const rotationDelta = (this.controlsAutoRotateSpeed * 0.016) * 0.01; // 0.016 ~ 60fps
    //     this.cameraNode.rotate(0, rotationDelta, 0);
    // }


}
