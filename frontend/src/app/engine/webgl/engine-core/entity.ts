import { mat4 } from 'gl-matrix';

// Abstract class for all renderable objects
export abstract class Entity {
    abstract draw(modelMatrix: mat4): void;
}