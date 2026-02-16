import { Injectable, OnDestroy } from '@angular/core';
import { EngineFacade, GeometryConfig, MaterialConfig, RenderableObject, Vector3 } from '../interfaces';
import { mat4, vec3, quat } from 'gl-matrix';
import * as THREE from 'three';

// Custom Engine Core
import { Node } from './engine-core/node';
import { Mesh, MeshResource as CoreMeshResource } from './engine-core/mesh';
import { Camera } from './engine-core/camera';
import { ShaderResource } from './resource/shader-resource';

// Helper Wrapper for Custom Engine Nodes to conform to RenderableObject
class WebGLRenderableObject implements RenderableObject {
    constructor(public node: Node, private _uuid: string = crypto.randomUUID()) {
        (node as any).wrapper = this;
    }

    get uuid(): string { return this._uuid; }

    get nativeObject(): any { return this.node; } // Expose the internal Node

    setPosition(x: number, y: number, z: number): void {
        this.node.setTranslation(x, y, z);
    }
    getPosition(): Vector3 {
        // Node stores translation in a vec3
        const t = this.node.getTranslation();
        return { x: t[0], y: t[1], z: t[2] };
    }
    setRotation(x: number, y: number, z: number): void {
        this.node.setRotation(x, y, z);
    }
    setRotationQuat(x: number, y: number, z: number, w: number): void {
        // Node implementation currently uses Euler angles in setRotation. 
        // If we needed quat, we'd need to extend Node, but for now we approximate or ignore if not supported.
        // Actually, let's just convert quat to euler if we really needed it, but for standard assembly steps typically Position is key.
    }
    setVisible(visible: boolean): void {
        (this.node as any).visible = visible;
    }
    add(child: RenderableObject): void {
        if (child instanceof WebGLRenderableObject) {
            this.node.addChild(child.node);
        }
    }
    remove(child: RenderableObject): void {
        if (child instanceof WebGLRenderableObject) {
            this.node.removeChild(child.node);
        }
    }
    lookAt(target: Vector3): void {
        // Not implemented in Node, but could be added.
    }
    get userData(): any {
        return (this.node as any).userData || {};
    }
    set userData(data: any) {
        (this.node as any).userData = data;
    }
    // Shadow properties (mocked for now as custom engine shader might not support them yet)
    get castShadow(): boolean { return false; }
    set castShadow(val: boolean) { }
    get receiveShadow(): boolean { return false; }
    set receiveShadow(val: boolean) { }
}


@Injectable({
    providedIn: 'root'
})
export class WebGLEngine implements EngineFacade, OnDestroy {

    private canvas!: HTMLCanvasElement;
    private gl!: WebGL2RenderingContext;
    private shader!: ShaderResource;
    private rootNode!: Node;
    private camera!: Camera;

    // Controls
    private isDragging = false;
    private lastMouseX = 0;
    private lastMouseY = 0;
    // Spherical coordinates for simplified orbit controls
    private spherical = { radius: 10, theta: 0, phi: Math.PI / 3 };
    private target = vec3.fromValues(0, 0, 0);
    private controlsEnabled = true;
    private isAutoRotate = false;
    private autoRotateSpeed = 1.0;

    private resizeHandler: () => void;
    private animationFrameId: number | null = null; // Internal loop if needed, but Facade usually relies on component calling render()

    constructor() {
        console.log("WebGLEngine (Pure WebGL) Created");
        this.resizeHandler = () => this.onWindowResize();
    }

