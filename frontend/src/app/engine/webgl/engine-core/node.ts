import { mat4, vec3 } from 'gl-matrix';
import { Entity } from './entity';
import { Light } from './light';
import { ShaderResource } from '../resource/shader-resource';
import { Frustum } from './frustum';

export class Node {

    private name: string = '';

    // entity and children
    private entity: Entity | null = null;
    private children: Node[] = [];
    private parent: Node | null = null;

    // local transformations
    private translation: vec3 = vec3.create();      // local position
    private rotation: vec3 = vec3.create();         // local rotation (euler)
    private scale: vec3 = vec3.fromValues(1, 1, 1); // local scale

    // world transformation (parent × local)
    private transformMatrix: mat4 = mat4.create();
    private lastModelMatrix: mat4 = mat4.create();

    private needsUpdate: boolean = true; // dirty flag — set when local transform changes

    private visible: boolean = true;
    private isHighlighted: boolean = false;

    // bounding box for picking
    private pickBounds: { min: vec3; max: vec3 } | null = null;


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
        this.setChildenUpdate();
    }

    setRotation(x: number, y: number, z: number): void {
        vec3.set(this.rotation, x, y, z);
        this.needsUpdate = true;
        this.setChildenUpdate();
    }

    setScale(x: number, y: number, z: number): void {
        vec3.set(this.scale, x, y, z);
        this.needsUpdate = true;
        this.setChildenUpdate();
    }

    setName(name: string): void {
        this.name = name;
    }

    setVisible(visible: boolean): void {
        this.visible = visible;
    }

    setIsHighlighted(value: boolean): void {
        this.isHighlighted = value;
    }

    setPickBounds(min: vec3, max: vec3): void {
        this.pickBounds = {
            min: vec3.clone(min),
            max: vec3.clone(max)
        };
    }

    private setChildenUpdate(): void {
        for (const child of this.children) {
            child.needsUpdate = true;
            child.setChildenUpdate();
        }
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
        if (this.needsUpdate) {
            this.updateTransforMatrix();
            this.needsUpdate = false;
        }
        return this.transformMatrix;
    }

    getLastModelMatrix(): mat4 {
        return this.lastModelMatrix;
    }

    getName(): string {
        return this.name;
    }

    getPickBounds(): { min: vec3; max: vec3 } | null {
        return this.pickBounds;
    }

    getChildren(): readonly Node[] {
        return this.children;
    }

    getIsHighlighted(): boolean {
        return this.isHighlighted;
    }

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

    private updateTransforMatrix(): void {
        let parentGlobalMatrix = mat4.create();
        if (this.parent) {
            parentGlobalMatrix = this.parent.getTransformMatrix();
        }
        const localMatrix = this.computeLocalMatrix();
        mat4.multiply(this.transformMatrix, parentGlobalMatrix, localMatrix);
    }

    // TRAVERSAL

    traverse(shader: ShaderResource, frustum?: Frustum): void {
        if (!this.visible) return;

        const worldMatrix = this.getTransformMatrix();
        this.lastModelMatrix = worldMatrix;

        // frustum culling — skip this node and its subtree if AABB is outside the view
        if (frustum && this.pickBounds) {
            const worldBounds = this.getWorldBounds(worldMatrix);
            if (!frustum.intersectsAABB(worldBounds.min, worldBounds.max)) return;
        }

        if (this.entity && !(this.entity instanceof Light)) {
            this.entity.draw(worldMatrix, shader);
        }

        for (const child of this.children) {
            child.traverse(shader, frustum);
        }
    }

    private getWorldBounds(worldMatrix: mat4): { min: vec3; max: vec3 } {
        const min = this.pickBounds!.min;
        const max = this.pickBounds!.max;

        // transform all 8 AABB corners to world space and recompute min/max
        const corners: vec3[] = [
            vec3.fromValues(min[0], min[1], min[2]),
            vec3.fromValues(max[0], min[1], min[2]),
            vec3.fromValues(min[0], max[1], min[2]),
            vec3.fromValues(max[0], max[1], min[2]),
            vec3.fromValues(min[0], min[1], max[2]),
            vec3.fromValues(max[0], min[1], max[2]),
            vec3.fromValues(min[0], max[1], max[2]),
            vec3.fromValues(max[0], max[1], max[2]),
        ];

        const worldMin = vec3.fromValues(Infinity, Infinity, Infinity);
        const worldMax = vec3.fromValues(-Infinity, -Infinity, -Infinity);

        for (const corner of corners) {
            vec3.transformMat4(corner, corner, worldMatrix);
            vec3.min(worldMin, worldMin, corner);
            vec3.max(worldMax, worldMax, corner);
        }

        return { min: worldMin, max: worldMax };
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

    // LIGHT COLLECTION

    collectLights(): { light: Light; worldMatrix: mat4 }[] {
        const result: { light: Light; worldMatrix: mat4 }[] = [];
        this.gatherLights(result);
        return result;
    }

    private gatherLights(result: { light: Light; worldMatrix: mat4 }[]): void {
        if (!this.visible) return;
        if (this.entity instanceof Light) {
            result.push({ light: this.entity, worldMatrix: this.getTransformMatrix() });
        }
        for (const child of this.children) {
            child.gatherLights(result);
        }
    }

    // GET NODE BY NAME

    getNodeByName(name: string): Node | null {
        if (this.name === name) return this;
        for (const child of this.children) {
            const found = child.getNodeByName(name);
            if (found) return found;
        }
        return null;
    }

    // TRAVERSAL WITH ENTITY CALLBACK

    traverseEntities(callback: (entity: Entity) => void): void {
        if (this.entity) {
            callback(this.entity);
        }
        for (const child of this.children) {
            child.traverseEntities(callback);
        }
    }
}
