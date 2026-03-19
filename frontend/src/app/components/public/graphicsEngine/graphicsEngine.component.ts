import { Component, ChangeDetectionStrategy, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnInit, signal, computed, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Vector3 } from '../../../engine/interfaces';
import { ApiService } from '../../../services/api.service';
import { Furniture } from '../../../types';
import { GraphicsHeader } from './graphics-header/graphics-header';
import { ArOverlay } from './ar-overlay/ar-overlay';
import { FooterControls } from './footer-controls/footer-controls';
import { ActivatedRoute } from '@angular/router'
import { AssemblyPart, AssemblyStep } from '../../../types/furniture.types';
import { Subject, Subscription, firstValueFrom, takeUntil } from 'rxjs';
import { ChatbotInteractionService } from '../../../services/chatbot-interaction.service';
import { EngineService } from '../../../services/graphicsEngine/engine.service';
import { SimulationService } from '../../../services/graphicsEngine/simulation.service';
import { FurnitureService } from '../../../services/graphicsEngine/furniture.service';
import { InteractionService } from '../../../services/graphicsEngine/interaction.service';

@Component({
  selector: 'app-graphics-engine',
  standalone: true,
  imports: [CommonModule, FormsModule, GraphicsHeader, ArOverlay, FooterControls],
  providers: [EngineService, SimulationService, FurnitureService, InteractionService],
  templateUrl: './graphicsEngine.component.html',
  styleUrls: ['./graphicsEngine.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphicsEngineComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  // INPUTS
  furnitureId = input<number | string>();
  furnitureName = input<string>('');

  // OUTPUTS
  arStateChange = output<boolean>();
  finished = output<void>();
  engineChanged = output<string>();

  // SIGNALS
  totalSteps = signal(0);
  manualStep = signal(0);
  isolatedPart = signal<AssemblyPart | null>(null);
  mode = signal<'manual' | 'simulation' | 'final'>('manual');
  isSmallScreen = signal(false);
  isCameraMoved = signal(false);
  stepDescriptions = signal<string[]>([]);
  showFooterControls = signal(true);
  currentLogicalStep = signal(0);
  isARActive = signal(false);

  // COMPUTED
  isSimulating = computed(() => this.mode() === 'simulation');
  isManualComplete = computed(() => this.manualStep() === this.totalSteps() - 1);

  currentStep = computed(() => {
    switch (this.mode()) {
      case 'manual': return this.manualStep();
      case 'simulation': return this.simulationService.simulationStep();
      case 'final': return this.totalSteps() - 1;
      default: return 0;
    }
  });

  stepsRatio = computed(() => {
    const total = this.totalSteps();
    const logical = this.furniture?.total_steps || this.stepDescriptions().length;
    return (total > 0 && logical > 0) ? total / logical : 1;
  });

  visibleSteps = computed(() => {
    const count = this.furniture?.total_steps || this.stepDescriptions().length;
    return count > 0 ? Array.from({ length: count }, (_, i) => i) : [];
  });

  useExternalModel = true;
  furniture?: Furniture;

  // PRIVATE STATE
  private parts: AssemblyPart[] = [];
  private stepsData = signal<AssemblyStep[]>([]);
  private lastProcessedStep = -1;
  private lastRotationConfig = { angle: null as number | null, axis: null as string | null };
  private animationFrameId: number | null = null;
  private resizeObserver!: ResizeObserver;
  private chatbotSub?: Subscription;
  private isViewInitialized = false;
  private preIsolationCameraState: { position: Vector3, target: Vector3 } | null = null;
  private destroy$ = new Subject<void>();

  get modelAssembly(): any {
    return this.apiService.getFurnitureAssemblyById(Number(this.furniture?.id));
  }

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private chatbotInteractionService: ChatbotInteractionService,
    public engineService: EngineService,
    public simulationService: SimulationService,
    public furnitureService: FurnitureService,
    public interactionService: InteractionService
  ) {
    effect(() => {
      const step = this.currentStep();
      const ratio = this.stepsRatio();

      const logicalStep = Math.floor(step / ratio);

      if (this.currentLogicalStep() !== logicalStep) {
        this.currentLogicalStep.set(logicalStep);
      }
    });
    effect(() => {
      const stepIndex = this.currentLogicalStep();
      const steps = this.stepsData();

      if (this.lastProcessedStep === stepIndex && steps.length > 0) return;
      this.lastProcessedStep = stepIndex;

      const engineFacade = this.engineService.getEngine();
      if (!engineFacade) return;

      if (this.mode() === 'final') {
        if (this.lastRotationConfig.angle !== null || this.lastRotationConfig.axis !== null) {
          engineFacade.resetControls();
          this.lastRotationConfig = { angle: null, axis: null };
        }
      } else if (steps.length > 0 && steps[stepIndex]) {
        const stepData = steps[stepIndex];
        const hasNewRotation = stepData.scene_camera_angle !== null && stepData.scene_camera_rotation_axis !== null;
        const rotationChanged = stepData.scene_camera_angle !== this.lastRotationConfig.angle ||
          stepData.scene_camera_rotation_axis !== this.lastRotationConfig.axis;

        if (rotationChanged) {
          if (hasNewRotation) {
            engineFacade.rotateCamera(
              stepData.scene_camera_rotation_axis as 'x' | 'y' | 'z',
              Number(stepData.scene_camera_angle)
            );
          } else {
            engineFacade.resetControls();
          }

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
    this.engineService.createEngineInstance();

    const ref = this.route.snapshot.params['ref'];

    this.apiService.getFurnitureById(ref)
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (f: any) => {

        this.furniture = f.data ? f.data : f;

        if (this.useExternalModel && this.isViewInitialized) {

          await this.initEngine();

          const furnitureData = await this.furnitureService.loadFurniture(String(ref));

          this.parts = furnitureData.parts;
          this.totalSteps.set(furnitureData.totalSteps);
          this.stepDescriptions.set(furnitureData.stepDescriptions);
          this.stepsData.set(furnitureData.sortedSteps);

          if (!this.animationFrameId) this.animate();
        }
      });

    this.chatbotSub = this.chatbotInteractionService.stepChange$.subscribe(({ furnitureRef, stepNumber }) => {
      if (this.mode() !== 'manual') {
        this.setMode('manual');
      }
      const targetLogicalIndex = Math.max(0, stepNumber - 1);
      this.goToStep(targetLogicalIndex);

    });
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
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.boundScreenResize);
    window.removeEventListener('resize', this.boundWindowResize);

    this.interactionService.dispose();

    if (this.chatbotSub) {
      this.chatbotSub.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
    this.engineService.dispose();
  }

  public get engineUse() { return this.engineService.engineUse; }
  public get isSimulationPaused() { return this.simulationService.isSimulationPaused; }
  public get simulationSpeed() { return this.simulationService.simulationSpeed; }

  public async onEngineChange(newEngine: string): Promise<void> {
    const newEngineType = newEngine === 'threejs' ? 'threeJS' : 'webGL';

    const changed = this.engineService.setEngineType(newEngineType);
    if (!changed) return;

    this.engineChanged.emit(newEngine);

    if (this.isViewInitialized) {
      this.engineService.dispose();
      this.parts = [];
      this.engineService.createEngineInstance();
      this.initEngine().then(() => {
        if (this.furniture) {
          this.createFurniture().then(() => {
            if (this.mode() === 'final') {
              this.parts.forEach(part => {
                part.object.setPosition(part.targetPosition.x, part.targetPosition.y, part.targetPosition.z);
              });
            }
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
      if (this.furniture?.reference_number) {
        this.apiService.changeStep(this.furniture.reference_number, targetStep).subscribe();
      }
    }
  }

  nextStep(): void {
    this.manualStep.update(step => (step < this.totalSteps() - 1 ? step + 1 : step));
    if (this.furniture?.reference_number) {
      this.apiService.changeStep(this.furniture.reference_number, this.currentLogicalStep()).subscribe();
    }
  }

  prevStep(): void {
    this.manualStep.update(step => (step > 0 ? step - 1 : step));
    if (this.furniture?.reference_number) {
      this.apiService.changeStep(this.furniture.reference_number, this.currentLogicalStep()).subscribe();
    }
  }

  reset(): void {
    this.manualStep.set(0);
    if (this.furniture?.reference_number) {
      this.apiService.changeStep(this.furniture.reference_number, 0).subscribe();
    }
  }

  openFinishModal(): void {
    this.finished.emit();
  }

  exitIsolation(): void {
    this.isolatedPart.set(null);
    const engineFacade = this.engineService.getEngine();
    if (this.preIsolationCameraState) {
      engineFacade.setCameraProps(
        this.preIsolationCameraState.position,
        this.preIsolationCameraState.target
      );
      this.preIsolationCameraState = null;
    } else {
      engineFacade.setCameraProps(engineFacade.getCamera().position, { x: 0, y: 1, z: 0 }); // Reset target
    }
  }

  resetCameraPosition(): void {
    this.engineService.getEngine().resetControls();
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
      this.simulationService.resetSimulation();
    } else if (newMode === 'final') {
      this.parts.forEach(part => {
        part.object.setPosition(part.targetPosition.x, part.targetPosition.y, part.targetPosition.z);
      });
    }

    const shouldRotate = newMode === 'simulation' && !this.simulationService.isSimulationPaused();
    this.engineService.getEngine().toggleControls(true, shouldRotate);
  }

  togglePause(): void {
    this.simulationService.isSimulationPaused.update(p => !p);
    this.engineService.getEngine().toggleControls(true, !this.simulationService.isSimulationPaused());
  }

  setSimulationSpeed(speed: number): void {
    this.simulationService.simulationSpeed.set(speed);
  }

  onArStateChange(isActive: boolean): void {
    this.isARActive.set(isActive);
    this.arStateChange.emit(isActive);
    if (!isActive) {
      const shouldRotate = this.mode() === 'simulation' && !this.simulationService.isSimulationPaused();
      const engineFacade = this.engineService.getEngine();
      if (engineFacade) {
        engineFacade.toggleControls(true, shouldRotate);
      }
    }
  }

  // PRIVATE METHODS

  private checkScreenSize(): void {
    this.isSmallScreen.set(window.innerWidth < 768);
  }

  private async initEngine(): Promise<void> {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;
    const { width, height } = container.getBoundingClientRect();
    await this.engineService.initEngine(canvas, width, height);
  }

  private setupEventListeners(): void {
    const canvas = this.canvasRef.nativeElement;

    this.interactionService.init(canvas, {
      getIsSimulating: () => this.isSimulating(),
      getMode: () => this.mode(),
      getIsARActive: () => this.isARActive(),
      getIsolatedPart: () => this.isolatedPart(),
      getCurrentStep: () => this.currentStep(),
      getParts: () => this.parts,
      isolatePart: (part) => this.isolatePart(part)
    });

    window.addEventListener('resize', this.boundWindowResize);
  }

  private async createFurniture(): Promise<void> {
    try {
      const furnitureId = Number(this.furniture?.id);
      const assemblyData: any = await firstValueFrom(this.apiService.getFurnitureAssemblyById(furnitureId));

      if (assemblyData && assemblyData.steps && assemblyData.steps.length > 0) {
        const { parts, totalSteps, stepDescriptions, sortedSteps } = await this.furnitureService.createPartsFromApi(assemblyData/*, baseModel*/);

        if (parts.length > 0) {
          this.parts = parts;
          this.totalSteps.set(totalSteps);
          this.stepDescriptions.set(stepDescriptions);
          this.stepsData.set(sortedSteps);
          return;
        }
      }
    } catch (error) {
      console.warn('Could not load or parse assembly steps from API, trying alternatives.', error);
    }
  }

  // START OF ANIMATE FUNCTIONS

  private updateCameraState(): void {
    const isMoved = this.engineService.getEngine().checkControlsState();
    if (this.isCameraMoved() !== isMoved) {
      this.isCameraMoved.set(isMoved);
    }
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    this.updateCameraState();
    if (this.isSimulating()) {
      this.simulationService.runSimulation(this.totalSteps());
    }
    const isolated = this.isolatedPart();
    if (isolated) {
      this.simulationService.handleIsolatedMode(isolated, this.parts);
    } else {
      const step = this.currentStep();
      this.simulationService.handleNormalMode(step, this.parts, this.mode());
    }
    this.engineService.render();
  }

  // END OF ANIMATE FUNCTIONS

  private onWindowResize(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    if (width > 0 && height > 0) {
      this.engineService.resize(width, height);
    }
  }

  private isolatePart(part: AssemblyPart): void {
    const engineFacade = this.engineService.getEngine();
    if (!this.isolatedPart()) {
      const cam = engineFacade.getCamera();
      this.preIsolationCameraState = {
        position: { ...cam.position },
        target: { ...cam.target }
      };
    }
    this.isolatedPart.set(part);
    const pos = part.object.getPosition();
    const closePos = { x: pos.x + 0.8, y: pos.y + 0.5, z: pos.z + 0.8 };
    engineFacade.setCameraProps(closePos, { x: pos.x, y: pos.y, z: pos.z });
  }
}