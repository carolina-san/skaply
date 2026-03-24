import { Injectable, signal } from '@angular/core';
import { AssemblyPart } from '../../types/furniture.types';
import { EngineService } from './engine.service';
import { ChatbotInteractionService } from '../chatbot-interaction.service';

export interface InteractionStateContext {
  getIsSimulating: () => boolean;
  getMode: () => 'manual' | 'simulation' | 'final';
  getIsARActive: () => boolean;
  getIsolatedPart: () => AssemblyPart | null;
  getCurrentStep: () => number;
  getParts: () => AssemblyPart[];
  isolatePart: (part: AssemblyPart) => void;
}

@Injectable()
export class InteractionService {
  private canvas!: HTMLCanvasElement;
  private ctx!: InteractionStateContext;

  private pressTimer: any;
  private isPointerDown = false;
  private pointerDownPos = { x: 0, y: 0 };
  private readonly LONG_PRESS_DURATION = 500; // ms
  public isUserManuallyMoved = signal(false);

  constructor(
    private engineService: EngineService,
    private chatbotInteractionService: ChatbotInteractionService
  ) {}

  public init(canvas: HTMLCanvasElement, ctx: InteractionStateContext): void {
    this.canvas = canvas;
    this.ctx = ctx;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointerleave', this.onPointerUp);

    this.onInteraction = this.onInteraction.bind(this);
    canvas.addEventListener('mousedown', this.onInteraction);
    canvas.addEventListener('touchstart', this.onInteraction);
    canvas.addEventListener('wheel', this.onInteraction);
  }


  public hasUserManuallyMoved(): boolean {
    return this.isUserManuallyMoved();
  }

  public resetUserManuallyMoved(): void {
    this.isUserManuallyMoved.set(false);
  }

  private onInteraction(): void {
    this.isUserManuallyMoved.set(true);
  }

  public dispose(): void {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.onPointerDown);
      this.canvas.removeEventListener('pointermove', this.onPointerMove);
      this.canvas.removeEventListener('pointerup', this.onPointerUp);
      this.canvas.removeEventListener('pointerleave', this.onPointerUp);
      this.canvas.removeEventListener('mousedown', this.onInteraction);
      this.canvas.removeEventListener('touchstart', this.onInteraction);
      this.canvas.removeEventListener('wheel', this.onInteraction);
    }
  }

  private onPointerDown(event: PointerEvent): void {
    if (this.ctx.getIsSimulating() || this.ctx.getMode() === 'final' || this.ctx.getIsARActive() || this.ctx.getIsolatedPart()) return;

    this.isPointerDown = true;
    this.pointerDownPos = { x: event.clientX, y: event.clientY };

    this.pressTimer = setTimeout(() => {
      if (this.isPointerDown) {
        this.handleLongPress(event);
      }
    }, this.LONG_PRESS_DURATION);
  }

  private onPointerUp(event: PointerEvent): void {
    this.isPointerDown = false;
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }

  private handleLongPress(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const hitObject = this.engineService.detectObjectUnderCursor({ x, y });

    if (hitObject) {
      const part = this.findPartForObject(hitObject);
      if (part && this.ctx.getCurrentStep() >= part.appearStep) {
        this.ctx.isolatePart(part);
        this.chatbotInteractionService.requestAutoSendPiece('pieza: ' + part.name);
      }
    }
  }

  private onPointerMove(event: PointerEvent): void {
    if (this.ctx.getIsSimulating() || this.ctx.getMode() === 'final' || this.ctx.getIsARActive()) return;

    if (this.isPointerDown) {
      const dx = Math.abs(event.clientX - this.pointerDownPos.x);
      const dy = Math.abs(event.clientY - this.pointerDownPos.y);
      if (dx > 15 || dy > 15) {
        this.isPointerDown = false;
        if (this.pressTimer) {
          clearTimeout(this.pressTimer);
          this.pressTimer = null;
        }
      }
    }

    if (this.ctx.getIsolatedPart()) {
      this.canvas.style.setProperty('cursor', 'grab', 'important');
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const hitObject = this.engineService.detectObjectUnderCursor({ x, y });

    if (hitObject) {
      const part = this.findPartForObject(hitObject);
      if (part && this.ctx.getCurrentStep() >= part.appearStep) {
        this.canvas.style.setProperty('cursor', 'pointer', 'important');
      } else {
        this.canvas.style.setProperty('cursor', 'grab', 'important');
      }
    } else {
      this.canvas.style.setProperty('cursor', 'grab', 'important');
    }
  }

  private findPartForObject(inputObj: any): AssemblyPart | undefined {
    return this.ctx.getParts().find(p => {
      if (p.object === inputObj) return true;
      let current = inputObj.nativeObject;
      const target = p.object.nativeObject;

      while (current) {
        if (current === target) return true;
        current = current.parent;
      }
      return false;
    });
  }
}
