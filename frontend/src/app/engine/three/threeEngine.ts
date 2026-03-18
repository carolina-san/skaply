import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { CameraState, EngineFacade, GeometryConfig, MaterialConfig, RenderableObject, Vector3 } from '../interfaces';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class ThreeRenderableObject implements RenderableObject {
    constructor(private threeObject: THREE.Object3D) {
        this.threeObject.userData['wrapper'] = this;
    }

    get uuid(): string {
        return this.threeObject.uuid;
    }

    get nativeObject(): THREE.Object3D {
        return this.threeObject;
    }

    get castShadow(): boolean {
        return this.threeObject.castShadow;
    }

    set castShadow(v: boolean) {
        this.threeObject.castShadow = v;
    }

    get receiveShadow(): boolean {
        return this.threeObject.receiveShadow;
    }

    set receiveShadow(v: boolean) {
        this.threeObject.receiveShadow = v;
    }

    setPosition(x: number, y: number, z: number): void {
        this.threeObject.position.set(x, y, z);
    }

    setRotation(x: number, y: number, z: number): void {
        this.threeObject.rotation.set(x, y, z);
    }

    setScale(x: number, y: number, z: number): void {
        this.threeObject.scale.set(x, y, z);
    }

    setVisible(visible: boolean): void {
        this.threeObject.visible = visible;
    }

    setOpacity(value: number): void {
        this.threeObject.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
                const materials = Array.isArray(child.material)
                    ? child.material
                    : [child.material];

                materials.forEach(mat => {
                    mat.transparent = value < 1.0;
                    mat.opacity = value;
                });
            }
        });
    }

    add(child: RenderableObject): void {
        if (child.nativeObject instanceof THREE.Object3D) {
            this.threeObject.add(child.nativeObject);
        }
        // deberia de ser cast explícito en lugar de insatanceof

        // const threeChild = child as ThreeRenderableObject;
        // this.threeObject.add(threeChild.nativeObject);
    }

    remove(child: RenderableObject): void {
        if (child.nativeObject instanceof THREE.Object3D) {
            this.threeObject.remove(child.nativeObject);
        }
        // deberia de ser cast explícito en lugar de insatanceof
    }

    getPosition(): Vector3 {
        return {
            x: this.threeObject.position.x,
            y: this.threeObject.position.y,
            z: this.threeObject.position.z
        };
    }

    lookAt(target: Vector3): void {
        this.threeObject.lookAt(target.x, target.y, target.z);
    }

    get userData(): any {
        return this.threeObject.userData;
    }

    set userData(data: any) {
        this.threeObject.userData = { ...this.threeObject.userData, ...data };
    }
}

@Injectable()
export class ThreeEngineAdapter extends EngineFacade {
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private renderer!: THREE.WebGLRenderer;
    private controls!: OrbitControls;
    private composer!: EffectComposer;
    private outlinePass!: OutlinePass;
    private raycaster = new THREE.Raycaster();
    private gltfLoader = new GLTFLoader(); //3D model 

    private gltfCache: Map<string, THREE.Object3D> = new Map();

    // Smooth transition state
    private targetPosition = new THREE.Vector3();
    private targetLookAt = new THREE.Vector3();
    private isTransitioning = false;
    private lerpFactor = 0.1; // Adjust for speed/smoothness

    init(canvas: HTMLCanvasElement, width: number, height: number): void {
        this.scene = new THREE.Scene();

        // Lighting setup (could be configurable, but keeping default for now)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(8, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
        this.scene.add(hemisphereLight);

        this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        // En móvil (pantalla pequeña), alejar más la cámara para que el mueble se vea más pequeño
        const isMobile = width < 768;
        const cameraDistance = isMobile ? 2.5 : 2;
        this.camera.position.set(2.5, 2.5, cameraDistance);

        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.2;
        this.controls.minDistance = 0.5;
        this.controls.maxDistance = 15;
        this.controls.target.set(0, 1, 0);
        this.controls.saveState();

        // Initialize targets with starting state
        this.targetPosition.copy(this.camera.position);
        this.targetLookAt.copy(this.controls.target);

        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        this.outlinePass = new OutlinePass(new THREE.Vector2(width, height), this.scene, this.camera);
        this.outlinePass.edgeStrength = 5;
        this.outlinePass.edgeGlow = 0.5;
        this.outlinePass.edgeThickness = 1;
        this.outlinePass.visibleEdgeColor.set('#00ffff');
        this.outlinePass.hiddenEdgeColor.set('#00ffff');
        this.composer.addPass(this.outlinePass);
    }

