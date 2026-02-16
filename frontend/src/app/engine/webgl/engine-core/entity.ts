import { mat4 } from 'gl-matrix';
import { ShaderResource } from '../resource/shader-resource';

// Abstract class for all renderable objects
export abstract class Entity {
    abstract draw(modelMatrix: mat4, shader: ShaderResource): void;
}