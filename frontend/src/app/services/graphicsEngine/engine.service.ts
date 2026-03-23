import { Injectable, signal } from '@angular/core';
import { EngineFacade, RenderableObject, Vector3 } from '../../engine/interfaces';
import { ThreeEngineAdapter } from '../../engine/three/threeEngine';
import { WebGLEngineAdapter } from '../../engine/webgl/webglEngine';

@Injectable()
export class EngineService {
  private engine!: EngineFacade;
  public engineUse = signal<'threeJS' | 'webGL'>('webGL');

  public createEngineInstance(): void {
    if (this.engineUse() === 'webGL') {
      this.engine = new WebGLEngineAdapter();
    } else {
      this.engine = new ThreeEngineAdapter();
    }
  }

  public getEngine(): EngineFacade {
    return this.engine;
  }

  public dispose(): void {
    this.engine?.dispose();
  }

  public async initEngine(canvas: HTMLCanvasElement, width: number, height: number): Promise<void> {
    await this.engine.init(canvas, width, height);
    this.engine.setControlsAutoRotateSpeed(1.0);
  }

  public resize(width: number, height: number): void {
    if (this.engine) {
      this.engine.resize(width, height);
    }
  }

  public setEngineType(newType: 'threeJS' | 'webGL'): boolean {
    if (this.engineUse() === newType) return false;
    this.engineUse.set(newType);
    return true;
  }

  public detectObjectUnderCursor(coords: { x: number; y: number }) {
    return this.engine.raycast(coords.x, coords.y);
  }

  public render(): void {
    this.engine.render();
  }
  public addToScene(obj: RenderableObject): void {
    this.engine.addToScene(obj);
  }

  public async loadGLTF(uri: string): Promise<RenderableObject> {
    return await this.engine.loadGLTF(uri);
  }

  public async createArrowHelper(
    dir: Vector3,
    position: Vector3,
    length: number
  ): Promise<RenderableObject> {
    return this.engine.createArrowHelper(dir, position, length);
  }
}