    init(canvas: HTMLCanvasElement, width: number, height: number): void {
        this.canvas = canvas;
        const gl = canvas.getContext('webgl2');
        if (!gl) throw new Error("WebGL2 not supported");
        this.gl = gl;

        // Configure GL
        gl.viewport(0, 0, width, height);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.clearColor(0.2, 0.2, 0.2, 1.0);

        // Initialize Resources
        this.shader = new ShaderResource(gl, "basic-shader");
        this.rootNode = new Node();

        // Initialize Camera
        this.camera = new Camera();
        this.camera.setPerspective(45, width / height, 0.1, 1000.0);
        this.updateCameraPosition();

        // Load Default Shaders (Embedded for simplicity or fetched)
        // We'll try to fetch the assets as per original structure
        Promise.all([
            this.shader.loadFile('assets/shaders/basic.vert', 'vertex'),
            this.shader.loadFile('assets/shaders/basic.frag', 'fragment')
        ]).then(() => {
            this.shader.buildProgram();
            console.log("WebGL Engine Initialized & Shaders Loaded");
        });

        this.setupInputListeners();
        window.addEventListener('resize', this.resizeHandler);
    }

    resize(width: number, height: number): void {
        if (!this.gl) return;
        this.gl.viewport(0, 0, width, height);
        if (this.camera) {
            this.camera.aspect = width / height;
            this.camera.setPerspective(this.camera.fov, width / height, this.camera.near, this.camera.far);
        }
    }

    render(): void {
        if (!this.gl || !this.shader['program']) return;

        // Auto Rotate
        if (this.controlsEnabled && this.isAutoRotate && !this.isDragging) {
            this.spherical.theta += 0.005 * this.autoRotateSpeed;
            this.updateCameraPosition();
        }

        // Clear
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.shader.use();

        // Global Uniforms
        this.shader.setVec3("uLightPosition", vec3.fromValues(10, 10, 10));
        this.shader.setVec3("uLightColor", vec3.fromValues(1, 1, 1));
        this.shader.setVec3("uViewPosition", this.camera.position);

        // Camera Uniforms
        this.camera.draw(mat4.create(), this.shader);

        // Scene Traversal
        // We manually inject the identity Matrix for world start
        const identity = mat4.create();
        this.rootNode.traverse(identity, this.shader);
    }

    setBackground(color: number | string | null): void {
        if (!this.gl) return;
        if (color === null) {
            this.gl.clearColor(0, 0, 0, 0); // Transparent
        } else {
            // Simple hex parsing or default
            let r = 0.2, g = 0.2, b = 0.2;
            if (typeof color === 'number') {
                r = ((color >> 16) & 255) / 255;
                g = ((color >> 8) & 255) / 255;
                b = (color & 255) / 255;
            }
            this.gl.clearColor(r, g, b, 1.0);
        }
    }

    addToScene(object: RenderableObject): void {
        if (object instanceof WebGLRenderableObject) {
            this.rootNode.addChild(object.node);
        }
    }

    removeFromScene(object: RenderableObject): void {
        if (object instanceof WebGLRenderableObject) {
            this.rootNode.removeChild(object.node);
        }
    }

    createMesh(geometry: GeometryConfig, material: MaterialConfig): RenderableObject {
        // Primitive generation (Box, etc.)
        // We'll create a simple procedural mesh here
        // This is a simplified fallback
        const meshData = this.createBoxGeometry(1, 1, 1);
        if (geometry.type === 'box' && geometry.args) {
            // Handle args geometry.args[0], etc.
            // Implemented simply as 1x1x1 for now or scaled via transform
        }

        const meshRes: CoreMeshResource = {
            vao: this.createVAO(meshData.vertices, meshData.indices, meshData.normals, meshData.uvs),
            indexCount: meshData.indices.length,
            indexType: this.gl.UNSIGNED_SHORT
        };

        const mesh = new Mesh(meshRes, this.gl);
        const node = new Node();
        node.setEntity(mesh);

        // Material color could be passed as Uniform if Mesh supported it, 
        // currently Mesh.ts uses textures mostly. 
        // We might need to update Shaders to support color uniform if texture is missing.

        return new WebGLRenderableObject(node);
    }

    createGroup(): RenderableObject {
        return new WebGLRenderableObject(new Node());
    }

    createArrowHelper(dir: Vector3, origin: Vector3, length: number, color: number | string): RenderableObject {
        // Placeholder or implement simple line drawing
        return new WebGLRenderableObject(new Node());
    }

