import { EngineFacade, GeometryConfig, MaterialConfig, RenderableObject, Vector3 } from '../interfaces';
import { mat4, vec3 } from 'gl-matrix';

import { Node } from './engine-core/node';
import { Mesh } from './engine-core/mesh';
import { Camera } from './engine-core/camera';
import { Light } from './engine-core/light';

import { ResourceManager } from './resource/resource-manager';
import { MeshResource, NamedMesh } from './resource/mesh-resource';
import { ShaderResource } from './resource/shader-resource';

// --------- “NativeObject” compatible con el componente (Object3D-lite) ----------
class NativeLikeObject {
    name: string;
    parent: NativeLikeObject | null = null;
    children: NativeLikeObject[] = [];
    // guardamos el wrapper aquí para wrapNativeObject
    userData: any = {};

    constructor(name: string) {
        this.name = name;
    }

    add(child: NativeLikeObject) {
        child.parent = this;
        this.children.push(child);
    }

    traverse(cb: (o: NativeLikeObject) => void) {
        cb(this);
        for (const c of this.children) c.traverse(cb);
    }

    getObjectByName(name: string): NativeLikeObject | null {
        let found: NativeLikeObject | null = null;
        this.traverse(o => {
            if (!found && o.name === name) found = o;
        });
        return found;
    }

    getObjectNames(): string[] {
        const names: string[] = [];
        this.traverse(o => names.push(o.name));
        return names;
    }
}

// --------- Wrapper RenderableObject para Node ----------
class WebGlRenderableObject implements RenderableObject {
    uuid: string = crypto.randomUUID();
    userData: any = {};
    castShadow: boolean = false;
    receiveShadow: boolean = false;

    private visible = true;

    // “nativeObject” compatible con lo que espera GraphicsEngineComponent
    readonly nativeObject: NativeLikeObject;

    constructor(
        public readonly node: Node,
        native: NativeLikeObject
    ) {
        this.nativeObject = native;
        // referencia bidireccional
        this.nativeObject.userData.wrapper = this;
    }

    setPosition(x: number, y: number, z: number): void {
        this.node.setTranslation(x, y, z);
    }

    setRotation(x: number, y: number, z: number): void {
        this.node.setRotation(x, y, z);
    }

    getPosition(): Vector3 {
        const t = this.node.getTranslation(); // vec3
        return { x: t[0], y: t[1], z: t[2] };
    }

    setVisible(v: boolean): void {
        this.visible = v;
        // requiere el mini-parche de Node.ts (setVisible)
        // @ts-ignore
        if (typeof (this.node as any).setVisible === 'function') {
            // @ts-ignore
            (this.node as any).setVisible(v);
        }
        // también afecta al “native”
        this.nativeObject.traverse(o => (o.userData.__visible = v));
    }

    add(child: RenderableObject): void {
        const c = child as WebGlRenderableObject;
        this.node.addChild(c.node);
        this.nativeObject.add(c.nativeObject);
    }

    remove(child: RenderableObject): void {
        const c = child as WebGlRenderableObject;
        this.node.removeChild(c.node);
        // quitar de native tree
        this.nativeObject.children = this.nativeObject.children.filter(x => x !== c.nativeObject);
        c.nativeObject.parent = null;
    }

    lookAt(_target: Vector3): void {
        // No implementado a nivel de Node para el flujo actual
    }
}

// --------- WebGL Engine ----------
export class WebGLEngine extends EngineFacade {

    private canvas!: HTMLCanvasElement;
    private gl!: WebGL2RenderingContext;

    private resourceManager = new ResourceManager();
    private shader!: ShaderResource;

    // Scene graph root
    private rootNode = new Node();
    private rootNative = new NativeLikeObject('root');

    // Camera + Light
    private cameraEntity = new Camera();
    private cameraNode = new Node();
    private cameraNative = new NativeLikeObject('camera');

    private lightEntity = new Light();
    private lightNode = new Node();
    private lightNative = new NativeLikeObject('light');

