// IMPORTANTE: esto es un borrador, o bien lo empezamos a hacer limpio desde 0 o lo revisamos todo bien.


import { Injectable } from '@angular/core';
import { EngineFacade, RenderableObject, Vector3, GeometryConfig, MaterialConfig } from '../interfaces';
import { Node } from './engine-core/node';
import { Entity } from './engine-core/entity';
import { Mesh, MeshResource } from './engine-core/mesh';
import { mat4, vec3 } from 'gl-matrix';

@Injectable()
export class WebGLEngineAdapter extends EngineFacade {

    private canvas!: HTMLCanvasElement; // canvas donde se renderiza
    private gl!: WebGL2RenderingContext; // contexto de WebGL2

    private sceneRoot!: Node; // nodo raiz
    private cameraNode!: Node; // nodo de la camara 
    private cameraEntity!: Entity; // entidad de la camara
    private renderables: RenderableObject[] = []; // rederizables

    // ! -> inicializado más tarde

    init(canvas: HTMLCanvasElement, width: number, height: number): void {
        this.canvas = canvas;
        const gl = canvas.getContext('webgl2');
        if (!gl) throw new Error('WebGL2 not supported');
        this.gl = gl;

        // configuracion inicial
        gl.viewport(0, 0, width, height); // area de renderizado
        gl.clearColor(0.1, 0.1, 0.1, 1); // color de fondo
        gl.enable(gl.DEPTH_TEST); // profundidad (objetos cercanos tapan)

        // nodo raiz
        this.sceneRoot = new Node();

        // nodo de la camara
        this.cameraNode = new Node();
        // TODO: create a Camera entity later if needed
        this.sceneRoot.addChild(this.cameraNode);
    }

    resize(width: number, height: number): void {
        this.gl.viewport(0, 0, width, height);
    }

    // bucle
    render(): void {
        const gl = this.gl;

        // limpiar pantalla, tanto color como buffer de profundidad
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 

        // recorrer el arbol empezando en nodo raiz
        this.sceneRoot.traverse(mat4.create()); // nodo raiz no tiene transf
        
        // solicitar el siguiente frame (se llama constantemente)
        requestAnimationFrame(() => this.render());
    }

    createMesh(
        geometry: GeometryConfig, //datos de los vetices y triangulos
        material: MaterialConfig) // material (color, textura)
        : RenderableObject {
        
        // TODO: create buffers, VAO, etc.
        const gl = this.gl;

        const positions = new Float32Array([ /* define vertices */ ]);
        const indices = new Uint16Array([ /* define triangles */ ]);

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao); // hace que los buffers se registren en el VAO

        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        const ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        const resource: MeshResource = {
            vao: vao!,
            indexCount: indices.length
        };

        const meshEntity = new Mesh(resource, gl);

        // Wrap as RenderableObject (minimal adapter)
        const wrapper: RenderableObject = {
            uuid: crypto.randomUUID(),
            nativeObject: meshEntity,
            castShadow: false,
            receiveShadow: false,
            setPosition: (x, y, z) => { /* TODO */ },
            setRotation: (x, y, z) => { /* TODO */ },
            setVisible: (v) => { /* TODO */ },
            add: (c) => { /* TODO */ },
            remove: (c) => { /* TODO */ },
            getPosition: () => ({ x:0,y:0,z:0 }),
            lookAt: (t) => {},
            userData: {},
        };

        this.renderables.push(wrapper);
        return wrapper;
    }

    createGroup(): RenderableObject {
        const node = new Node();
        const wrapper: RenderableObject = {
            uuid: crypto.randomUUID(),
            nativeObject: node,
            castShadow: false,
            receiveShadow: false,
            setPosition: (x,y,z)=>{},
            setRotation: (x,y,z)=>{},
            setVisible: (v)=>{},
            add: (c)=>{},
            remove: (c)=>{},
            getPosition: ()=>({x:0,y:0,z:0}),
            lookAt: (t)=>{},
            userData: {}
        };
        return wrapper;
    }

    createArrowHelper(dir: Vector3, origin: Vector3, length: number, color: number | string): RenderableObject {
        // TODO: implement as simple mesh if needed
        return this.createGroup();
    }

    
    addToScene(object: RenderableObject): void {
        if (object.nativeObject instanceof Node) {
            this.sceneRoot.addChild(object.nativeObject);
        }
    }

    removeFromScene(object: RenderableObject): void {
        // TODO: implement remove from parent
    }

    setBackground(color: number | string | null): void {
        if (color === null) this.gl.clearColor(0,0,0,0);
        else {
            // Convert number or string to rgb
            this.gl.clearColor(0.1,0.1,0.1,1);
        }
    }

    
    setCameraProps(position: Vector3, target: Vector3): void {
        // TODO: implement camera node transformation
    }

    updateControls(): void { }
    toggleControls(enable: boolean, autoRotate: boolean): void { }
    setControlsAutoRotateSpeed(speed: number): void { }
    resetControls(): void { }

    
    raycast(x: number, y: number): RenderableObject | null {
        // TODO: implement picking with raycasting
        return null;
    }

    setHighlight(objects: RenderableObject[]): void { }

    checkControlsState(): boolean { return false; }

    getCamera(): any { return this.cameraEntity; }

    loadGLTF(url: string): Promise<RenderableObject> {
        return Promise.reject('GLTF loading not implemented yet');
    }

    wrapNativeObject(native: any): RenderableObject {
        // TODO: wrap Node or Mesh entity
        return native;
    }

    dispose(): void {
        // TODO: delete VAOs, buffers, etc.
    }
}