    // --- GLTF LOADING via THREE.GLTFLoader (Parsing only) ---
    async loadGLTF(url: string): Promise<RenderableObject> {
        return new Promise((resolve, reject) => {

        });
    }

    private convertThreeToCustom(threeObj: THREE.Object3D): WebGLRenderableObject {
        const node = new Node();


        // Copy Transforms
        node.setTranslation(threeObj.position.x, threeObj.position.y, threeObj.position.z);
        // Rotation in Three is Euler, Node is also Euler-ish (vec3)
        node.setRotation(threeObj.rotation.x, threeObj.rotation.y, threeObj.rotation.z);
        node.setScale(threeObj.scale.x, threeObj.scale.y, threeObj.scale.z);

        // If Mesh, extract geometry
        if ((threeObj as THREE.Mesh).isMesh) {
            const mesh = threeObj as THREE.Mesh;
            const geo = mesh.geometry;

            const positionAttr = geo.getAttribute('position');
            const normalAttr = geo.getAttribute('normal');
            const uvAttr = geo.getAttribute('uv');
            const indexAttr = geo.getIndex();

            if (positionAttr) {
                const vertices = new Float32Array(positionAttr.array);
                const normals = normalAttr ? new Float32Array(normalAttr.array) : new Float32Array();
                const uvs = uvAttr ? new Float32Array(uvAttr.array) : new Float32Array();
                let indices: Uint16Array | Uint32Array;

                if (indexAttr) {
                    indices = new Uint16Array(indexAttr.array); // Assuming fit in 16bit for simplicity or check
                } else {
                    // Generate indices if none
                    const count = positionAttr.count;
                    indices = new Uint16Array(count);
                    for (let i = 0; i < count; i++) indices[i] = i;
                }

                const meshRes: CoreMeshResource = {
                    vao: this.createVAO(vertices, indices, normals, uvs),
                    indexCount: indices.length,
                    indexType: this.gl.UNSIGNED_SHORT
                };

                // Handle Texture if present in material (basic support)
                // const mat = mesh.material;
                // if(mat.map) ... load texture ...

                const customMesh = new Mesh(meshRes, this.gl);
                node.setEntity(customMesh);
            }
        }

        // Children
        for (const child of threeObj.children) {
            const customChild = this.convertThreeToCustom(child);
            node.addChild(customChild.node);
        }

        return new WebGLRenderableObject(node);
    }

    private createVAO(vertices: Float32Array, indices: Uint16Array | Uint32Array, normals: Float32Array, uvs: Float32Array): WebGLVertexArrayObject {
        const gl = this.gl;
        const vao = gl.createVertexArray()!;
        gl.bindVertexArray(vao);

        // Vertices
        const vbo = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        // Normals
        if (normals.length > 0) {
            const nbo = gl.createBuffer()!;
            gl.bindBuffer(gl.ARRAY_BUFFER, nbo);
            gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        }

        // UVs
        if (uvs.length > 0) {
            const tbo = gl.createBuffer()!;
            gl.bindBuffer(gl.ARRAY_BUFFER, tbo);
            gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
        }

        // Indices
        const ebo = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        gl.bindVertexArray(null);
        return vao;
    }