    resize(width: number, height: number): void {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);
        this.outlinePass.resolution.set(width, height);
    }

    render(): void {
        if (this.isTransitioning) {
            // Lerp camera position
            this.camera.position.lerp(this.targetPosition, this.lerpFactor);
            // Lerp controls target (lookAt)
            this.controls.target.lerp(this.targetLookAt, this.lerpFactor);
            this.controls.update();

            // Check if we've arrived
            if (this.camera.position.distanceTo(this.targetPosition) < 0.001 &&
                this.controls.target.distanceTo(this.targetLookAt) < 0.001) {
                this.camera.position.copy(this.targetPosition);
                this.controls.target.copy(this.targetLookAt);
                this.controls.update();
                this.isTransitioning = false;
            }
        } else {
            this.controls?.update();
        }
        this.composer?.render();
    }


    async createArrowHelper(dir: Vector3, origin: Vector3, length: number, color: number | string): Promise<RenderableObject> {
        // const arrow = new THREE.ArrowHelper(
        //     new THREE.Vector3(dir.x, dir.y, dir.z),
        //     new THREE.Vector3(origin.x, origin.y, origin.z),
        //     length,
        //     new THREE.Color(color)
        // );
        // return new ThreeRenderableObject(arrow);

        const arrow = await this.loadGLTF('storage/flecha.glb');

        arrow.setPosition(origin.x, origin.y, origin.z);
        arrow.setScale(length, length, length);

        this.setArrowRotationFromDir(arrow, dir);

        return arrow;
    }

    private setArrowRotationFromDir(arrow: RenderableObject, dir: {x:number,y:number,z:number}) {
        arrow.setRotation(0,0,0);
        if      (dir.x === 1)   {arrow.setRotation(0,0,-Math.PI / 2);}
        else if (dir.x === -1)  {arrow.setRotation(0,0, Math.PI / 2);}
        else if (dir.y === -1)  {arrow.setRotation(Math.PI,0,0);}
        else if (dir.z === 1)   {arrow.setRotation(Math.PI / 2,0,0);}
        else if (dir.z === -1)  {arrow.setRotation(-Math.PI / 2,0,0);}
    }

    addToScene(object: RenderableObject): void {
        if (object.nativeObject instanceof THREE.Object3D) {
            this.scene.add(object.nativeObject);
        }
        // deberia de ser cast explícito en lugar de insatanceof
    }

    removeFromScene(object: RenderableObject): void {
        if (object.nativeObject instanceof THREE.Object3D) {
            this.scene.remove(object.nativeObject);
        }
        // deberia de ser cast explícito en lugar de insatanceof
    }

    setBackground(color: number | string | null): void {
        if (color === null) {
            this.scene.background = null;
        } else {
            this.scene.background = new THREE.Color(color);
        }
    }

    setCameraProps(position: Vector3, target: Vector3): void {
        this.targetPosition.set(position.x, position.y, position.z);
        this.targetLookAt.set(target.x, target.y, target.z);
        this.isTransitioning = true;
    }

    rotateCamera(axis: 'x' | 'y' | 'z', angleDegrees: number): void {
        if (!this.camera || !this.controls) return;

        // Calculate the target position starting from the DEFAULT (reset) position
        // to ensure deterministic rotations.
        const c: any = this.controls;
        const basePosition = c.position0 ? new THREE.Vector3(c.position0.x, c.position0.y, c.position0.z) : this.camera.position.clone();
        const baseTarget = c.target0 ? new THREE.Vector3(c.target0.x, c.target0.y, c.target0.z) : this.controls.target.clone();

        const offset = new THREE.Vector3().subVectors(basePosition, baseTarget);

        const rotationAxis = new THREE.Vector3();
        if (axis === 'x') rotationAxis.set(1, 0, 0);
        else if (axis === 'y') rotationAxis.set(0, 1, 0);
        else if (axis === 'z') rotationAxis.set(0, 0, 1);

        const angleRadians = angleDegrees * (Math.PI / 180);
        offset.applyAxisAngle(rotationAxis, angleRadians);

        this.targetPosition.copy(baseTarget).add(offset);
        this.targetLookAt.copy(baseTarget);
        this.isTransitioning = true;
    }

    updateControls(): void {
        this.controls.update();
    }

    toggleControls(enable: boolean, autoRotate: boolean): void {
        this.controls.enabled = enable;
        this.controls.autoRotate = autoRotate;
    }

    setControlsAutoRotateSpeed(speed: number): void {
        this.controls.autoRotateSpeed = speed;
    }

    resetControls(): void {
        const c: any = this.controls;
        if (c.position0 && c.target0) {
            this.targetPosition.set(c.position0.x, c.position0.y, c.position0.z);
            this.targetLookAt.set(c.target0.x, c.target0.y, c.target0.z);
            this.isTransitioning = true;
        } else {
            this.controls.reset();
        }
    }

    raycast(x: number, y: number): RenderableObject | null {
        // x and y are NDC (-1 to 1)
        this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
        // We need to raycast against everything in the scene that is a mesh ideally, or everything.
        // For performance, we might want to restrict this, but for now we iterate scene children.
        // A better approach would be to maintain a list of interactables in the facade, but 
        // passing scene.children is the generic way.
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            // Traverse up to find the wrapper if it exists (usually logic is outside, but here we return the hit)
            // If we want to return the top-level RenderableObject that the user created (ie the Group or Mesh), we might need to search up.
            let obj = intersects[0].object;
            // We might want to find the object that has 'wrapper' in userData?
            // Or just return the leaf mesh wrapped.
            // Let's try to find the root-most object that has a wrapper, or the mesh itself.

            // However, standard Object3D might not be wrapped if created internally (like parts of helper).
            // But createMesh/createGroup wraps them.

            // Simple approach: find object with userData['wrapper']
            let curr: THREE.Object3D | null = obj;
            while (curr) {
                if (curr.userData && curr.userData['wrapper']) {
                    return curr.userData['wrapper'];
                }
                curr = curr.parent;
            }
            // If no wrapper on the fathers queue, wrap the object impacted(GLTF submesh)
            return this.wrapNativeObject(intersects[0].object);
        }
        return null;
    }

    setHighlight(objects: RenderableObject[]): void {
        const threeObjects = objects.map(o => o.nativeObject);
        this.outlinePass.selectedObjects = threeObjects;
    }

    checkControlsState(): boolean {
        if (!this.controls) return false;
        // OrbitControls doesn't expose 'position0' etc publicly in types usually, but they exist on the instance if saveState() was called.
        // We can check manually against saved state if we needed, OR:
        // OrbitControls has .getDistance(), .getPolarAngle(), .getAzimuthalAngle()
        // But simply:
        // We know we saveState() at init.
        // We can compare with internal cache if accessible, or just assume if it matches target 0,0,0 etc.
        // Actually, let's use a simpler heuristic or just access the props if casted to 'any' since we know they are there in standard three OrbitControls.

        const c: any = this.controls;
        const threshold = 0.01;
        // position0, target0, zoom0 are created by saveState()
        if (c.position0 && c.target0) {
            const distPos = this.controls.object.position.distanceTo(c.position0);
            const distTarget = this.controls.target.distanceTo(c.target0);
            const distZoom = Math.abs(this.camera.zoom - c.zoom0);
            return distPos > threshold || distTarget > threshold || distZoom > threshold;
        }
        return false;
    }

    // getCamera(): any {
    //     return this.camera;
    // }

    getCamera(): CameraState {
        return {
            position: {
                x: this.camera.position.x,
                y: this.camera.position.y,
                z: this.camera.position.z
            },
            target: {
                x: this.controls.target.x,
                y: this.controls.target.y,
                z: this.controls.target.z
            },
            viewMatrix: new Float32Array(this.camera.matrixWorldInverse.elements),
            projectionMatrix: new Float32Array(this.camera.projectionMatrix.elements),
            mode: 'orbit',
            orbit: {
                radius: this.controls.getDistance(),
                theta: this.controls.getAzimuthalAngle(),
                phi: this.controls.getPolarAngle()
            }
        };
    }

    // Load the file GLT
    async loadGLTF(url: string): Promise<RenderableObject> {
        // const gltf = await new Promise<any>((resolve, reject) => {
        //     this.gltfLoader.load(url, resolve, undefined, reject);
        // });

        // const root = gltf.scene as THREE.Object3D;
        // return new ThreeRenderableObject(root);



        if (this.gltfCache.has(url)) {
            const cached = this.gltfCache.get(url)!;
            const clone = cached.clone(true); // deep clone
            return new ThreeRenderableObject(clone);
        }

        const gltf = await new Promise<any>((resolve, reject) => {
            this.gltfLoader.load(url, resolve, undefined, reject);
        });

        const root = gltf.scene as THREE.Object3D;

        this.gltfCache.set(url, root);

        const clone = root.clone(true);

        return new ThreeRenderableObject(clone);
    }

    wrapNativeObject(native: any): RenderableObject {
        // cache: avoid creating wrappers repeatedly
        if (native?.userData?.['wrapper']) return native.userData['wrapper'];
        return new ThreeRenderableObject(native as THREE.Object3D);
    }


    dispose(): void {
        this.renderer?.dispose();
        this.scene?.traverse((object: any) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach((material: any) => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        // Dispose controls etc if needed
        this.controls?.dispose();
    }
}
