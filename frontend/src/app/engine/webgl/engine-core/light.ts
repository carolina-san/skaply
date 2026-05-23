import { Entity } from './entity';
import { ShaderResource } from '../resource/shader-resource';
import { mat4 } from 'gl-matrix';

export abstract class Light extends Entity {
    // Lights don't render geometry — traverse() skips them via collectLights()
    draw(modelMatrix: mat4, shader: ShaderResource): void {}

    abstract uploadToShader(shader: ShaderResource, worldMatrix: mat4, index: number): void;
}
