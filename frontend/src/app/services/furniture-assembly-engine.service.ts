import { Injectable } from '@angular/core';
import { EngineFacade, RenderableObject } from '../engine/interfaces';
import { Axis, FurnitureAssemblyDto } from '../types/assembly.types';

type PartInstance = {
  ref: string;
  obj: RenderableObject;
  assembledPos: { x: number; y: number; z: number };
  explodedPos: { x: number; y: number; z: number };
};

@Injectable({ providedIn: 'root' })
export class FurnitureAssemblyEngineService {
  private engine!: EngineFacade;
  private modelRoot!: RenderableObject;

  private parts = new Map<string, PartInstance>();
  private steps: FurnitureAssemblyDto['steps'] = [];
  private currentStep = 0;

  async init(engine: EngineFacade, dto: FurnitureAssemblyDto): Promise<void> {
    this.engine = engine;
    this.steps = dto.steps.sort((a, b) => a.step_number - b.step_number);
    this.currentStep = 0;

    // 1) cargar modelo
    this.modelRoot = await this.engine.loadGLTF(dto.furniture.modelUrl);
    this.engine.addToScene(this.modelRoot);

    // 2) config de explosionado por pieza desde BD
    const explodedCfg = new Map<string, { axis?: Axis; dist?: number }>();
    dto.partsConfig?.forEach(p => explodedCfg.set(p.reference_number, { axis: p.exploded_axis, dist: p.exploded_distance }));

    // 3) indexar todas las piezas que aparecen en pasos
    const allRefs = new Set<string>();
    this.steps.forEach(s => s.parts.forEach(p => allRefs.add(p.reference_number)));

    allRefs.forEach(ref => {
      const native = this.modelRoot.nativeObject.getObjectByName(ref);
      if (!native) {
        console.warn(`[Assembly] No existe en GLTF el nodo: ${ref} (renombra en Blender a ${ref})`);
        return;
      }

      const obj = this.engine.wrapNativeObject(native);

      const assembledPos = { x: native.position.x, y: native.position.y, z: native.position.z };

      const cfg = explodedCfg.get(ref);
      const explodedPos = this.computeExploded(assembledPos, cfg?.axis, cfg?.dist);

      // arranque: oculto y en exploded
      obj.setVisible(false);
      obj.setPosition(explodedPos.x, explodedPos.y, explodedPos.z);

      this.parts.set(ref, { ref, obj, assembledPos, explodedPos });
    });

    // 4) mostrar primer paso
    this.showStep(0);
  }

  next(): void {
    if (this.currentStep >= this.steps.length - 1) return;
    this.assembleNewParts(this.currentStep);
    this.currentStep++;
    this.showStep(this.currentStep);
  }

  prev(): void {
    if (this.currentStep <= 0) return;
    // desensambla las piezas nuevas del paso actual
    this.disassembleNewParts(this.currentStep - 1);
    this.currentStep--;
    this.showStep(this.currentStep);
  }

  getStepInfo(): { current: number; total: number } {
    return { current: this.currentStep + 1, total: this.steps.length };
  }

  private showStep(stepIndex: number): void {
    // ocultar todo + quitar highlight
    this.parts.forEach(p => p.obj.setVisible(false));
    this.engine.setHighlight([]);

    // mostrar piezas hasta este paso
    const visibleRefs = new Set<string>();
    for (let i = 0; i <= stepIndex; i++) {
      this.steps[i]?.parts.forEach(p => visibleRefs.add(p.reference_number));
    }
    visibleRefs.forEach(ref => {
      const inst = this.parts.get(ref);
      if (inst) inst.obj.setVisible(true);
    });

    // highlight de piezas nuevas del paso actual
    const prevRefs = new Set<string>();
    for (let i = 0; i < stepIndex; i++) this.steps[i]?.parts.forEach(p => prevRefs.add(p.reference_number));

    const newObjs: RenderableObject[] = [];
    this.steps[stepIndex]?.parts.forEach(p => {
      if (!prevRefs.has(p.reference_number)) {
        const inst = this.parts.get(p.reference_number);
        if (inst) newObjs.push(inst.obj);
      }
    });
    this.engine.setHighlight(newObjs);
  }

  private assembleNewParts(stepIndex: number): void {
    const prevRefs = new Set<string>();
    for (let i = 0; i < stepIndex; i++) this.steps[i]?.parts.forEach(p => prevRefs.add(p.reference_number));

    this.steps[stepIndex]?.parts.forEach(p => {
      if (prevRefs.has(p.reference_number)) return;
      const inst = this.parts.get(p.reference_number);
      if (!inst) return;
      inst.obj.setVisible(true);
      inst.obj.setPosition(inst.assembledPos.x, inst.assembledPos.y, inst.assembledPos.z);
    });
  }

  private disassembleNewParts(stepIndex: number): void {
    const prevRefs = new Set<string>();
    for (let i = 0; i < stepIndex; i++) this.steps[i]?.parts.forEach(p => prevRefs.add(p.reference_number));

    this.steps[stepIndex]?.parts.forEach(p => {
      if (prevRefs.has(p.reference_number)) return;
      const inst = this.parts.get(p.reference_number);
      if (!inst) return;
      inst.obj.setPosition(inst.explodedPos.x, inst.explodedPos.y, inst.explodedPos.z);
      inst.obj.setVisible(false);
    });
  }

  private computeExploded(
    assembled: { x: number; y: number; z: number },
    axis?: Axis,
    dist?: number
  ) {
    const d = dist ?? 0;
    const pos = { ...assembled };
    if (axis === 'x') pos.x += d;
    else if (axis === 'y') pos.y += d;
    else if (axis === 'z') pos.z += d;
    else pos.y += d; // fallback
    return pos;
  }
}