    // background
    private clear = { r: 0, g: 0, b: 0, a: 0 };

    // wrappers registry
    private wrappers = new Set<WebGlRenderableObject>();

    private ready = false;

    init(canvas: HTMLCanvasElement, width: number, height: number): void {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2', { alpha: true, antialias: true })!;
        this.gl.enable(this.gl.DEPTH_TEST);

        this.resize(width, height);

        // montar cámara y luz como hijos del root (para que seteen uniforms antes)
        this.cameraNode.setEntity(this.cameraEntity);
        this.lightNode.setEntity(this.lightEntity);

        this.rootNode.addChild(this.cameraNode);
        this.rootNode.addChild(this.lightNode);

        this.rootNative.add(this.cameraNative);
        this.rootNative.add(this.lightNative);

        // cámara por defecto: sincronizada con las coordenadas esféricas iniciales
        const aspect = width / height;
        this.cameraEntity.setPerspective((45 * Math.PI) / 180, aspect, 0.1, 100);
        this.updateCameraOrbit(); // Esto setea lookAt(pos, target) basado en Radius/Theta/Phi iniciales

        // luz por defecto
        this.lightEntity.setIntensity(vec3.fromValues(1, 1, 1));
        this.lightNode.setTranslation(8, 10, 5);

        // init async shader
        this.initShader().then(() => {
            this.ready = true;
            this.initControls();
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

        // update camera aspect
        const aspect = width / height;
        this.cameraEntity.setPerspective((45 * Math.PI) / 180, aspect, 0.1, 100);
    }

    render(): void {
        if (!this.ready) return;

        // Limpiar con transparencia (importante para que no se vea el fondo blanco de la app)
        this.gl.clearColor(this.clear.r, this.clear.g, this.clear.b, this.clear.a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.shader.use();

        // uniforms que pide el fragment shader
        this.shader.setVec3('uViewPosition', this.cameraEntity.position);

        // recorrer árbol
        this.rootNode.traverse(mat4.create(), this.shader);
    }

    // ------------------ Creación de objetos ------------------

    createGroup(): RenderableObject {
        const n = new Node();
        const native = new NativeLikeObject(`group_${crypto.randomUUID()}`);
        const w = new WebGlRenderableObject(n, native);
        this.wrappers.add(w);
        return w;
    }

    createArrowHelper(_dir: Vector3, _origin: Vector3, _length: number, _color: number | string): RenderableObject {
        // Stub: un grupo vacío que NO dibuja nada (sirve para el flujo de UI)
        return this.createGroup();
    }

    createMesh(_geometry: GeometryConfig, _material: MaterialConfig): RenderableObject {
        // Método no utilizado actualmente. Retornamos un grupo vacío para cumplir la interfaz.
        return this.createGroup();
    }



    // ------------------ Scene management ------------------

    addToScene(object: RenderableObject): void {
        const o = object as WebGlRenderableObject;
        this.rootNode.addChild(o.node);
        this.rootNative.add(o.nativeObject);
        this.wrappers.add(o);
    }

    removeFromScene(object: RenderableObject): void {
        const o = object as WebGlRenderableObject;
        this.rootNode.removeChild(o.node);
        this.rootNative.children = this.rootNative.children.filter(c => c !== o.nativeObject);
        o.nativeObject.parent = null;
        this.wrappers.delete(o);
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

    // ------------------ Camera & controls ------------------

    // Mouse handlers state
    private isDragging = false;
    private lastMouseX = 0;
    private lastMouseY = 0;

    // Polar coordinates for Orbit
    // Init state: Radius ~3.84, Theta ~45deg, Phi ~67deg -> Position approx (2.5, 2.5, 2.5)
    private camRadius = 3.84;
    private camTheta = 0.785;
    private camPhi = 1.17;
    private camTarget = vec3.fromValues(0, 1, 0);

    // Default state for reset check (updated via updateCameraOrbit on init)
    // Default state for reset check (updated via updateCameraOrbit on init)
    private readonly defaultCamPos = vec3.create();
    private readonly defaultCamTarget = vec3.fromValues(0, 1, 0);
    private defaultCamRadius = 3.84;
    private defaultCamTheta = 0.785;
    private defaultCamPhi = 1.17;

    private _onMouseDown = this.onMouseDown.bind(this);
    private _onMouseMove = this.onMouseMove.bind(this);
    private _onMouseUp = this.onMouseUp.bind(this);
    private _onWheel = this.onWheel.bind(this);
    private _onContextMenu = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
    };
    // Touch handlers
    private _onTouchStart = this.onTouchStart.bind(this);
    private _onTouchMove = this.onTouchMove.bind(this);
    private _onTouchEnd = this.onTouchEnd.bind(this);

    rotateCamera(_axis: 'x' | 'y' | 'z', _angleDegrees: number): void {
        // No implementado en WebGL por ahora (funcionalidad específica de ThreeJS)
    }

    // Touch state
    private lastTouchX = 0;
    private lastTouchY = 0;
    private lastTouchDist = 0;

    setCameraProps(position: Vector3, target: Vector3): void {
        // Actualizamos la cámara interna
        this.cameraEntity.lookAt(
            vec3.fromValues(position.x, position.y, position.z),
            vec3.fromValues(target.x, target.y, target.z)
        );

        // Sincronizamos las variables de control (reverse engineering spherical coords)
        vec3.set(this.camTarget, target.x, target.y, target.z);

        const dx = position.x - target.x;
        const dy = position.y - target.y;
        const dz = position.z - target.z;

        this.camRadius = Math.sqrt(dx * dx + dy * dy + dz * dz);
        // Evitar division por 0 o radio negativo
        if (this.camRadius < 0.001) this.camRadius = 0.001;

        // Phi: ángulo respecto Y (0=arriba, PI=abajo)
        this.camPhi = Math.acos(Math.max(-1, Math.min(1, dy / this.camRadius)));
        // Theta: ángulo en XZ
        this.camTheta = Math.atan2(dx, dz);
    }

    private initControls() {
        if (!this.canvas) return;
        this.canvas.addEventListener('mousedown', this._onMouseDown);
        this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
        this.canvas.addEventListener('contextmenu', this._onContextMenu);
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseup', this._onMouseUp);

        // Touch listeners (passive: false to prevent scrolling)
        this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this._onTouchEnd);

        // Guardar la posición inicial calculada como "default" para el botón reset
        vec3.copy(this.defaultCamPos, this.cameraEntity.position);
        this.defaultCamRadius = this.camRadius;
        this.defaultCamTheta = this.camTheta;
        this.defaultCamPhi = this.camPhi;

        // FIX: Eliminamos el recálculo reverso de coordenadas esféricas aquí.
        // Como init() ya llamó a updateCameraOrbit() usando las variables camRadius/Theta/Phi,
        // estas variables YA SON la "source of truth" y están perfectamente sincronizadas.
    }

    private removeControls() {
        if (this.canvas) {
            this.canvas.removeEventListener('mousedown', this._onMouseDown);
            this.canvas.removeEventListener('wheel', this._onWheel);
            this.canvas.removeEventListener('contextmenu', this._onContextMenu);
            this.canvas.removeEventListener('touchstart', this._onTouchStart);
            this.canvas.removeEventListener('touchmove', this._onTouchMove);
            this.canvas.removeEventListener('touchend', this._onTouchEnd);
        }
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup', this._onMouseUp);
    }

    private onMouseDown(e: MouseEvent) {
        if (e.button === 0 || e.button === 2) { // Left or Right click
            // Prevent default behavior to avoid browser gestures (especially in Opera)
            if (e.button === 2) {
                e.preventDefault();
            }
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        }
    }

    private onMouseMove(e: MouseEvent) {
        if (!this.isDragging) return;

        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        // Velocidades
        const rotateSpeed = 0.005;
        const panSpeed = 0.002 * this.camRadius; // Scale pan speed with zoom

        if (e.buttons & 1) { // Left click: Orbit
            this.camTheta -= deltaX * rotateSpeed;
            this.camPhi -= deltaY * rotateSpeed;

            // Clamp Phi para no dar la vuelta completa (evitar gimbal lock visual y confusion)
            const epsilon = 0.01;
            this.camPhi = Math.max(epsilon, Math.min(Math.PI - epsilon, this.camPhi));

            this.updateCameraOrbit();
        } else if (e.buttons & 2) { // Right click: Pan
            this.performPan(deltaX, deltaY, panSpeed);
            this.updateCameraOrbit();
        }
    }

    // Helper for Panning (Shared by Mouse & Touch)
    private performPan(deltaX: number, deltaY: number, speed: number) {
        const forward = vec3.create();
        vec3.sub(forward, this.camTarget, this.cameraEntity.position);
        vec3.normalize(forward, forward);

        const right = vec3.create();
        vec3.cross(right, forward, [0, 1, 0]);
        vec3.normalize(right, right);

        const up = vec3.create();
        vec3.cross(up, right, forward);
        vec3.normalize(up, up);

        const panX = vec3.create();
        const panY = vec3.create();

        vec3.scale(panX, right, -deltaX * speed);
        vec3.scale(panY, up, deltaY * speed);

        vec3.add(this.camTarget, this.camTarget, panX);
        vec3.add(this.camTarget, this.camTarget, panY);
    }

    private onTouchStart(e: TouchEvent) {
        // 1 finger: Rotate. 2 fingers: Pan + Zoom
        if (e.touches.length === 1) {
            e.preventDefault();
            this.lastTouchX = e.touches[0].clientX;
            this.lastTouchY = e.touches[0].clientY;
            this.isDragging = true;
        } else if (e.touches.length === 2) {
            e.preventDefault();
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            // Midpoint for Pan
            this.lastTouchX = (t1.clientX + t2.clientX) / 2;
            this.lastTouchY = (t1.clientY + t2.clientY) / 2;

            // Distance for Zoom
            const dx = t1.clientX - t2.clientX;
            const dy = t1.clientY - t2.clientY;
            this.lastTouchDist = Math.sqrt(dx * dx + dy * dy);
            this.isDragging = true;
        }
    }

    private onTouchMove(e: TouchEvent) {
        e.preventDefault(); // Prevent scroll
        if (!this.isDragging) return;

        if (e.touches.length === 1) {
            // Rotate
            const x = e.touches[0].clientX;
            const y = e.touches[0].clientY;
            const deltaX = x - this.lastTouchX;
            const deltaY = y - this.lastTouchY;
            this.lastTouchX = x;
            this.lastTouchY = y;

            const rotateSpeed = 0.005;
            this.camTheta -= deltaX * rotateSpeed;
            this.camPhi -= deltaY * rotateSpeed;

            const epsilon = 0.01;
            this.camPhi = Math.max(epsilon, Math.min(Math.PI - epsilon, this.camPhi));
            this.updateCameraOrbit();

        } else if (e.touches.length === 2) {
            // Pan + Zoom
            const t1 = e.touches[0];
            const t2 = e.touches[1];

            // 1. Pan
            const curX = (t1.clientX + t2.clientX) / 2;
            const curY = (t1.clientY + t2.clientY) / 2;
            const deltaX = curX - this.lastTouchX;
            const deltaY = curY - this.lastTouchY;
            this.lastTouchX = curX;
            this.lastTouchY = curY;

            const panSpeed = 0.002 * this.camRadius;
            this.performPan(deltaX, deltaY, panSpeed);

            // 2. Zoom
            const dx = t1.clientX - t2.clientX;
            const dy = t1.clientY - t2.clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Difference in distance
            // pinch out (dist increases) -> zoom in (radius decreases)
            const zoomDelta = this.lastTouchDist - dist;
            this.lastTouchDist = dist;

            const zoomSpeed = 0.01 * this.camRadius;
            this.camRadius += zoomDelta * zoomSpeed;
            if (this.camRadius < 0.1) this.camRadius = 0.1;

            this.updateCameraOrbit();
        }
    }

    private onTouchEnd(e: TouchEvent) {
        if (e.touches.length === 0) {
            this.isDragging = false;
        } else if (e.touches.length === 1) {
            // Transition smoothly to single finger rotation
            this.lastTouchX = e.touches[0].clientX;
            this.lastTouchY = e.touches[0].clientY;
        }
    }

    private onMouseUp(_e: MouseEvent) {
        this.isDragging = false;
    }

    private onWheel(e: WheelEvent) {
        e.preventDefault();
        const zoomSpeed = 0.001 * this.camRadius;
        this.camRadius += e.deltaY * zoomSpeed;
        if (this.camRadius < 0.1) this.camRadius = 0.1;
        this.updateCameraOrbit();
    }

    private updateCameraOrbit() {
        const x = this.camRadius * Math.sin(this.camPhi) * Math.sin(this.camTheta);
        const y = this.camRadius * Math.cos(this.camPhi);
        const z = this.camRadius * Math.sin(this.camPhi) * Math.cos(this.camTheta);

        const eye = vec3.fromValues(
            this.camTarget[0] + x,
            this.camTarget[1] + y,
            this.camTarget[2] + z
        );

        this.cameraEntity.lookAt(eye, this.camTarget);
    }

    updateControls(): void {
        // Optional: inertia/damping could go here
    }

    toggleControls(enable: boolean, _autoRotate: boolean): void {
        if (enable) {
            this.initControls();
        } else {
            this.removeControls();
        }
    }
    setControlsAutoRotateSpeed(_speed: number): void { /* no-op */ }

    resetControls(): void {
        this.camRadius = this.defaultCamRadius;
        this.camTheta = this.defaultCamTheta;
        this.camPhi = this.defaultCamPhi;
        vec3.copy(this.camTarget, this.defaultCamTarget);
        this.updateCameraOrbit();
    }

    checkControlsState(): boolean {
        // Return true if camera is significantly different from default
        const pos = this.cameraEntity.position;
        const distPos = vec3.dist(pos, this.defaultCamPos);
        const distTarget = vec3.dist(this.camTarget, this.defaultCamTarget);

        return distPos > 0.1 || distTarget > 0.1;
    }

    getCamera(): any {
        // devolvemos algo compatible con el componente (usa .position)
        return { position: { x: this.cameraEntity.position[0], y: this.cameraEntity.position[1], z: this.cameraEntity.position[2] } };
    }

    // ------------------ Interaction (pendiente) ------------------

    raycast(_x: number, _y: number): RenderableObject | null {
        // En WebGL puro esto requiere picking (color buffer o ray/triangles).
        // Para que el flujo no rompa, devolvemos null.
        return null;
    }

    setHighlight(_objects: RenderableObject[]): void {
        // placeholder: sin outline pass en WebGL puro
    }

    // ------------------ Load model (Assimp) ------------------

    async loadGLTF(url: string): Promise<RenderableObject> {
        if (!this.gl) throw new Error('Engine not initialized');

        const res = await this.resourceManager.getResource(
            url,
            () => new MeshResource(url, this.gl)
        );

        const groupNode = new Node();
        const groupNative = new NativeLikeObject(`model_${crypto.randomUUID()}`);
        const groupWrapper = new WebGlRenderableObject(groupNode, groupNative);

        const namedMeshes = (res as any).getNamedMeshes
            ? (res as any).getNamedMeshes() as NamedMesh[]
            : (res as any).getMeshes().map((m: Mesh, i: number) => ({ name: `mesh_${i}`, mesh: m })) as NamedMesh[];

        // --- helper: normaliza nombres
        // "estante_1"    -> "estante_1"    (porque _1 es parte del nombre base implícito o no colisiona)
        // "estante_1_2"  -> "estante_1" 
        // "estante_2"    -> "estante_2"
        // "estante_2_2"  -> "estante_2"
        // "tablon_x"     -> "tablon_x"
        // "tablon_x_2"   -> "tablon_x"
        // 1. Create a Set of all raw names to check existence
        const allNames = new Set(namedMeshes.map(n => n.name));

        // --- helper: normaliza nombres usando heurística de existencia
        const normalizePieceName = (raw: string): string => {
            const name = String(raw ?? '').trim();
            // Regex: busca "_N" al final solo si N >= 2
            // O busca "_1" si es una copia (pero queremos respetar estante_1 como base, y estante_1_2 como copia).
            // Todo lo que termina en _2, _3, _4... es copia. Lo que termina en _1 a veces es base.
            // PERO: Si tengo estante_1 y estante_2, son bases distintas.
            // Si tengo estante_1_2, es copia de estante_1.

            // Simplemente quitamos "_\d+" AL FINAL, siempre que el número sea >= 2.
            // Así repetimos: estante_1 -> estante_1. estante_1_2 -> estante_1.
            // Regex que captura "nombre_base" + "_numero" (cualquier numero)
            const match = name.match(/^(.*)_(\d+)$/);
            if (match) {
                const potentialBase = match[1];

                // CASO 1: El padre existe (ej: estante_1_2 -> estante_1 existe)
                // Entonces _2 es una copa de estante_1
                if (allNames.has(potentialBase)) {
                    return potentialBase;
                }

                // CASO 2: El padre NO existe (ej: estante_1 -> estante NO existe)
                // Entonces _1 es parte del nombre base unico.
                // CASO 3: estante_2 -> estante NO existe.
                return name;
            }

            // Si no tiene sufijo numérico, es base (ej: patas)
            return name;
        };

        // Mapa: nombre base (BD) -> wrapper grupo
        const pieceGroups = new Map<string, WebGlRenderableObject>();

        for (const { name, mesh } of namedMeshes) {
            const baseName = normalizePieceName(name);

            // si no existe el grupo de esa pieza, lo creamos
            let pieceGroup = pieceGroups.get(baseName);
            if (!pieceGroup) {
                const pieceGroupNode = new Node();
                const pieceGroupNative = new NativeLikeObject(baseName); // nombre grupo limpio
                pieceGroup = new WebGlRenderableObject(pieceGroupNode, pieceGroupNative);

                // cada pieza grupo cuelga del modelo raíz
                groupWrapper.add(pieceGroup);
                this.wrappers.add(pieceGroup);
                pieceGroups.set(baseName, pieceGroup);
            }

            // este mesh concreto será un hijo interno del grupo (submesh)
            const subNode = new Node();
            subNode.setEntity(mesh);

            // Añadir sufijo '_mesh' para evitar duplicados en getObjectNames si el grupo se llama igual
            // Así getObjectByName buscara el grupo por defecto si usamos el nombre base.
            const subNative = new NativeLikeObject(name + '_mesh');
            const subWrapper = new WebGlRenderableObject(subNode, subNative);

            pieceGroup.add(subWrapper);
            this.wrappers.add(subWrapper);
        }

        // Debug opcional
        // console.log('[WebGL loadGLTF] groups:', [...pieceGroups.keys()]);

        return groupWrapper;
    }


    wrapNativeObject(native: any): RenderableObject {
        // si ya tiene wrapper, devolvemos el mismo
        if (native?.userData?.wrapper) return native.userData.wrapper as RenderableObject;

        // si alguien nos pasa un native suelto, intentamos crear wrapper “fake”
        // pero lo normal es que venga de getObjectByName() y ya tenga wrapper.
        const node = new Node();
        const n = native as NativeLikeObject;
        const w = new WebGlRenderableObject(node, n);
        this.wrappers.add(w);
        return w;
    }

    dispose(): void {
        this.removeControls();
        this.wrappers.clear();
        this.ready = false;
    }
}