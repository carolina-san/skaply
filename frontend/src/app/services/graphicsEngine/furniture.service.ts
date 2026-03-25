import { Injectable } from '@angular/core';
import { EngineService } from './engine.service';
import { ApiService } from '../api.service';
import { FurnitureAssembly, AssemblyPart, AssemblyPartRef, AssemblyStep } from '../../types/furniture.types';
import { RenderableObject, Vector3 } from '../../engine/interfaces';

@Injectable()
export class FurnitureService {
  
  constructor(
    private engineService: EngineService,
    private apiService: ApiService
  ) { }

  public async loadFurniture(furnitureId: string): 
  Promise<{
    parts: AssemblyPart[],
    totalSteps: number,
    stepDescriptions: string[],
    sortedSteps: any[],
    furnitureRoot: RenderableObject
  }> {
    const data = await this.apiService.getFurnitureById(furnitureId).toPromise();
    if (!data) { throw new Error('Furniture not found'); }
    const result = await this.createPartsFromApi(data);
    return {...result};
  }

  public async createPartsFromApi(data: FurnitureAssembly): 
  Promise<{ 
    parts: AssemblyPart[], 
    totalSteps: number, 
    stepDescriptions: string[], 
    sortedSteps: any[],
    furnitureRoot: RenderableObject 
  }> 
    {

    const parts: AssemblyPart[] = [];
    const stepDescriptions: string[] = [];
    let currentStepIndex = 0;

    const furnitureRoot = this.engineService.getEngine().createGroup('furniture');

    const sortedSteps = data.steps.sort((a, b) => a.step_number - b.step_number);

    for (const step of sortedSteps) {
      const description = step.description || `Paso ${step.step_number}: Ensamblaje de partes.`;
      stepDescriptions.push(description);
      const appearStep = currentStepIndex * 2;
      const joinStep = appearStep + 1;

      for (const partRef of step.parts) {
        const { mesh, targetPos } = await this.loadMesh(partRef);
        
        if (!mesh) {
          console.warn(`[Assembly] Skipping missing part '${partRef.reference_number}'`);
          continue;
        }

        furnitureRoot.add(mesh);
        //this.engineService.getEngine().addToScene(mesh);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.setVisible(false);

        const offsetDistance = partRef.distance;
        const offsetAxis = partRef.axis;
        const startPos = this.calculateOffsetPosition({ ...targetPos }, offsetDistance, offsetAxis);
        const rotation = { x: partRef.rot_x, y: partRef.rot_y, z: partRef.rot_z };

        mesh.setPosition(startPos.x, startPos.y, startPos.z);
        mesh.setRotation(rotation.x, rotation.y, rotation.z);

        const assemblyPart: AssemblyPart = {
          object: mesh,
          startPosition: startPos,
          targetPosition: targetPos,
          rotation: rotation,
          appearStep,
          joinStep,
          name: partRef.reference_number || `Part ${partRef.part_id}`,
          description: `Part: ${partRef.reference_number}`
        };

        const arrow = await this.createArrow(mesh, partRef, offsetDistance, offsetAxis);
        if (arrow) {
          assemblyPart.arrow = arrow;
          assemblyPart.object.add(arrow);
        }

        parts.push(assemblyPart);
      }
      currentStepIndex++;
    }
    
    this.engineService.getEngine().addToScene(furnitureRoot); 

    const totalSteps = currentStepIndex * 2;
    return { parts, totalSteps, stepDescriptions, sortedSteps, furnitureRoot };
  }

  private async loadMesh(partRef: AssemblyPartRef): 
  Promise<{ mesh: RenderableObject | null, targetPos: Vector3 }>  {
    let mesh: RenderableObject | null = null;
    let targetPos: Vector3 = { x: partRef.pos_x, y: partRef.pos_y, z: partRef.pos_z };
    const engine = this.engineService.getEngine();   
    if (partRef.file_uri) {
      try { mesh = await engine.loadGLTF(partRef.file_uri);} 
      catch (e) { console.error(`Failed to load part GLTF: ${partRef.file_uri}`, e); }
    }
    return { mesh, targetPos };
  }

  private async createArrow(
    mesh: RenderableObject,
    partRef: AssemblyPartRef,
    offsetDistance: number,
    offsetAxis: string
  ): Promise<RenderableObject | undefined> {
    let length = Math.abs(offsetDistance);
    if (length <= 0.01) return undefined;
    
    let arrowPosition: Vector3 = { x: 0, y: 0, z: 0 };
    const sign = -(Math.sign(offsetDistance));
    let dir: Vector3 = { x: 0, y: 0, z: 0 };
    
    const offset = this.getArrowOffset(mesh, offsetAxis, sign);
    length = Math.max(length - 0.035, 0.01);

    if      (offsetAxis === 'x')  {dir.x = 1; arrowPosition.x = offset; }
    else if (offsetAxis === 'y')  {dir.y = 1; arrowPosition.y = offset;}
    else if (offsetAxis === 'z')  {dir.z = 1; arrowPosition.z = offset;}

    // transform arrowPosition based on part rotation
    if (partRef.rot_x !== 0 || partRef.rot_y !== 0 || partRef.rot_z !== 0) {
      arrowPosition = this.rotateVector(arrowPosition, partRef.rot_x, partRef.rot_y, partRef.rot_z);
    }

    dir.x *= sign;
    dir.y *= sign;
    dir.z *= sign;

    const arrow = await this.engineService.createArrowHelper(dir, arrowPosition, length);
    
    // apply inverse rotation to arrow to counteract parent's rotation (part rotation)
    if (partRef.rot_x != 0 || partRef.rot_y != 0 || partRef.rot_z != 0) {
      const rotation = arrow.getRotation();
      arrow.setRotation(rotation.x - partRef.rot_x, rotation.y - partRef.rot_y, rotation.z - partRef.rot_z); 
    }
 
    return arrow;
  }

  private getArrowOffset(mesh: RenderableObject, axis: string, sign: number): number {
    const padding = 0.035;
    const bounds = this.engineService.getObjectLocalBounds(mesh);

    if (!bounds || sign === 0) {
      return padding * (sign || 1);
    }

    const boundary = sign > 0 ? bounds.max[axis as keyof Vector3] : bounds.min[axis as keyof Vector3];
    return boundary + padding * sign;
  }

  private rotateVector(vector: Vector3, rotX: number, rotY: number, rotZ: number): Vector3 {
    let v = { ...vector };
    
    // rotation around X axis
    if (rotX !== 0) {
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y = v.y * cosX - v.z * sinX;
      const z = v.y * sinX + v.z * cosX;
      v.y = y;
      v.z = z;
    }
    
    // rotation around Y axis
    if (rotY !== 0) {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x = v.x * cosY + v.z * sinY;
      const z = -v.x * sinY + v.z * cosY;
      v.x = x;
      v.z = z;
    }
    
    // rotation around Z axis
    if (rotZ !== 0) {
      const cosZ = Math.cos(rotZ);
      const sinZ = Math.sin(rotZ);
      const x = v.x * cosZ - v.y * sinZ;
      const y = -v.x * sinZ + v.y * cosZ;
      v.x = x;
      v.y = y;
    }
    
    return v;
  }

  private calculateOffsetPosition(position: Vector3, offsetDistance: number, offsetAxistance: string): Vector3 {
    if      (offsetAxistance === 'x') position.x += offsetDistance;
    else if (offsetAxistance === 'y') position.y += offsetDistance;
    else if (offsetAxistance === 'z') position.z += offsetDistance;
    else                              position.y += offsetDistance; // Default
    return position;
  }
}
