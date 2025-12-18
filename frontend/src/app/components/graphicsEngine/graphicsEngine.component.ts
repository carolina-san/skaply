

import { Component, ChangeDetectionStrategy, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EngineFacade, RenderableObject, Vector3, GeometryConfig, MaterialConfig } from '../../engine-facade/interfaces';
import { ApiService } from '../../services/api.service';
import { Furniture } from '../../types';

interface AssemblyPart {
  object: RenderableObject;
  startPosition: Vector3;
  targetPosition: Vector3;
  appearStep: number;
  joinStep: number;
  name: string;
  description: string;
  arrow?: RenderableObject;
}

import { ThreeEngineAdapter } from '../../engine-facade/threeEngine';

@Component({
  selector: 'app-graphics-engine',
  imports: [CommonModule],
  providers: [{ provide: EngineFacade, useClass: ThreeEngineAdapter }],
  templateUrl: './graphicsEngine.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphicsEngineComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('video') private videoRef!: ElementRef<HTMLVideoElement>;

  constructor(private engine: EngineFacade, private apiService: ApiService) { }

  furnitureId = input<number | string>();
  furnitureName = input<string>('');
  arStateChange = output<boolean>();
  furnitures: Furniture[] = [];

  controlsMode = input<'interactive' | 'display-only' | 'hidden'>('interactive');
  autoStartSimulation = input<boolean>(false);

  getFurnitureById(idFurniture: number) {
    return this.furnitures.find(furniture => furniture.id === idFurniture);
  }

  showHeader = computed(() => this.controlsMode() === 'interactive');
  showFooterControls = computed(() => this.controlsMode() !== 'hidden');
  areControlsDisabled = computed(() => this.controlsMode() === 'display-only');

  totalSteps = 10;
  manualStep = signal(0);
  simulationStep = signal(0);
  isolatedPart = signal<AssemblyPart | null>(null);
  mode = signal<'manual' | 'simulation' | 'final'>('manual');
  isARActive = signal(false);
  arFlowState = signal<'idle' | 'requesting' | 'denied'>('idle');
  isSmallScreen = signal(false);

  currentStep = computed(() => {
    switch (this.mode()) {
      case 'manual':
        return this.manualStep();
      case 'simulation':
        return this.simulationStep();
      case 'final':
        return this.totalSteps - 1;
      default:
        return 0;
    }
  });

  isSimulating = computed(() => this.mode() === 'simulation');

  isManualFirstStep = computed(() => this.manualStep() === 0);
  isManualComplete = computed(() => this.manualStep() === this.totalSteps - 1);

  isSimulationPaused = signal(false);
  simulationSpeed = signal(1);
  readonly simulationSpeeds = [0.5, 1, 1.5, 2];

  backgroundColor = signal<'dark' | 'light'>('dark');
  isCameraMoved = signal(false);

  stepDescriptions = [
    "Paso 1: Prepara los tarugos inferiores.",
    "Paso 2: Inserta los tarugos en la base.",
    "Paso 3: Prepara los paneles laterales.",
    "Paso 4: Une los paneles laterales a la base.",
    "Paso 5: Prepara el panel trasero.",
    "Paso 6: Desliza el panel trasero en su sitio.",
    "Paso 7: Prepara los tarugos superiores.",
    "Paso 8: Inserta los tarugos en los paneles laterales.",
    "Paso 9: Prepara el panel superior y los tornillos.",
    "Paso 10: Fija el panel superior con los tornillos."
  ];

  /* 
   * Engine facade abstracts these details
   */
  // private renderer!: THREE.WebGLRenderer;
  // private scene!: THREE.Scene;
  // private camera!: THREE.PerspectiveCamera;
  // private controls!: OrbitControls;
  // private composer!: EffectComposer;
  // private outlinePass!: OutlinePass;
  // private raycaster = new THREE.Raycaster();
  // private pointer = new THREE.Vector2();

  private parts: AssemblyPart[] = [];
  private animationFrameId: number | null = null;
  private resizeObserver!: ResizeObserver;

  private simulationDirection = signal<'forward' | 'backward'>('forward');
  private lastStepTime = 0;
  private readonly SIMULATION_STEP_INTERVAL = 1500; // ms
  private videoStream: MediaStream | null = null;

  // private onControlsChange = () => { ... } managed by facade loop mostly or we can re-implement listener if facade exposes events
  // For now simple check in animate or just assume moved if interactions happen?
  // The original code used a listener. Facade doesn't expose event listener yet.
  // We can add a 'checkCameraMoved' to facade or just checking in animate.
  // For this refactor I'll simplify: we won't track "isCameraMoved" exactly as before unless I add getCamera props.
  // But wait, the facade has `getCamera()` as escape hatch.

  private initialCameraState: any = null; // Store initial state manually if needed


  ngAfterViewInit(): void {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());

    this.resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        this.initThree();
        this.createFurniture();
        this.animate();

        if (this.autoStartSimulation()) {
          this.setMode('simulation');
        }

        this.resizeObserver.disconnect();
      }
    });
    this.resizeObserver.observe(this.canvasRef.nativeElement.parentElement!);
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.stopAR();
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', () => this.checkScreenSize());
    this.engine.dispose();
  }

  nextStep(): void {
    this.manualStep.update(step => (step < this.totalSteps - 1 ? step + 1 : step));
  }

  prevStep(): void {
    this.manualStep.update(step => (step > 0 ? step - 1 : step));
  }

  reset(): void {
    this.manualStep.set(0);
  }

  exitIsolation(): void {
    this.isolatedPart.set(null);
    this.engine.setCameraProps(this.engine.getCamera().position, { x: 0, y: 1, z: 0 }); // Reset target
  }

  resetCameraPosition(): void {
    this.engine.resetControls();
  }

  public toggleSimulation(): void {
    if (this.mode() === 'simulation') {
      this.setMode('manual');
    } else {
      this.setMode('simulation');
    }
  }

  public setMode(newMode: 'manual' | 'simulation' | 'final'): void {
    if (this.mode() === newMode) return;

    this.mode.set(newMode);

    // Auto rotate logic
    const shouldRotate = newMode === 'simulation' || newMode === 'final';
    this.engine.toggleControls(true, shouldRotate);

    this.exitIsolation();

    if (newMode === 'simulation') {
      this.simulationStep.set(0);
      this.isSimulationPaused.set(false);
      this.simulationDirection.set('forward');
      this.lastStepTime = Date.now();
    } else if (newMode === 'final') {
      // Instantly move all parts to their final position
      this.parts.forEach(part => {
        part.object.setPosition(part.targetPosition.x, part.targetPosition.y, part.targetPosition.z);
      });
    }
  }

  togglePause(): void {
    this.isSimulationPaused.update(p => !p);
  }

  setSimulationSpeed(speed: number): void {
    this.simulationSpeed.set(speed);
  }

  toggleBackgroundColor(): void {
    this.backgroundColor.update(c => c === 'dark' ? 'light' : 'dark');
  }

  public toggleAR(): void {
    if (this.isARActive()) {
      this.stopAR();
      this.arFlowState.set('idle');
    } else {
      this.arFlowState.set('requesting');
    }
  }

  async proceedWithARPermission(): Promise<void> {
    try {
      await this.startAR();
      this.arFlowState.set('idle');
    } catch (error) {
      this.arFlowState.set('denied');
    }
  }

  cancelARPermissionRequest(): void {
    this.arFlowState.set('idle');
  }

  retryARPermission(): void {
    this.arFlowState.set('requesting');
  }

  closeARDeniedMessage(): void {
    this.arFlowState.set('idle');
  }

  private checkScreenSize(): void {
    this.isSmallScreen.set(window.innerWidth < 768);
  }

  private async startAR(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('getUserMedia not supported on this browser!');
      throw new Error('getUserMedia not supported');
    }

    try {
      // Ensure the model is fully assembled by switching to 'final' mode.
      this.setMode('final');

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      this.videoStream = stream;

      this.isARActive.set(true);
      this.arStateChange.emit(true);
      // Disable auto-rotation for AR mode
      this.engine.toggleControls(true, false);

      // Make background transparent
      this.engine.setBackground(null);

      // Defer video setup to avoid race conditions with view rendering
      setTimeout(() => {
        if (this.videoRef?.nativeElement) {
          this.videoRef.nativeElement.srcObject = this.videoStream;
          this.videoRef.nativeElement.play();
        }
      }, 0);

    } catch (error) {
      console.error('Error accessing camera for AR:', error);
      // Clean up state if permission is denied or another error occurs
      this.stopAR();
      // Propagate error to be handled by the permission flow
      throw error;
    }
  }

  private stopAR(): void {
    this.isARActive.set(false);
    this.arStateChange.emit(false);
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
    if (this.videoRef?.nativeElement) {
      this.videoRef.nativeElement.srcObject = null;
    }
    const shouldRotate = this.mode() === 'final' || this.isSimulating();
    this.engine.toggleControls(true, shouldRotate);
  }

  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;
    const { width, height } = container.getBoundingClientRect();

    this.engine.init(canvas, width, height);
    this.engine.setControlsAutoRotateSpeed(1.0);

    this.onPointerMove = this.onPointerMove.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
    canvas.addEventListener('mousemove', this.onPointerMove);
    canvas.addEventListener('dblclick', this.onDoubleClick);
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private createPart(
    object: RenderableObject,
    startPos: Vector3,
    targetPos: Vector3,
    appearStep: number,
    joinStep: number,
    name: string,
    description: string
  ): AssemblyPart {
    object.setPosition(startPos.x, startPos.y, startPos.z);
    object.castShadow = true;
    object.receiveShadow = true;
    this.engine.addToScene(object);
    return { object, startPosition: startPos, targetPosition: targetPos, appearStep, joinStep, name, description };
  }

  private createSidePanelWithHoles(dowelHolePositions: { z: number }[], screwHolePositions: { z: number }[]): RenderableObject {
    const woodMaterial: MaterialConfig = { type: 'standard', color: 0xEAE0D5, roughness: 0.8, metalness: 0.1 };
    const holeMaterial: MaterialConfig = { type: 'standard', color: 0x4F4A45, roughness: 0.9 };

    const group = this.engine.createGroup();

    const panelMesh = this.engine.createMesh({ type: 'box', args: [0.1, 2, 2] }, woodMaterial);
    group.add(panelMesh);

    const holeGeo: GeometryConfig = { type: 'cylinder', args: [0.035, 0.035, 0.12, 12] };
    dowelHolePositions.forEach(p => {
      const bottomHole = this.engine.createMesh(holeGeo, holeMaterial);
      bottomHole.setPosition(0, -0.94, p.z);
      bottomHole.setRotation(0, 0, Math.PI / 2);
      group.add(bottomHole);

      const topHole = this.engine.createMesh(holeGeo, holeMaterial);
      topHole.setPosition(0, 0.94, p.z);
      topHole.setRotation(0, 0, Math.PI / 2);
      group.add(topHole);
    });

    const pilotHoleGeo: GeometryConfig = { type: 'cylinder', args: [0.045, 0.045, 0.1, 12] };
    screwHolePositions.forEach(p => {
      const pilotHole = this.engine.createMesh(pilotHoleGeo, holeMaterial);
      pilotHole.setPosition(0, 0.95, p.z);
      group.add(pilotHole);
    });

    return group;
  }

  private createTopPanelWithHoles(dowelHolePositions: { x: number, y: number, z: number }[], screwHolePositions: { x: number, z: number }[]): RenderableObject {
    const woodMaterial: MaterialConfig = { type: 'standard', color: 0xEAE0D5, roughness: 0.8, metalness: 0.1 };
    const holeMaterial: MaterialConfig = { type: 'standard', color: 0x4F4A45, roughness: 0.9 };

    const group = this.engine.createGroup();
    const panelMesh = this.engine.createMesh({ type: 'box', args: [2.2, 0.1, 2.2] }, woodMaterial);
    group.add(panelMesh);

    const dowelHoleGeo: GeometryConfig = { type: 'cylinder', args: [0.035, 0.035, 0.12, 12] };
    dowelHolePositions.forEach(p => {
      const holeMesh = this.engine.createMesh(dowelHoleGeo, holeMaterial);
      holeMesh.setPosition(p.x, 0, p.z);
      group.add(holeMesh);
    });

    const screwHoleGeo: GeometryConfig = { type: 'cylinder', args: [0.045, 0.045, 0.12, 12] };
    screwHolePositions.forEach(p => {
      const holeMesh = this.engine.createMesh(screwHoleGeo, holeMaterial);
      holeMesh.setPosition(p.x, 0, p.z);
      group.add(holeMesh);
    });

    return group;
  }

  private createFurniture(): void {
    const woodMaterial: MaterialConfig = { type: 'standard', color: 0xEAE0D5, roughness: 0.8, metalness: 0.1 };
    const screwMaterial: MaterialConfig = { type: 'standard', color: 0x374151, roughness: 0.4, metalness: 0.9 };
    const holeMaterial: MaterialConfig = { type: 'standard', color: 0x4F4A45, roughness: 0.9 };
    const dowelArgs = [0.03, 0.03, 0.2, 8];
    let step = 0;

    const baseMesh = this.engine.createMesh({ type: 'box', args: [2, 0.1, 2] }, woodMaterial);
    this.parts.push(this.createPart(baseMesh, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 0, 0, 'Panel Base', 'Panel inferior de madera (100x100x2cm)'));

    const baseDowelPositions = [{ x: 0.9, z: -0.9 }, { x: -0.9, z: -0.9 }, { x: 0.9, z: 0.9 }, { x: -0.9, z: 0.9 }];
    const holeGeo: GeometryConfig = { type: 'cylinder', args: [0.035, 0.035, 0.12, 12] };

    baseDowelPositions.forEach(p => {
      const holeMesh = this.engine.createMesh(holeGeo, holeMaterial);
      holeMesh.setPosition(p.x, 0.04, p.z);
      baseMesh.add(holeMesh);

      const dowelMesh = this.engine.createMesh({ type: 'cylinder', args: dowelArgs }, woodMaterial);
      const partDowel = this.createPart(dowelMesh, { x: p.x, y: 0.5, z: p.z }, { x: p.x, y: 0.15, z: p.z }, step, step + 1, 'Tarugo de Madera', 'Cilindro de madera de haya (Ø6x30mm)');
      partDowel.arrow = this.engine.createArrowHelper({ x: 0, y: -1, z: 0 }, { x: 0, y: -0.2, z: 0 }, 0.3, 0x00ffff);
      partDowel.object.add(partDowel.arrow);
      this.parts.push(partDowel);
    });
    step += 2;

    const sidePanelDowelHolePositions = [{ z: 0.9 }, { z: -0.9 }];
    const screwPositions = [{ x: 0.95, z: 0.8 }, { x: -0.95, z: 0.8 }, { x: 0.95, z: -0.8 }, { x: -0.95, z: -0.8 }];
    const sidePanelScrewHolePositions = screwPositions.map(p => ({ z: p.z })).filter((value, index, self) => self.findIndex(v => v.z === value.z) === index);

    const rightPanel = this.createSidePanelWithHoles(sidePanelDowelHolePositions, sidePanelScrewHolePositions);
    const partRight = this.createPart(rightPanel, { x: 1.5, y: 1.05, z: 0 }, { x: 0.95, y: 1.05, z: 0 }, step, step + 1, 'Panel Lateral Derecho', 'Panel lateral de madera (100x100x5cm)');
    partRight.arrow = this.engine.createArrowHelper({ x: -1, y: 0, z: 0 }, { x: 0.4, y: 0, z: 0 }, 0.35, 0x00ffff);
    partRight.object.add(partRight.arrow);
    this.parts.push(partRight);

    const leftPanel = this.createSidePanelWithHoles(sidePanelDowelHolePositions, sidePanelScrewHolePositions);
    const partLeft = this.createPart(leftPanel, { x: -1.5, y: 1.05, z: 0 }, { x: -0.95, y: 1.05, z: 0 }, step, step + 1, 'Panel Lateral Izquierdo', 'Panel lateral de madera (100x100x5cm)');
    partLeft.arrow = this.engine.createArrowHelper({ x: 1, y: 0, z: 0 }, { x: -0.4, y: 0, z: 0 }, 0.35, 0x00ffff);
    partLeft.object.add(partLeft.arrow);
    this.parts.push(partLeft);
    step += 2;

    const backPanelMesh = this.engine.createMesh({ type: 'box', args: [1.8, 2, 0.1] }, woodMaterial);
    const partBack = this.createPart(backPanelMesh, { x: 0, y: 1.05, z: -1.5 }, { x: 0, y: 1.05, z: -0.95 }, step, step + 1, 'Panel Trasero', 'Panel fino de contrachapado (90x100cm)');
    partBack.arrow = this.engine.createArrowHelper({ x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -0.4 }, 0.35, 0x00ffff);
    partBack.object.add(partBack.arrow);
    this.parts.push(partBack);
    step += 2;

    const topDowelPositions = [
      { x: 0.95, y: 2.05, z: 0.9 }, { x: 0.95, y: 2.05, z: -0.9 },
      { x: -0.95, y: 2.05, z: 0.9 }, { x: -0.95, y: 2.05, z: -0.9 }
    ];
    topDowelPositions.forEach(p => {
      const dowelMesh = this.engine.createMesh({ type: 'cylinder', args: dowelArgs }, woodMaterial);
      const partDowel = this.createPart(dowelMesh, { x: p.x, y: p.y + 0.5, z: p.z }, { x: p.x, y: p.y, z: p.z }, step, step + 1, 'Tarugo de Madera Superior', 'Cilindro de madera de haya (Ø6x30mm)');
      partDowel.arrow = this.engine.createArrowHelper({ x: 0, y: -1, z: 0 }, { x: 0, y: -0.2, z: 0 }, 0.3, 0x00ffff);
      partDowel.object.add(partDowel.arrow);
      this.parts.push(partDowel);
    });
    step += 2;

    const topPanel = this.createTopPanelWithHoles(topDowelPositions, screwPositions);
    const partTop = this.createPart(topPanel, { x: 0, y: 2.8, z: 0 }, { x: 0, y: 2.1, z: 0 }, step, step + 1, 'Panel Superior', 'Panel superior de madera (110x110x2cm)');
    partTop.arrow = this.engine.createArrowHelper({ x: 0, y: -1, z: 0 }, { x: 0, y: -0.2, z: 0 }, 0.6, 0x00ffff);
    partTop.object.add(partTop.arrow);
    this.parts.push(partTop);

    const screwGeoArgs = [0.04, 0.04, 0.3, 12];
    screwPositions.forEach(p => {
      const screwMesh = this.engine.createMesh({ type: 'cylinder', args: screwGeoArgs }, screwMaterial);
      const partScrew = this.createPart(screwMesh, { x: p.x, y: 2.8, z: p.z }, { x: p.x, y: 2.0, z: p.z }, step, step + 1, 'Tornillo de Montaje', 'Tornillo de acero (Ø8x40mm)');
      partScrew.arrow = this.engine.createArrowHelper({ x: 0, y: -1, z: 0 }, { x: 0, y: -0.25, z: 0 }, 0.4, 0x00ffff);
      partScrew.object.add(partScrew.arrow);
      this.parts.push(partScrew);
    });
    step += 2;
    this.totalSteps = step;
  }

  private runSimulation(): void {
    if (this.isSimulationPaused()) {
      this.lastStepTime = Date.now();
      return;
    }

    const now = Date.now();
    const interval = this.SIMULATION_STEP_INTERVAL / this.simulationSpeed();

    if (now - this.lastStepTime > interval) {
      if (this.simulationDirection() === 'forward') {
        if (this.simulationStep() >= this.totalSteps - 1) {
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

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Check for camera movement
    const isMoved = this.engine.checkControlsState();
    if (this.isCameraMoved() !== isMoved) {
      this.isCameraMoved.set(isMoved);
    }

    if (this.isSimulating()) {
      this.runSimulation();
    }

    const step = this.currentStep();
    const isolated = this.isolatedPart();

    if (isolated) {
      this.parts.forEach(part => {
        part.object.setVisible(part === isolated);
        if (part.arrow) {
          part.arrow.setVisible(false);
        }
      });
      // Facade way to highlight - pass the RenderableObject
      this.engine.setHighlight([isolated.object]);
    } else {
      const partsToHighlight: RenderableObject[] = [];
      this.parts
        .filter(part => {
          const currentPos = part.object.getPosition();
          // simple distance check
          const dx = currentPos.x - part.targetPosition.x;
          const dy = currentPos.y - part.targetPosition.y;
          const dz = currentPos.z - part.targetPosition.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          const isMovingToTarget = dist > 0.01;
          return part.appearStep === step || (part.joinStep === step && isMovingToTarget);
        })
        .forEach(part => {
          partsToHighlight.push(part.object);
        });

      this.engine.setHighlight(partsToHighlight);

      this.parts.forEach(part => {
        if (part.arrow) {
          if (step === part.appearStep) {
            part.arrow.setVisible(true);
          } else if (step === part.joinStep) {
            const currentPos = part.object.getPosition();
            const dx = currentPos.x - part.targetPosition.x;
            const dy = currentPos.y - part.targetPosition.y;
            const dz = currentPos.z - part.targetPosition.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            part.arrow.setVisible(dist > 0.01);
          } else {
            part.arrow.setVisible(false);
          }
        }

        const target = step >= part.joinStep ? part.targetPosition : part.startPosition;
        if (this.mode() !== 'final') {
          // Lerp implementation
          const currentPos = part.object.getPosition();
          const alpha = 0.08;
          const newX = currentPos.x + (target.x - currentPos.x) * alpha;
          const newY = currentPos.y + (target.y - currentPos.y) * alpha;
          const newZ = currentPos.z + (target.z - currentPos.z) * alpha;
          part.object.setPosition(newX, newY, newZ);
        }

        const hasAppeared = step >= part.appearStep;

        const currentPos = part.object.getPosition();
        const start = part.startPosition;
        const distStart = Math.sqrt(
          Math.pow(currentPos.x - start.x, 2) +
          Math.pow(currentPos.y - start.y, 2) +
          Math.pow(currentPos.z - start.z, 2)
        );

        part.object.setVisible(hasAppeared || distStart > 0.01);
      });
    }

    this.engine.render();
  }

  private onWindowResize(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    if (width > 0 && height > 0) {
      this.engine.resize(width, height);
    }
  }

  private isolatePart(part: AssemblyPart): void {
    this.isolatedPart.set(part);
    // Move controls target to object position
    const pos = part.object.getPosition();
    this.engine.setCameraProps(this.engine.getCamera().position, { x: pos.x, y: pos.y, z: pos.z });
  }

  private onDoubleClick(event: MouseEvent): void {
    if (this.isSimulating() || this.mode() === 'final' || this.isARActive() || this.isolatedPart()) return;

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const hitObject = this.engine.raycast(x, y);

    if (hitObject) {
      console.log('Hit object:', hitObject);
      const part = this.findPartForObject(hitObject);
      console.log('Found part:', part?.name);

      if (part && this.currentStep() >= part.appearStep) {
        this.isolatePart(part);
      }
    }
  }

  private onPointerMove(event: MouseEvent): void {
    if (this.isSimulating() || this.mode() === 'final' || this.isARActive()) return;

    const canvas = this.canvasRef.nativeElement;

    if (this.isolatedPart()) {
      canvas.style.cursor = 'grab';
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const hitObject = this.engine.raycast(x, y);

    if (hitObject) {
      const part = this.findPartForObject(hitObject);
      if (part && this.currentStep() >= part.appearStep) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'grab';
      }
    } else {
      canvas.style.cursor = 'grab';
    }
  }

  // Helper to find which AssemblyPart owns a RenderableObject (walking up hierarchy if needed)
  private findPartForObject(inputObj: RenderableObject): AssemblyPart | undefined {
    return this.parts.find(p => {
      // 1. Check direct equality
      if (p.object === inputObj) return true;

      // 2. Check native hierarchy (if inputObj is a child of p.object)
      // We assume nativeObject has a .parent property (standard in basic 3D engines like Three.js)
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
