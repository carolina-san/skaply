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
    private translation: vec3 = vec3.create();      // local position
    private rotation: vec3 = vec3.create();         // local rotation
    private scale: vec3 = vec3.fromValues(1, 1, 1); // local scale

    // final transformation (parent x node)
    private transformMatrix: mat4 = mat4.create(); // world transformation (identity matrix by default)

    // only if local transformations were made
    private needsUpdate: boolean = true;
    private name: string = '';


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

    setName(name: string): void {
        this.name = name;
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

    getName(): string {
        return this.name;
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

    // duda de si 'parentUpdate' es la solucion limpia para actualizar la mtriz SI EL PADRE ha cambiado su matriz (antes no se contemplaba esto)

    traverse(parentMatrix: mat4, shader: ShaderResource, parentUpdated: boolean): void { 
        
        const mustUpdate = this.needsUpdate || parentUpdated;
        
        // create transform matrix
        if (mustUpdate) {
            const localMatrix = this.computeLocalMatrix();
            mat4.multiply(this.transformMatrix, parentMatrix, localMatrix); 
            this.needsUpdate = false;
        }

        // draw entity 
        if (this.entity) {
            //console.log('Node: Dibujando entidad', this.entity.constructor.name);
            this.entity.draw(this.transformMatrix, shader);
        }

        // recursive
        for (const child of this.children) {
            child.traverse(this.transformMatrix, shader, mustUpdate);
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

    // ⚠️ PRUEBA

    getObjectByName(name: string): Node | null {
        if (this.name === name) return this;
        for (const child of this.children) {
            const found = child.getObjectByName(name);
            if (found) return found;
        }
        return null;
    }
}