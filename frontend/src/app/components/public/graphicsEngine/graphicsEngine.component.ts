import { Component, ChangeDetectionStrategy, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnInit, signal, computed, input, output, effect, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EngineFacade, RenderableObject, Vector3, GeometryConfig, MaterialConfig } from '../../../engine/interfaces';
import { ApiService } from '../../../services/api.service';
import { Furniture } from '../../../types';
import { EngineSwitch } from '../engine-switch/engine-switch';
import { ActivatedRoute } from '@angular/router'
import { Modal } from '../../UI/modal/modal';
import { ThreeEngineAdapter } from '../../../engine/three/threeEngine';
import { WebGLEngineAdapter } from '../../../engine/webgl/webglEngine';
import { FurnitureAssembly, AssemblyStep, ScenePart , AssemblyPart } from '../../../types/furniture.types';
import { Subscription, firstValueFrom } from 'rxjs';
import { ChatbotInteractionService } from '../../../services/chatbot-interaction.service';

@Component({
  selector: 'app-graphics-engine',
  standalone: true,
  imports: [CommonModule, FormsModule, EngineSwitch],
  providers: [{ provide: EngineFacade, useClass: ThreeEngineAdapter }], // ⚠️
  templateUrl: './graphicsEngine.component.html',
  styleUrls: ['./graphicsEngine.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphicsEngineComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('video') private videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('stepsContainer') private stepsContainer!: ElementRef<HTMLElement>;

  @Output() engineChanged = new EventEmitter<string>();

  // INPUTS
  furnitureId = input<number | string>();
  furnitureName = input<string>('');
  //controlsMode        = input<'interactive' | 'display-only' | 'hidden'>('interactive');
  autoStartSimulation = input<boolean>(false);

  // OUTPUTS
  arStateChange = output<boolean>();
  finished = output<void>();

  // SIGNALS
  engineUse = signal<'threeJS' | 'webGL'>('webGL');
  totalSteps = signal(0);
  manualStep = signal(0);
  simulationStep = signal(0);
  isolatedPart = signal<ScenePart | null>(null);
  mode = signal<'manual' | 'simulation' | 'final'>('manual');
  isARActive = signal(false);
  arFlowState = signal<'idle' | 'requesting' | 'denied'>('idle');
  isSmallScreen = signal(false);
  backgroundColor = signal<'dark' | 'light'>('dark');
  isCameraMoved = signal(false);
  stepDescriptions = signal<string[]>([]);
  showFooterControls = signal(true);
  areControlsDisabled = signal(false);
  isSimulationPaused = signal(false);
  simulationSpeed = signal(1);

  // COMPUTED
  isSimulating = computed(() => this.mode() === 'simulation');
  isManualFirstStep = computed(() => this.manualStep() === 0);
  isManualComplete = computed(() => this.manualStep() === this.totalSteps() - 1);

  useExternalModel = true;
  furniture?: Furniture;

  // CONSTANTS
  readonly simulationSpeeds = [0.5, 1, 1.5, 2];

  // PRIVATE STATE
  private engine!: EngineFacade;
  private parts: ScenePart[] = [];
  private stepsData = signal<AssemblyStep[]>([]);
  private lastProcessedStep = -1;
  private lastRotationConfig = { angle: null as number | null, axis: null as string | null };
  private animationFrameId: number | null = null;
  private resizeObserver!: ResizeObserver;
  private simulationDirection = signal<'forward' | 'backward'>('forward');
  private lastStepTime = 0;
  private videoStream: MediaStream | null = null;
  private chatbotSub?: Subscription;
  private isViewInitialized = false;
  private preIsolationCameraState: { position: Vector3, target: Vector3 } | null = null;

  // PRIVATE CONSTANTS 
  private readonly SIMULATION_STEP_INTERVAL = 1500; // ms
  private readonly ARROW_FADE_SPEED = 0.02;

  // get modelUrl(): string {
  //   return this.furniture?.file_uri || '';
  // }

  get modelAssembly(): any {
    //return this.apiService.getFurnitureAssemblyById(Number(this.furniture?.id) || 6);
    return this.apiService.getFurnitureAssemblyById(Number(this.furniture?.id));

  }

  currentStep = computed(() => {
    switch (this.mode()) {
      case 'manual': return this.manualStep();
      case 'simulation': return this.simulationStep();
      case 'final': return this.totalSteps() - 1;
      default: return 0;
    }
  });

  stepsRatio = computed(() => {
    const total = this.totalSteps();
    const logical = this.furniture?.total_steps || this.stepDescriptions().length;
    return (total > 0 && logical > 0) ? total / logical : 1;
  });

  currentLogicalStep = computed(() => {
    return Math.floor(this.currentStep() / this.stepsRatio());
  });

  visibleSteps = computed(() => {
    const count = this.furniture?.total_steps || this.stepDescriptions().length;
    return count > 0 ? Array.from({ length: count }, (_, i) => i) : [];
  });

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private chatbotInteractionService: ChatbotInteractionService
  ) {
    effect(() => {
      const stepIndex = this.currentLogicalStep();
      const steps = this.stepsData();

      // Guard to only run when the logical step actually changes or data arrives
      if (this.lastProcessedStep === stepIndex && steps.length > 0) return;
      this.lastProcessedStep = stepIndex;

      // Scrolling logic
      setTimeout(() => this.centerActiveStep(), 100);

      // Camera rotation logic
      if (this.mode() === 'final') {
        if (this.lastRotationConfig.angle !== null || this.lastRotationConfig.axis !== null) {
          this.engine.resetControls();
          this.lastRotationConfig = { angle: null, axis: null };
        }
      } else if (steps.length > 0 && steps[stepIndex]) {
        const stepData = steps[stepIndex];
        const hasNewRotation =
          stepData.scene_camera_angle !== null
          && stepData.scene_camera_rotation_axis !== null;
        const rotationChanged =
          stepData.scene_camera_angle !== this.lastRotationConfig.angle ||
          stepData.scene_camera_rotation_axis !== this.lastRotationConfig.axis;

        if (rotationChanged) {
          if (hasNewRotation) {
            // Apply new rotation smoothly
            this.engine.rotateCamera(
              stepData.scene_camera_rotation_axis as 'x' | 'y' | 'z',
              Number(stepData.scene_camera_angle)
            );
          } else {
            // No rotation for this step, but previously there was one -> Reset
            this.engine.resetControls();
          }

          // Update last known rotation configuration
          this.lastRotationConfig = {
            angle: stepData.scene_camera_angle,
            axis: stepData.scene_camera_rotation_axis
          };
        }
      }
    });
  }


  private boundWindowResize = this.onWindowResize.bind(this);
  private boundScreenResize = () => this.checkScreenSize();

  ngOnInit(): void {
    this.createEngineInstance();

    let ref = this.route.snapshot.params['ref'];
    this.apiService.getFurnitureById(ref).subscribe((f: any) => {
      this.furniture = f.data ? f.data : f;
      //console.log('Furniture loaded:', this.furniture);

      if (this.useExternalModel && this.isViewInitialized) {
        // Wait for initEngine to complete before calling animate
        this.initEngine().then(() => {
          this.createFurniture().then(() => {
            if (!this.animationFrameId) this.animate();
          });
        });
      }
    });

    this.chatbotSub = this.chatbotInteractionService.stepChange$.subscribe(({ furnitureRef, stepNumber }) => {
      //console.log('Chatbot request received for step:', stepNumber, 'ref:', furnitureRef);
      // Optional: Verify furnitureRef matches this.furniture?.reference_number
      // But usually the viewer only shows one furniture at a time
      if (this.mode() !== 'manual') {
        this.setMode('manual');
      }

      // goToStep uses 0-based logical index, so we subtract 1 if stepNumber is 1-based
      const targetLogicalIndex = Math.max(0, stepNumber - 1);
      this.goToStep(targetLogicalIndex);
    });
  }

  private createEngineInstance(): void {
    if (this.engineUse() === 'webGL') {
      //console.log('Using WebGL Custom Engine');
      this.engine = new WebGLEngineAdapter();
    } else {
      //console.log('Using ThreeJS Adapter');
      this.engine = new ThreeEngineAdapter();
    }
  }

  ngAfterViewInit(): void {
    this.checkScreenSize();
    window.addEventListener('resize', this.boundScreenResize);

    this.resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        this.initEngine().then(() => {
          this.setupEventListeners();
          this.isViewInitialized = true;

          if (this.useExternalModel) {
            if (this.furniture) {
              this.createFurniture().then(() => this.animate());
            }
          }

          if (this.autoStartSimulation()) {
            this.setMode('simulation');
          }

          this.resizeObserver.disconnect();
        });
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
    window.removeEventListener('resize', this.boundScreenResize);
    window.removeEventListener('resize', this.boundWindowResize);

    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      canvas.removeEventListener('pointermove', this.onPointerMove);
      canvas.removeEventListener('pointerdown', this.onPointerDown);
      canvas.removeEventListener('pointerup', this.onPointerUp);
      canvas.removeEventListener('pointerleave', this.onPointerUp);
    }

    if (this.chatbotSub) {
      this.chatbotSub.unsubscribe();
    }

    this.engine?.dispose();
  }

  public async onEngineChange(newEngine: string): Promise<void> {
    const newEngineType = newEngine === 'threejs' ? 'threeJS' : 'webGL';
    if (this.engineUse() === newEngineType) return;

    console.log('Switching engine to:', newEngine);
    this.engineUse.set(newEngineType);
    this.engineChanged.emit(newEngine);

    if (this.isViewInitialized) {
      this.engine?.dispose();
      this.parts = [];
      this.createEngineInstance();
      this.initEngine().then(() => {
        if (this.furniture) {
          this.createFurniture().then(() => {
            if (!this.animationFrameId) this.animate();
          });
        }
      });
    }
  }

  goToStep(logicalStepIndex: number): void {
    const ratio = this.stepsRatio();
    const targetStep = logicalStepIndex * ratio;
    if (targetStep >= 0 && targetStep < this.totalSteps()) {
      this.manualStep.set(targetStep);
    }
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
    this.finished.emit();
  }



  exitIsolation(): void {
    this.isolatedPart.set(null);
    if (this.preIsolationCameraState) {
      this.engine.setCameraProps(
        this.preIsolationCameraState.position,
        this.preIsolationCameraState.target
      );
      this.preIsolationCameraState = null;
    } else {
      this.engine.setCameraProps(this.engine.getCamera().position, { x: 0, y: 1, z: 0 }); // Reset target
    }
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
    if (this.mode() === 'final' && newMode === 'final') {
      newMode = 'manual';
    };
    if (this.mode() === newMode) return;

    this.mode.set(newMode);
    
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

    const shouldRotate = newMode === 'simulation' && !this.isSimulationPaused();
    this.engine.toggleControls(true, shouldRotate);
  }

  togglePause(): void {
    this.isSimulationPaused.update(p => !p);
    this.engine.toggleControls(true, !this.isSimulationPaused());
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

  // PRIVATE METHODS

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
    const shouldRotate = this.mode() === 'simulation' && !this.isSimulationPaused();
    this.engine.toggleControls(true, shouldRotate);
  }

  private async initEngine(): Promise<void> {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;
    const { width, height } = container.getBoundingClientRect();

    // this.engine.init(canvas, width, height);
    await this.engine.init(canvas, width, height);
    this.engine.setControlsAutoRotateSpeed(1.0);
  }

  // Variables para la lógica de aislar una pieza
  private pressTimer: any;
  private isPointerDown = false;
  private pointerDownPos = { x: 0, y: 0 };
  private readonly LONG_PRESS_DURATION = 500; // ms

  private setupEventListeners(): void {
    const canvas = this.canvasRef.nativeElement;

    // Use property reassignment for binding to match existing method structure
    const originalMove = this.onPointerMove;
    const originalDown = this.onPointerDown;
    const originalUp = this.onPointerUp;

    this.onPointerMove = originalMove.bind(this);
    this.onPointerDown = originalDown.bind(this);
    this.onPointerUp = originalUp.bind(this);

    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointerleave', this.onPointerUp);
    window.addEventListener('resize', this.boundWindowResize);
  }

  private async createFurniture(): Promise<void> {

    let baseModel: RenderableObject | undefined;

    // 0. Pre-load the base model if available (shared for both API assembly and single-model rollback)
    // if (this.modelUrl) {
    //   try {
    //     //console.log('Pre-loading base GLTF model from URL:', this.modelUrl);
    //     baseModel = await this.engine.loadGLTF(this.modelUrl);
    //     // Ensure it's in the scene to find parts, though we might toggle visibility later
    //     baseModel.setPosition(0, 0, 0);
    //     baseModel.castShadow = true;
    //     baseModel.receiveShadow = true;
    //     this.engine.addToScene(baseModel);
    //   } catch (error) {
    //     //console.error('Error pre-loading base model:', error);
    //   }
    // }

    // 1. Attempt to load from API Assembly Steps
    try {
      const furnitureId = Number(this.furniture?.id) || 6;
      const assemblyData = await firstValueFrom(this.apiService.getFurnitureAssemblyById(furnitureId));

      console.log('assemblyData: ' + assemblyData);


      if (assemblyData && assemblyData.steps && assemblyData.steps.length > 0) {
        //console.log('Loading assembly from API for furniture ID:', furnitureId);
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

    if (this.useExternalModel && baseModel) { // ⚠️
      //console.log('Using standard external model mode.');
      this.totalSteps.set(1);
      this.stepDescriptions.set(['Visualización del modelo']);
      this.setMode('final');
      return;
    }
  }

  private async createPartsFromApi(data: FurnitureAssembly, baseModel?: RenderableObject): Promise<{ parts: ScenePart[], totalSteps: number, stepDescriptions: string[] }> {

    console.log(`CREATE PARTS FROM API`);


    const parts: ScenePart[] = [];
    const stepDescriptions: string[] = [];
    let currentStepIndex = 0;

    // Generic material configuration
    const defaultMaterial: MaterialConfig = { type: 'standard', color: 0xCCCCCC, roughness: 0.8, metalness: 0.1 };

    // Sort steps by step_number just in case
    const sortedSteps = data.steps.sort((a, b) => a.step_number - b.step_number);
    this.stepsData.set(sortedSteps);

    for (const step of sortedSteps) {
      // description
      const description =
        step.description
        || `Paso ${step.step_number}: Ensamblaje de partes.`;
      stepDescriptions.push(description);

      // Calculate appear and join steps
      const appearStep = currentStepIndex * 2;
      const joinStep = appearStep + 1;

      // iterate step parts
      for (const part of step.parts) {
        let mesh: RenderableObject | null = null;
        //let targetPos = { x: 0, y: 0, z: 0 }; // ⚠️ !!
        //let usingExistingMesh = false;

        if (part.file_uri) { 
          try {
            mesh = await this.engine.loadGLTF(part.file_uri);
          } catch (e) {
            console.log(`Failed to load part GLTF: ${part.file_uri}`, e);
            console.error(`Failed to load part GLTF: ${part.file_uri}`, e);
          }
        }

        // if (!mesh && baseModel && part.reference_number) {
        //   // Case B: Look for part in baseModel by reference number
        //   // Access native object (THREE.Object3D) to traverse/find
        //   // We assume reference_number matches the node name in GLTF
        //   const nativeRoot = baseModel.nativeObject;
        //   const foundNative = nativeRoot.getObjectByName(part.reference_number);

        //   if (foundNative) {
        //     mesh = this.engine.wrapNativeObject(foundNative);
        //     usingExistingMesh = true;
        //     // Capture its current assembled position (Target)
        //     // Note: getPosition() returns world or local? 
        //     // EngineFacade.getPosition() wraps native .position (local).
        //     // If the hierarchy is flat or we just want local animation, this is fine.
        //     targetPos = mesh.getPosition();
        //   } else {
        //     console.warn(`Part with reference '${part.reference_number}' not found in base model.`);
        //   }
        // }

        if (!mesh) {
          console.warn(`[Assembly] Skipping missing part '${part.reference_number}'`);
          continue;
        }

        // If we created a new mesh (Case A or C), we need to add it to scene.
        // If we found an existing mesh (Case B), it's already in the scene (as child of baseModel).
        // However, for animation, if we want to move it freely, we might need to detach it or just move it relative to parent.
        // The animation logic uses mesh.setPosition(). 

        // if (!usingExistingMesh) {
        //   this.engine.addToScene(mesh);
        //   mesh.castShadow = true;
        //   mesh.receiveShadow = true;
        // }

        this.engine.addToScene(mesh);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.setVisible(false);

        // Calculate start position based on axis and distance
        const offsetDistance = part.distance;
        const offsetAxis = part.axis;
        const position = { x: part.pos_x, y: part.pos_y, z: part.pos_z };

        const startPos = this.calculateOffsetPosition({ ...position }, offsetDistance, offsetAxis);

        // Set initial state to START position
        mesh.setPosition(startPos.x, startPos.y, startPos.z);

        const scenePart: ScenePart  = {
          object: mesh,
          startPosition: startPos,
          targetPosition: position,
          appearStep,
          joinStep,
          name: part.reference_number || `Part ${part.part_id}`,
          description: `Part: ${part.reference_number}`
        };

        // FLECHAS

        // const targetArrowPos = {
        //   x: part.pos_x,
        //   y: part.pos_y,
        //   z: part.pos_z
        // };

        const arrowPosition = { x: 0, y: 0, z: 0 }; // ⚠️ AQUI IRÁ EL OFFSET
        const length = Math.abs(offsetDistance)

        if (length > 0.01) {

          let dir = { x: 0, y: 0, z: 0 };
          if (offsetAxis === 'x') dir.x = 1;
          if (offsetAxis === 'y') dir.y = 1;
          if (offsetAxis === 'z') dir.z = 1;

          const sign = -(Math.sign(offsetDistance));
          dir.x *= sign;
          dir.y *= sign;
          dir.z *= sign;

          scenePart.arrow = await this.engine.createArrowHelper(
            //arrowDir,
            dir,
            arrowPosition,
            length,
            0x00ffff
          );

          scenePart.object.add(scenePart.arrow);
        }

        console.log(`Part: ${part.reference_number} | start: ${JSON.stringify(startPos)} | target: ${JSON.stringify(position)}`);
        parts.push(scenePart);
      }
      currentStepIndex++;
    }

    const totalSteps = currentStepIndex * 2;
    return { parts, totalSteps, stepDescriptions };
  }

  private calculateOffsetPosition(position: { x: number, y: number, z: number }, offsetDistance: number, offsetAxistance: string) {
    if (offsetAxistance === 'x') position.x += offsetDistance;
    else if (offsetAxistance === 'y') position.y += offsetDistance;
    else if (offsetAxistance === 'z') position.z += offsetDistance;
    else position.y += offsetDistance; // Default
    return position;
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

  // START OF ANIMATE FUNCTIONS

  private updateCameraState(): void {
    const isMoved = this.engine.checkControlsState();
    if (this.isCameraMoved() !== isMoved) {
      this.isCameraMoved.set(isMoved);
    }
  }

  private handleIsolatedMode(isolated: any): void {
    this.parts.forEach(part => {
      const isTarget = part === isolated;
      part.object.setVisible(isTarget);
      if (part.arrow) { part.arrow.setVisible(false); }
    });
    this.engine.setHighlight([isolated.object]);
  }

  private handleNormalMode(step: number): void {
    const partsToHighlight: RenderableObject[] = [];
    for (const part of this.parts) {
      if (this.needsHighlight(part, step)) {
        partsToHighlight.push(part.object);
      }
      this.updateArrowVisibility(part, step);
      this.updatePartMovement(part, step);
      this.updatePartVisibility(part, step);
    }
    this.engine.setHighlight(partsToHighlight);
  }

  private needsHighlight(part: any, step: number): boolean {
    // if (part.appearStep === step) {
    //   return true;
    // }
    // return this.isMovingToTarget(part);
      if (part.appearStep === step) return true;
      if (step > part.appearStep && step <= part.joinStep) {
        return this.isMovingToTarget(part);
      }
      return false;
  }

  private isMovingToTarget(part: any): boolean {
    const currentPos = part.object.getPosition();
    const distToTarget = this.getDistance(currentPos, part.targetPosition);
    return (distToTarget > 0.01);
  }

  private getDistance(a: any, b: any): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private updateArrowVisibility(part: any, step: number): void {
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

  private updatePartMovement(part: any, step: number): void {
    if (this.mode() === 'final') return;
    const target =
      step >= part.joinStep
        ? part.targetPosition
        : part.startPosition;
    const current = part.object.getPosition();
    const alpha = 0.04;
    part.object.setPosition(
      current.x + (target.x - current.x) * alpha,
      current.y + (target.y - current.y) * alpha,
      current.z + (target.z - current.z) * alpha
    );
  }

  private updatePartVisibility(part: any, step: number): void {
    const hasAppeared = step >= part.appearStep;
    return part.object.setVisible(hasAppeared);
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    this.updateCameraState();
    if (this.isSimulating()) {
      this.runSimulation();
    }
    const isolated = this.isolatedPart();
    if (isolated) {
      this.handleIsolatedMode(isolated);
    } else {
      const step = this.currentStep();
      this.handleNormalMode(step);
    }
    this.engine.render();
  }

  // END OF ANIMATE FUNCTIONS

  private onWindowResize(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    if (width > 0 && height > 0) {
      this.engine.resize(width, height);
    }
  }

  private isolatePart(part: ScenePart): void {
    if (!this.isolatedPart()) {
      const cam = this.engine.getCamera();
      this.preIsolationCameraState = {
        position: { ...cam.position },
        target: { ...cam.target }
      };
    }
    this.isolatedPart.set(part);
    // Move controls target to object position and get closer
    const pos = part.object.getPosition();
    const closePos = { x: pos.x + 1.5, y: pos.y + 1, z: pos.z + 1.5 };
    this.engine.setCameraProps(closePos, { x: pos.x, y: pos.y, z: pos.z });
  }

  private onPointerDown(event: PointerEvent): void {
    if (this.isSimulating() || this.mode() === 'final' || this.isARActive() || this.isolatedPart()) return;

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
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const hitObject = this.engine.raycast(x, y);

    if (hitObject) {
      const part = this.findPartForObject(hitObject);
      if (part && this.currentStep() >= part.appearStep) {
        this.isolatePart(part);
      }
    }
  }

  onCanvasInteraction(): void {
    // Prevent default browser behavior if needed, or trigger specific app logic
  }

  private onPointerMove(event: PointerEvent): void {
    if (this.isSimulating() || this.mode() === 'final' || this.isARActive()) return;

    if (this.isPointerDown) {
      // If the user moves the pointer significantly, cancel the long press
      const dx = Math.abs(event.clientX - this.pointerDownPos.x);
      const dy = Math.abs(event.clientY - this.pointerDownPos.y);
      if (dx > 15 || dy > 15) { // Increased threshold for touch devices
        this.isPointerDown = false;
        if (this.pressTimer) {
          clearTimeout(this.pressTimer);
          this.pressTimer = null;
        }
      }
    }

    const canvas = this.canvasRef.nativeElement;

    if (this.isolatedPart()) {
      canvas.style.setProperty('cursor', 'grab', 'important');
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const hitObject = this.engine.raycast(x, y);

    if (hitObject) {
      const part = this.findPartForObject(hitObject);
      if (part && this.currentStep() >= part.appearStep) {
        canvas.style.setProperty('cursor', 'pointer', 'important');
      } else {
        canvas.style.setProperty('cursor', 'grab', 'important');
      }
    } else {
      canvas.style.setProperty('cursor', 'grab', 'important');
    }
  }

  // Helper to find which AssemblyPart owns a RenderableObject (walking up hierarchy if needed)
  private findPartForObject(inputObj: RenderableObject): ScenePart | undefined {
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