    // --- UTILS ---
    private createBoxGeometry(w: number, h: number, d: number) {
        // Simplified Box
        const x = w / 2, y = h / 2, z = d / 2;
        const vertices = new Float32Array([
            // Front
            -x, -y, z, x, -y, z, x, y, z, -x, y, z,
            // Back
            -x, -y, -z, -x, y, -z, x, y, -z, x, -y, -z,
            // Top
            -x, y, -z, -x, y, z, x, y, z, x, y, -z,
            // Bottom
            -x, -y, -z, x, -y, -z, x, -y, z, -x, -y, z,
            // Right
            x, -y, -z, x, y, -z, x, y, z, x, -y, z,
            // Left
            -x, -y, -z, -x, -y, z, -x, y, z, -x, y, -z,
        ]);

        const normals = new Float32Array([
            // Front
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
            // Back
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
            // Top
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
            // Bottom
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
            // Right
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
            // Left
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
        ]);

        const uvs = new Float32Array([
            0, 0, 1, 0, 1, 1, 0, 1,
            1, 0, 1, 1, 0, 1, 0, 0,
            0, 1, 0, 0, 1, 0, 1, 1,
            1, 1, 0, 1, 0, 0, 1, 0,
            1, 0, 1, 1, 0, 1, 0, 0,
            0, 0, 1, 0, 1, 1, 0, 1
        ]);

        const indices = new Uint16Array([
            0, 1, 2, 0, 2, 3,    // Front
            4, 5, 6, 4, 6, 7,    // Back
            8, 9, 10, 8, 10, 11,   // Top
            12, 13, 14, 12, 14, 15,   // Bottom
            16, 17, 18, 16, 18, 19,   // Right
            20, 21, 22, 20, 22, 23    // Left
        ]);
        return { vertices, normals, uvs, indices };
    }

    setCameraProps(position: Vector3, target: Vector3): void {
        const eye = vec3.fromValues(position.x, position.y, position.z);
        const center = vec3.fromValues(target.x, target.y, target.z);
        this.camera.lookAt(eye, center);

        // Update internals for Orbit
        // Convert Cartesian to Spherical for consistency if controls are active
        // But for now just creating manual view matrix is enough
    }

    updateControls(): void {
        // Handled in render if auto-rotate
    }

    toggleControls(enable: boolean, autoRotate: boolean): void {
        this.controlsEnabled = enable;
        this.isAutoRotate = autoRotate;
    }

    setControlsAutoRotateSpeed(speed: number): void {
        this.autoRotateSpeed = speed;
    }

    resetControls(): void {
        this.spherical = { radius: 10, theta: 0, phi: Math.PI / 3 };
        this.updateCameraPosition();
    }

    raycast(x: number, y: number): RenderableObject | null {
        // Not implemented in Pure WebGL yet (hard math)
        // Returning null allows app to run without crashing, just no click selection
        return null;
    }

    setHighlight(objects: RenderableObject[]): void {
        // Not implemented
    }

    checkControlsState(): boolean {
        return false;
    }

    getCamera(): any {
        return this.camera;
    }

    wrapNativeObject(native: any): RenderableObject {
        // In this engine, native is Node
        if (native instanceof Node) {
            return new WebGLRenderableObject(native);
        }
        throw new Error("Invalid native object");
    }

    dispose(): void {
        if (this.shader) this.shader.dispose();
        window.removeEventListener('resize', this.resizeHandler);
    }

    ngOnDestroy(): void {
        this.dispose();
    }

    private updateCameraPosition() {
        if (!this.camera) return;
        const s = this.spherical;

        const x = s.radius * Math.sin(s.phi) * Math.sin(s.theta);
        const y = s.radius * Math.cos(s.phi);
        const z = s.radius * Math.sin(s.phi) * Math.cos(s.theta);

        const eye = vec3.fromValues(x, y, z);
        this.camera.lookAt(eye, this.target);
    }

    // --- BASIC INPUT LISTENERS (No OrbitControls Lib) ---
    private setupInputListeners() {
        const cvs = this.canvas;
        cvs.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });
        window.addEventListener('mouseup', () => this.isDragging = false);
        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.controlsEnabled) return;
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;

            this.spherical.theta -= dx * 0.005;
            this.spherical.phi -= dy * 0.005;
            this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));
            this.updateCameraPosition();
        });
        cvs.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.spherical.radius += e.deltaY * 0.01;
            this.updateCameraPosition();
        });
    }

    private onWindowResize() {
        const w = this.canvas.parentElement?.clientWidth || window.innerWidth;
        const h = this.canvas.parentElement?.clientHeight || window.innerHeight;
        this.resize(w, h);
    }
}
