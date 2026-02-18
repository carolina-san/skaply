

import { Component, ChangeDetectionStrategy, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnInit, signal, computed, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EngineFacade, RenderableObject, Vector3, GeometryConfig, MaterialConfig } from '../../engine/interfaces';
import { ApiService } from '../../services/api.service';
import { Furniture } from '../../types';
import { Modal } from '../modal/modal';
import { ActivatedRoute } from '@angular/router'

import { ThreeEngineAdapter } from '../../engine/three/threeEngine';
import { WebGLEngine } from '../../engine/webgl/webglEngine';
import { FurnitureAssembly, AssemblyStep, AssemblyPartRef, AssemblyPart } from '../../types/furniture.types';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-graphics-engine',
  standalone: true,
  imports: [CommonModule, Modal, FormsModule],
  templateUrl: './graphicsEngine.component.html',
  styleUrls: ['./graphicsEngine.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphicsEngineComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('video') private videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('stepsContainer') private stepsContainer!: ElementRef<HTMLElement>;

  private engine!: EngineFacade;

  constructor(private apiService: ApiService, private route: ActivatedRoute) {
    effect(() => {
      // Track changes to logical step
      const step = this.currentLogicalStep();

      // Execute scroll after render
      setTimeout(() => {
        this.centerActiveStep();
      }, 100);
    });
  }

  furnitureId = input<number | string>();
  furnitureName = input<string>('');
  arStateChange = output<boolean>();

  // Elegir el tipo de motor
  engineUse = signal<'threeJS' | 'webGL'>('webGL');
  // Configuración de modelo
  useExternalModel = true; // Cambiar a true para cargar modelo externo
  furniture?: Furniture; // Mueble cargado desde API
  get modelUrl(): string {
    return this.furniture?.file_uri || '';
  }

  controlsMode = input<'interactive' | 'display-only' | 'hidden'>('interactive');
  autoStartSimulation = input<boolean>(false);
  showHeader = computed(() => this.controlsMode() === 'interactive');
  showFooterControls = computed(() => this.controlsMode() !== 'hidden');
  areControlsDisabled = computed(() => this.controlsMode() === 'display-only');

  get modelAssembly(): any {
    return this.apiService.getFurnitureAssemblyById(Number(this.furniture?.id) || 6);
  }


  totalSteps = signal(0);
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
        return this.totalSteps() - 1;
      default:
        return 0;
    }
  });

  // Ratio between total animation states and logical steps (usually 2:1)
  stepsRatio = computed(() => {
    const total = this.totalSteps();
    const descriptions = this.stepDescriptions().length;
    return (total > 0 && descriptions > 0) ? total / descriptions : 1;
  });

  currentLogicalStep = computed(() => {
    return Math.floor(this.currentStep() / this.stepsRatio());
  });

  visibleSteps = computed(() => {
    // Show one bubble per logical step (based on descriptions)
    return this.stepDescriptions().length > 0
      ? Array.from({ length: this.stepDescriptions().length }, (_, i) => i)
      : [];
  });

  goToStep(logicalStepIndex: number): void {
    const ratio = this.stepsRatio();
    // Jump to the start of the logical step
    const targetStep = logicalStepIndex * ratio;
    if (targetStep >= 0 && targetStep < this.totalSteps()) {
      this.manualStep.set(targetStep);
    }
  }

  isSimulating = computed(() => this.mode() === 'simulation');

  isManualFirstStep = computed(() => this.manualStep() === 0);
  isManualComplete = computed(() => this.manualStep() === this.totalSteps() - 1);

  isSimulationPaused = signal(false);
  simulationSpeed = signal(1);
  readonly simulationSpeeds = [0.5, 1, 1.5, 2];

  backgroundColor = signal<'dark' | 'light'>('dark');
  isCameraMoved = signal(false);
  isModalOpen = signal(false);
  reviewStars = signal(0);
  reviewText = signal('');
  isSubmittingReview = signal(false);

  stepDescriptions = signal<string[]>([]);


  private parts: AssemblyPart[] = [];
  private animationFrameId: number | null = null;
  private resizeObserver!: ResizeObserver;

  private simulationDirection = signal<'forward' | 'backward'>('forward');
  private lastStepTime = 0;
  private readonly SIMULATION_STEP_INTERVAL = 1500; // ms
  private videoStream: MediaStream | null = null;

  private initialCameraState: any = null; // Store initial state manually if needed
  private isViewInitialized = false;

  ngOnInit(): void {
    // Initialize Engine based on signal
    if (this.engineUse() === 'webGL') {
      console.log('Using WebGL Custom Engine');
      this.engine = new WebGLEngine();
    } else {
      console.log('Using ThreeJS Adapter');
      this.engine = new ThreeEngineAdapter();
    }

    let ref = this.route.snapshot.params['ref'];
    // Cargar mueble por defecto (ID 1) si no se pasa nada, o usar el input si existiera lógica para ello
    this.apiService.getFurnitureById(ref).subscribe((f: any) => {
      this.furniture = f.data ? f.data[0] : f;
      console.log('Furniture loaded:', this.furniture);

      if (this.useExternalModel && this.isViewInitialized) {
        this.createFurniture().then(() => {
          if (!this.animationFrameId) this.animate();
        });
      }
    });
  }

  ngAfterViewInit(): void {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());

    this.resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        this.initThree();
        this.isViewInitialized = true;

        if (this.useExternalModel) {
          // Si ya tenemos datos, creamos el mueble. Si no, esperamos a ngOnInit
          if (this.furniture) {
            this.createFurniture().then(() => this.animate());
          }
        }

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
    this.manualStep.update(step => (step < this.totalSteps() - 1 ? step + 1 : step));
  }

  prevStep(): void {
    this.manualStep.update(step => (step > 0 ? step - 1 : step));
  }

  reset(): void {
    this.manualStep.set(0);
  }

  openFinishModal(): void {
    this.isModalOpen.set(true);
    this.reviewStars.set(0);
    this.reviewText.set('');
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.reviewStars.set(0);
    this.reviewText.set('');
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

  private centerActiveStep(): void {
    if (!this.stepsContainer?.nativeElement) return;

    const container = this.stepsContainer.nativeElement;
    const activeIndex = this.currentLogicalStep();
    const buttons = container.querySelectorAll('button');

    if (buttons[activeIndex]) {
      buttons[activeIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
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
      this.setMode('manual');

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
  private async createFurniture(): Promise<void> {

    let baseModel: RenderableObject | undefined;

    // 0. Pre-load the base model if available (shared for both API assembly and single-model rollback)
    if (this.modelUrl) {
      try {
        console.log('Pre-loading base GLTF model from URL:', this.modelUrl);
        baseModel = await this.engine.loadGLTF(this.modelUrl);
        // Ensure it's in the scene to find parts, though we might toggle visibility later
        baseModel.setPosition(0, 0, 0);
        baseModel.castShadow = true;
        baseModel.receiveShadow = true;
        this.engine.addToScene(baseModel);
        console.log('[GLB NAMES]', baseModel.nativeObject.getObjectNames());
      } catch (error) {
        console.error('Error pre-loading base model:', error);
      }
    }

    // 1. Attempt to load from API Assembly Steps
    try {
      const furnitureId = Number(this.furniture?.id) || 6;
      const assemblyData = await firstValueFrom(this.apiService.getFurnitureAssemblyById(furnitureId));

      if (assemblyData && assemblyData.steps && assemblyData.steps.length > 0) {
        console.log('Loading assembly from API for furniture ID:', furnitureId);
        // Pass the pre-loaded baseModel to find parts inside it
        const { parts, totalSteps, stepDescriptions } = await this.createPartsFromApi(assemblyData, baseModel);

        // If we found parts, we use them.
        // If the baseModel was loaded but NO parts were matched/found inside it (and no external files),
        // createPartsFromApi might return placeholders. 
        // We assume valid configuration if parts.length > 0.

        if (parts.length > 0) {
          this.parts = parts;
          this.totalSteps.set(totalSteps);
          this.stepDescriptions.set(stepDescriptions);

          // If we successfully set up the assembly from the API, we keep the baseModel in the scene?
          // If the parts are children of baseModel, they are already in the scene.
          // If we use specific parts, we might want to hide the "rest" of the baseModel if it contains duplicates?
          // Usually, if we extracting parts, we are manipulating them.
          // If the baseModel is just a container, it's fine.
          return;
        }
      }
    } catch (error) {
      console.warn('Could not load or parse assembly steps from API, trying alternatives.', error);
    }

    if (this.useExternalModel && baseModel) {
      console.log('Using standard external model mode.');
      this.totalSteps.set(1);
      this.stepDescriptions.set(['Visualización del modelo']);
      this.setMode('final');
      return;
    }
  }

  private async createPartsFromApi(data: FurnitureAssembly, baseModel?: RenderableObject): Promise<{ parts: AssemblyPart[], totalSteps: number, stepDescriptions: string[] }> {
    const parts: AssemblyPart[] = [];
    const stepDescriptions: string[] = [];
    let currentStepIndex = 0;

    // Generic material configuration
    const defaultMaterial: MaterialConfig = { type: 'standard', color: 0xCCCCCC, roughness: 0.8, metalness: 0.1 };

    // Sort steps by step_number just in case
    const sortedSteps = data.steps.sort((a, b) => a.step_number - b.step_number);

    for (const step of sortedSteps) {
      const description = step.description || `Paso ${step.step_number}: Ensamblaje de partes.`;
      stepDescriptions.push(description);

      // Calculate appear and join steps
      const appearStep = currentStepIndex * 2;
      const joinStep = appearStep + 1;

      for (const partRef of step.parts) {
        let mesh: RenderableObject | null = null;
        let targetPos = { x: 0, y: 0, z: 0 };
        let usingExistingMesh = false;

        if (partRef.file_uri) {
          // Case A: Part has its own file
          try {
            mesh = await this.engine.loadGLTF(partRef.file_uri);
          } catch (e) {
            console.error(`Failed to load part GLTF: ${partRef.file_uri}`, e);
            console.error('file_uri que falla:', partRef.file_uri);
          }
        }

        if (!mesh && baseModel && partRef.reference_number) {
          // Case B: Look for part in baseModel by reference number
          // Access native object (THREE.Object3D) to traverse/find
          // We assume reference_number matches the node name in GLTF
          const nativeRoot = baseModel.nativeObject;
          const foundNative = nativeRoot.getObjectByName(partRef.reference_number);

          if (foundNative) {
            mesh = this.engine.wrapNativeObject(foundNative);
            usingExistingMesh = true;
            // Capture its current assembled position (Target)
            // Note: getPosition() returns world or local? 
            // EngineFacade.getPosition() wraps native .position (local).
            // If the hierarchy is flat or we just want local animation, this is fine.
            targetPos = mesh.getPosition();
          } else {
            console.warn(`Part with reference '${partRef.reference_number}' not found in base model.`);
          }
        }

        if (!mesh) {
          // Case C: Fallback placeholder
          console.warn(`[Assembly] Skipping missing part '${partRef.reference_number}'`);
          continue;
        }

        // If we created a new mesh (Case A or C), we need to add it to scene.
        // If we found an existing mesh (Case B), it's already in the scene (as child of baseModel).
        // However, for animation, if we want to move it freely, we might need to detach it or just move it relative to parent.
        // The animation logic uses mesh.setPosition(). 

        if (!usingExistingMesh) {
          this.engine.addToScene(mesh);
        }

        // Calculate start position based on axis and distance
        const startPos = { ...targetPos };
        const dist = partRef.distance; // default distance

        console.log("distancia en paso: ", currentStepIndex, " es: ", dist);

        if (partRef.axis === 'x') startPos.x += dist;
        else if (partRef.axis === 'y') startPos.y += dist;
        else if (partRef.axis === 'z') startPos.z += dist;
        else startPos.y += dist; // Default

        // Set initial state to START position
        mesh.setPosition(startPos.x, startPos.y, startPos.z);
        if (!usingExistingMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
        // Ensure visibility is managed by animation loop, but initially...
        // The animation loop sets visibility based on steps.

        const assemblyPart: AssemblyPart = {
          object: mesh,
          startPosition: startPos,
          targetPosition: targetPos,
          appearStep,
          joinStep,
          name: partRef.reference_number || `Part ${partRef.part_id}`,
          description: `Part: ${partRef.reference_number}`
        };

        // Arrow helper logic (simplified)
        if (dist > 0.01) {
          const dir = { x: targetPos.x - startPos.x, y: targetPos.y - startPos.y, z: targetPos.z - startPos.z };
          const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
          if (len > 0) {
            const arrowDir = { x: dir.x / len, y: dir.y / len, z: dir.z / len };
            assemblyPart.arrow = this.engine.createArrowHelper(arrowDir, { x: 0, y: 0, z: 0 }, 0.5, 0x00ffff);
            assemblyPart.object.add(assemblyPart.arrow);
          }
        }

        parts.push(assemblyPart);
      }
      currentStepIndex++;
    }

    return { parts, totalSteps: currentStepIndex * 2, stepDescriptions };
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
        if (this.simulationStep() >= this.totalSteps() - 1) {
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

      this.engine.render();
    }
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

  onCanvasInteraction(): void {
    // Prevent default browser behavior if needed, or trigger specific app logic
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


  setRating(stars: number): void {
    this.reviewStars.set(stars);
  }

  submitReview(): void {
    // Obtener y convertir el furniture ID
    let furnitureId = 1; // ID por defecto
    const inputId = this.furnitureId();

    if (inputId) {
      const parsedId = typeof inputId === 'string' ? parseInt(inputId, 10) : inputId;
      if (!isNaN(parsedId) && parsedId > 0) {
        furnitureId = parsedId;
      }
    }

    const stars = this.reviewStars();
    const text = this.reviewText().trim();

    if (stars === 0) {
      return;
    }

    this.isSubmittingReview.set(true);

    this.apiService.postReview(furnitureId, stars, text || undefined).subscribe({
      next: (response) => {
        this.isSubmittingReview.set(false);
        this.closeModal();
        alert('¡Gracias por tu reseña!');
      },
      error: (error) => {
        console.error('Error al guardar la review:', error);
        console.error('Error completo:', JSON.stringify(error, null, 2));
        this.isSubmittingReview.set(false);
        const errorMessage = error.error?.message || error.message || 'Error desconocido';
        alert('Error al guardar la reseña: ' + errorMessage);
      }
    });
  }
}
