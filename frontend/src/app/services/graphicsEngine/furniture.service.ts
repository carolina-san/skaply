import { Injectable } from '@angular/core';
import { EngineService } from './engine.service';
import { ApiService } from '../api.service';
import { FurnitureAssembly, AssemblyPart, AssemblyPartRef } from '../../types/furniture.types';
import { RenderableObject, Vector3 } from '../../engine/interfaces';

@Injectable()
export class FurnitureService {
  constructor(
    private engineService: EngineService,
    private apiService: ApiService
  ) { }
  public async loadFurniture(furnitureId: string): Promise<{
    parts: AssemblyPart[],
    totalSteps: number,
    stepDescriptions: string[],
    sortedSteps: any[],
    baseModel?: RenderableObject
  }> {

    // 1. Obtener datos de API
    const data = await this.apiService.getFurnitureById(furnitureId).toPromise();

    if (!data) {
      throw new Error('Furniture not found');
    }

    let baseModel: RenderableObject | undefined;

    if (data.base_model_uri) {
      try {
        baseModel = await this.engineService.loadGLTF(data.base_model_uri);
        this.engineService.addToScene(baseModel);
      } catch (e) {
        console.warn('Error loading base model', e);
      }
    }

    const result = await this.createPartsFromApi(data, baseModel);

    return {
      ...result,
      baseModel
    };
  }
  public async createPartsFromApi(data: FurnitureAssembly, baseModel?: RenderableObject): Promise<{ parts: AssemblyPart[], totalSteps: number, stepDescriptions: string[], sortedSteps: any[] }> {
    const parts: AssemblyPart[] = [];
    const stepDescriptions: string[] = [];
    let currentStepIndex = 0;

    const sortedSteps = data.steps.sort((a, b) => a.step_number - b.step_number);

    for (const step of sortedSteps) {
      const description = step.description || `Paso ${step.step_number}: Ensamblaje de partes.`;
      stepDescriptions.push(description);

      const appearStep = currentStepIndex * 2;
      const joinStep = appearStep + 1;

      for (const partRef of step.parts) {
        const { mesh, usingExistingMesh, targetPos } = await this.loadMesh(partRef, baseModel);

        if (!mesh) {
          console.warn(`[Assembly] Skipping missing part '${partRef.reference_number}'`);
          continue;
        }

        if (!usingExistingMesh) {
          this.engineService.getEngine().addToScene(mesh);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }

        const offsetDistance = partRef.distance;
        const offsetAxis = partRef.axis;
        const startPos = this.calculateOffsetPosition({ ...targetPos }, offsetDistance, offsetAxis);

        mesh.setPosition(startPos.x, startPos.y, startPos.z);

        const assemblyPart: AssemblyPart = {
          object: mesh,
          startPosition: startPos,
          targetPosition: targetPos,
          appearStep,
          joinStep,
          name: partRef.reference_number || `Part ${partRef.part_id}`,
          description: `Part: ${partRef.reference_number}`
        };

        const arrow = await this.createArrow(partRef, offsetDistance, offsetAxis);
        if (arrow) {
          assemblyPart.arrow = arrow;
          assemblyPart.object.add(arrow);
        }

        parts.push(assemblyPart);
      }
      currentStepIndex++;
    }

    const totalSteps = currentStepIndex * 2;
    return { parts, totalSteps, stepDescriptions, sortedSteps };
  }

  private async loadMesh(partRef: AssemblyPartRef, baseModel?: RenderableObject): Promise<{ mesh: RenderableObject | null, usingExistingMesh: boolean, targetPos: Vector3 }> {
    let mesh: RenderableObject | null = null;
    let targetPos: Vector3 = { x: 0, y: 0, z: 0 };
    let usingExistingMesh = false;
    const engine = this.engineService.getEngine();

    if (partRef.file_uri) {
      try {
        mesh = await engine.loadGLTF(partRef.file_uri);
      } catch (e) {
        console.error(`Failed to load part GLTF: ${partRef.file_uri}`, e);
      }
    }

    if (!mesh && baseModel && partRef.reference_number) {
      const nativeRoot = baseModel.nativeObject;
      const foundNative = nativeRoot.getObjectByName(partRef.reference_number);

      if (foundNative) {
        mesh = engine.wrapNativeObject(foundNative);
        usingExistingMesh = true;
        targetPos = mesh.getPosition();
      } else {
        console.warn(`Part with reference '${partRef.reference_number}' not found in base model.`);
      }
    }

    return { mesh, usingExistingMesh, targetPos };
  }

  private async createArrow(partRef: AssemblyPartRef, offsetDistance: number, offsetAxis: string): Promise<RenderableObject | undefined> {
    const length = Math.abs(offsetDistance * 0.9);
    if (length <= 0.01) return undefined;

    const arrowPosition: Vector3 = { x: partRef.pos_x, y: partRef.pos_y, z: partRef.pos_z };
    let offsetCons = 0.035;
    const sign = -(Math.sign(offsetDistance));
    offsetCons *= sign;

    let dir: Vector3 = { x: 0, y: 0, z: 0 };

    if (offsetAxis === 'x') {
      dir.x = 1;
      arrowPosition.x += offsetCons;
    } else if (offsetAxis === 'y') {
      dir.y = 1;
      arrowPosition.y += offsetCons;
    } else if (offsetAxis === 'z') {
      dir.z = 1;
      arrowPosition.z += offsetCons;
    }

    dir.x *= sign;
    dir.y *= sign;
    dir.z *= sign;

    return await this.engineService.createArrowHelper(dir, arrowPosition, length, 0x00ffff);
  }

  private calculateOffsetPosition(position: Vector3, offsetDistance: number, offsetAxistance: string): Vector3 {
    if (offsetAxistance === 'x') position.x += offsetDistance;
    else if (offsetAxistance === 'y') position.y += offsetDistance;
    else if (offsetAxistance === 'z') position.z += offsetDistance;
    else position.y += offsetDistance; // Default
    return position;
  }
}
