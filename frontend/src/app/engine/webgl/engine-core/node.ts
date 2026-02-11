import { mat4, vec3 } from 'gl-matrix';
import { Entity } from './entity';

export class Node {
    
    // entity
    private entity: Entity | null = null;
    
    // nodes
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

    addChild(child: Node): void {
        child.parent = this;
        this.children.push(child);
    }

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

    private computeLocalMatrix(): mat4 { // local matrix
        const matrix = mat4.create();
        mat4.translate(matrix, matrix, this.translation);
        mat4.rotateX(matrix, matrix, this.rotation[0]);
        mat4.rotateY(matrix, matrix, this.rotation[1]);
        mat4.rotateZ(matrix, matrix, this.rotation[2]);
        mat4.scale(matrix, matrix, this.scale);
        return matrix;
    }

    traverse(parentMatrix: mat4): void { // recorrer árbol y dibujar
        
        // create transform matrix
        if (this.needsUpdate) {
            const localMatrix = this.computeLocalMatrix();
            mat4.multiply(this.transformMatrix, parentMatrix, localMatrix); // using parent's matrix
            this.needsUpdate = false;
        }

        // draw entity 
        if (this.entity) {
            this.entity.draw(this.transformMatrix);
        }

        // recursive
        for (const child of this.children) {
            child.traverse(this.transformMatrix);
        }
    }
}