import { Injectable, signal } from '@angular/core';
import { EngineService } from './engine.service';
import { AssemblyPart } from '../../types/furniture.types';
import { RenderableObject, Vector3 } from '../../engine/interfaces';

@Injectable()
export class SimulationService {
  public simulationStep = signal(0);
  public isSimulationPaused = signal(false);
  public simulationDirection = signal<'forward' | 'backward'>('forward');
  public simulationSpeed = signal(1);

  private readonly SIMULATION_STEP_INTERVAL = 1500; // ms
  private readonly LERP_ALPHA = 0.08;
  private readonly ARROW_FADE_SPEED = 0.02;
  private lastStepTime = 0;

  constructor(private engineService: EngineService) { }

  public resetSimulation(): void {
    this.simulationStep.set(0);
    this.isSimulationPaused.set(false);
    this.simulationDirection.set('forward');
    this.lastStepTime = Date.now();
  }

  public runSimulation(totalSteps: number): void {
    if (this.isSimulationPaused()) {
      this.lastStepTime = Date.now();
      return;
    }

    const now = Date.now();
    const interval = this.SIMULATION_STEP_INTERVAL / this.simulationSpeed();

    if (now - this.lastStepTime > interval) {
      if (this.simulationDirection() === 'forward') {
        if (this.simulationStep() >= totalSteps - 1) {
          this.simulationDirection.set('backward');
        } else {
          this.simulationStep.update(s => s + 1);
        }
      } else { // backward
        if (this.simulationStep() <= 0) {
          this.simulationDirection.set('forward');
        } else {
          this.simulationStep.update(s => s - 1);
        }
      }
      this.lastStepTime = now;
    }
  }

  public handleIsolatedMode(isolated: AssemblyPart, parts: AssemblyPart[]): void {
    parts.forEach(part => {
      const isTarget = part === isolated;
      part.object.setVisible(isTarget);
      if (part.arrow) { part.arrow.setVisible(false); }
    });
    this.engineService.getEngine().setHighlight([isolated.object]);
  }

  public handleNormalMode(step: number, parts: AssemblyPart[], mode: 'manual' | 'simulation' | 'final'): void {
    const partsToHighlight: RenderableObject[] = [];
    for (const part of parts) {
      if (this.needsHighlight(part, step)) {
        partsToHighlight.push(part.object);
      }
      this.updateArrowVisibility(part, step);
      this.updatePartMovement(part, step, mode);
      this.updatePartVisibility(part, step);
    }
    this.engineService.getEngine().setHighlight(partsToHighlight);
  }

  private needsHighlight(part: AssemblyPart, step: number): boolean {
    if (part.appearStep === step) return true;
    if (step > part.appearStep && step <= part.joinStep) {
      return this.isMovingToTarget(part);
    }
    return false;
  }

  private isMovingToTarget(part: AssemblyPart): boolean {
    const currentPos = part.object.getPosition();
    const distToTarget = this.getDistance(currentPos, part.targetPosition);
    return (distToTarget > 0.01);
  }

  private getDistance(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private updateArrowVisibility(part: AssemblyPart, step: number): void {
    if (!part.arrow) return;
    if (step === part.appearStep) {
      part.arrowOpacity = 1.0;
      part.arrow.setVisible(true);
      part.arrow.setOpacity(1.0);
      return;
    }
    if (step === part.joinStep) {
      const isMoving = this.isMovingToTarget(part);
      if (isMoving) {
        part.arrowOpacity = 1.0;
        part.arrow.setVisible(true);
        part.arrow.setOpacity(1.0);
      } else {
        part.arrowOpacity = (part.arrowOpacity ?? 1.0) - this.ARROW_FADE_SPEED;
        if (part.arrowOpacity <= 0) {
          part.arrowOpacity = 0;
          part.arrow.setVisible(false);
        } else {
          part.arrow.setOpacity(part.arrowOpacity);
        }
      }
      return;
    }
    part.arrow.setVisible(false);
    part.arrowOpacity = 0;
  }

  private updatePartMovement(part: AssemblyPart, step: number, mode: 'manual' | 'simulation' | 'final'): void {
    if (mode === 'final') return;
    const target = step >= part.joinStep ? part.targetPosition : part.startPosition;
    const current = part.object.getPosition();
    part.object.setPosition(
      current.x + (target.x - current.x) * this.LERP_ALPHA,
      current.y + (target.y - current.y) * this.LERP_ALPHA,
      current.z + (target.z - current.z) * this.LERP_ALPHA
    );
  }

  private updatePartVisibility(part: AssemblyPart, step: number): void {
    const hasAppeared = step >= part.appearStep;
    part.object.setVisible(hasAppeared);
  }
}
