
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface RenderableObject {
    uuid: string;
    setPosition(x: number, y: number, z: number): void;
    setRotation(x: number, y: number, z: number): void;
    setVisible(visible: boolean): void;
    add(child: RenderableObject): void;
    remove(child: RenderableObject): void;
    getPosition(): Vector3;
    lookAt(target: Vector3): void;
    userData: any;
    castShadow: boolean;
    receiveShadow: boolean;
    nativeObject: any; // Escape hatch for specific checks if absolutely needed, though try to avoid
}

export interface GeometryConfig {
    type: 'box' | 'cylinder' | 'plane';
    args: number[]; // e.g. [width, height, depth] or [radiusTop, radiusBottom, height, radialSegments]
}

export interface MaterialConfig {
    type: 'standard' | 'basic';
    color: number | string;
    roughness?: number;
    metalness?: number;
}

export interface CameraState {
    position: Vector3;
    target: Vector3;
    viewMatrix: Float32Array;
    projectionMatrix: Float32Array;
    mode: 'orbit' | 'free';
    orbit?: {
        radius: number;
        theta: number;
        phi: number;
    };
}

// Abstract class allows us to use it as a Token for DI directly, simpler than InjectionToken
export abstract class EngineFacade {
    abstract init(canvas: HTMLCanvasElement, width: number, height: number): void;
    abstract resize(width: number, height: number): void;
    abstract render(): void;

    // Object Creation
    abstract createMesh(geometry: GeometryConfig, material: MaterialConfig): RenderableObject;
    abstract createGroup(): RenderableObject;
    abstract createArrowHelper(dir: Vector3, origin: Vector3, length: number, color: number | string): RenderableObject;

    // Scene Management
    abstract addToScene(object: RenderableObject): void;
    abstract removeFromScene(object: RenderableObject): void;
    abstract setBackground(color: number | string | null): void; // null for transparent

    // Camera & Controls
    abstract setCameraProps(position: Vector3, target: Vector3): void;
    abstract updateControls(): void;
    abstract toggleControls(enable: boolean, autoRotate: boolean): void;
    abstract setControlsAutoRotateSpeed(speed: number): void;
    abstract resetControls(): void;

    // Interaction
    abstract raycast(x: number, y: number): RenderableObject | null; // x, y are normalized device coordinates (-1 to +1)
    abstract setHighlight(objects: RenderableObject[]): void;

    abstract checkControlsState(): boolean; // Returns true if moved from initial state

    // Camera getter for internal calculations if needed (e.g. projecting 3d to 2d)
    //abstract getCamera(): any;
    abstract getCamera(): CameraState;

    // LoadGLTF
    abstract loadGLTF(url: string): Promise<RenderableObject>;

    // Wrap native (THREE.Object3D) into a RenderableObject (needed for GLTF sub-parts)
    abstract wrapNativeObject(native: any): RenderableObject;

    abstract dispose(): void;
}
