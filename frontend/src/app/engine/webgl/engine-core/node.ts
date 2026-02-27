import { mat4, vec3 } from 'gl-matrix';
import { Entity } from './entity';
import { Mesh } from './mesh';
import { ShaderResource } from '../resource/shader-resource';

export class Node {

    // entity and nodes
    private entity: Entity | null = null;
    private children: Node[] = [];
    private parent: Node | null = null;

    // local transformations
    private translation: vec3 = vec3.create(); // local position
    private rotation: vec3 = vec3.create(); // local rotation (radians: pitch, yaw, roll)
    private scale: vec3 = vec3.fromValues(1, 1, 1); // local scale

    // final transformation (parent x node)
    private transformMatrix: mat4 = mat4.create();

    // only if local transformations were made
    private needsUpdate: boolean = true;

    // visibility
    private visible: boolean = true;

    // materials / effects
    public isHighlighted: boolean = false;
    public highlightColor: vec3 = vec3.fromValues(0, 1, 1);
    public isUnlit: boolean = false;
    public unlitColor: vec3 = vec3.fromValues(0, 1, 1);


    // CHILDREN MANAGEMENT

    addChild(child: Node): void {
        child.parent = this;
        this.children.push(child);
    }

    removeChild(child: Node): void {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
        }
    }

    // SETTERS

    setEntity(entity: Entity): void {
        this.entity = entity;
    }

    setTranslation(x: number, y: number, z: number): void {
        vec3.set(this.translation, x, y, z);
        this.needsUpdate = true;
    }

    setRotation(x: number, y: number, z: number): void {
        vec3.set(this.rotation, x, y, z);
        this.needsUpdate = true;
    }

    setScale(x: number, y: number, z: number): void {
        vec3.set(this.scale, x, y, z);
        this.needsUpdate = true;
    }

    setTransformMatrix(matrix: mat4): void {
        mat4.copy(this.transformMatrix, matrix);
        this.needsUpdate = false;
    }

    // Visibility
    setVisible(v: boolean): void {
        this.visible = v;
    }

    // GETTERS

    getEntity(): Entity | null {
        return this.entity;
    }

    getParent(): Node | null {
        return this.parent;
    }

    getTranslation(): vec3 {
        return this.translation;
    }

    getRotation(): vec3 {
        return this.rotation;
    }

    getScale(): vec3 {
        return this.scale;
    }

    getTransformMatrix(): mat4 {
        return this.transformMatrix;
    }

    // VISIBILITY
    isVisible(): boolean {
        return this.visible;
    }

    // LOCAL MATRIX (PRIVATE)

    private computeLocalMatrix(): mat4 {
        const matrix = mat4.create();
        mat4.translate(matrix, matrix, this.translation);
        mat4.rotateX(matrix, matrix, this.rotation[0]);
        mat4.rotateY(matrix, matrix, this.rotation[1]);
        mat4.rotateZ(matrix, matrix, this.rotation[2]);
        mat4.scale(matrix, matrix, this.scale);
        return matrix;
    }

    // TRAVERSAL (RECORRER ARBOL Y DIBUJAR)

    traverse(parentMatrix: mat4, shader: ShaderResource): void {

        if (!this.visible) return;

        // always update transform matrix based on parent
        // (localMatrix can be cached if !needsUpdate, but composition must happen)
        const localMatrix = this.computeLocalMatrix();
        mat4.multiply(this.transformMatrix, parentMatrix, localMatrix);

        // needsUpdate flag is only for local property changes, 
        // but since we computeLocalMatrix every time (or we could cache it),
        // let's just mark it clean.
        this.needsUpdate = false;

        // draw entity 
        if (this.entity) {
            shader.setFloat('uHighlight', this.isHighlighted ? 1.0 : 0.0);
            shader.setVec3('uHighlightColor', this.highlightColor);
            shader.setFloat('uIsUnlit', this.isUnlit ? 1.0 : 0.0);
            shader.setVec3('uUnlitColor', this.unlitColor);
            this.entity.draw(this.transformMatrix, shader);
        }

        // recursive
        for (const child of this.children) {
            child.traverse(this.transformMatrix, shader);
        }
    }

    // RELATIVE TRANSFORMATIONS 

    traslate(dx: number, dy: number, dz: number): void {
        vec3.add(this.translation, this.translation, vec3.fromValues(dx, dy, dz));
        this.needsUpdate = true;
    }

    rotate(dx: number, dy: number, dz: number): void {
        vec3.add(this.rotation, this.rotation, vec3.fromValues(dx, dy, dz));
        this.needsUpdate = true;
    }

    scaleNode(sx: number, sy: number, sz: number): void {
        this.scale[0] *= sx;
        this.scale[1] *= sy;
        this.scale[2] *= sz;
        this.needsUpdate = true;
    }

}