import { Component, ChangeDetectionStrategy, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnInit, signal, computed, input, output, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Vector3, RenderableObject } from '../../../engine/interfaces';
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
import { VoiceControlService } from '../../../services/graphicsEngine/voice-control.service';
import { SpinnerComponent } from '../../UI/spinner/spinner';

@Component({
  selector: 'app-graphics-engine',
  standalone: true,
  imports: [CommonModule, FormsModule, GraphicsHeader, ArOverlay, FooterControls, SpinnerComponent],
  providers: [EngineService, SimulationService, FurnitureService, InteractionService, VoiceControlService],
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
  isCameraMoved!: import('@angular/core').Signal<boolean>;
  stepDescriptions = signal<string[]>([]);
  showFooterControls = signal(true);
  isARActive = signal(false);
  isWhiteBg = signal(false);
  isLoading = signal(true);

  // COMPUTED
  isSimulating = computed(() => this.mode() === 'simulation');
  isManualComplete = computed(() => this.manualStep() === this.totalSteps() - 1);

  logicalStep = computed(() => {
    const step = this.currentStep();
    const ratio = this.stepsRatio();
    return Math.floor(step / ratio);
  });

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
  private furnitureRoot: RenderableObject | null = null;
  private parts: AssemblyPart[] = [];
  private stepsData = signal<AssemblyStep[]>([]);
  //private lastProcessedStep = -1;
  private lastFramedStep = -1;
  private lastRotationConfig = { angle: null as number | null, axis: null as string | null };
  private animationFrameId: number | null = null;
  private resizeObserver!: ResizeObserver;
  private chatbotSub?: Subscription;
  private isViewInitialized = false;
  private preIsolationCameraState: { position: Vector3, target: Vector3 } | null = null;
  private triggerFrame = signal(0);
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
    public interactionService: InteractionService,
    public voiceControlService: VoiceControlService
  ) {
    this.isCameraMoved = this.interactionService.isUserManuallyMoved;

    effect(() => {
      this.triggerFrame(); // Depend on triggerFrame
      const engine = this.engineService.getEngine();
      if (!engine) return;

      const mode = this.mode();
      const stepIndex = this.logicalStep();
      const steps = this.stepsData();
      const lastRotAngle = this.lastRotationConfig.angle;
      const lastRotAxis = this.lastRotationConfig.axis;

      console.log('stepIndex: ' + stepIndex);
      console.log('mode: ' + mode);
      console.log('lastRotAngle: ' + lastRotAngle);
      console.log('lastRotAxis: ' + lastRotAxis);

      if (mode === 'final') {
        if (lastRotAngle !== null || lastRotAxis !== null) {
          this.lastRotationConfig = { angle: null, axis: null };
        }

        if (this.furnitureRoot && this.lastFramedStep !== -2) {
          this.lastFramedStep = -2;
          this.interactionService.resetUserManuallyMoved();
          engine.frameObjectFromParts(
            this.parts.map(p => ({
              currentPosition: p.targetPosition,
              nativeObject: p.object
            }))
          );
        }
        return;
      }

      const currentStep = this.currentStep();
      let didFrame = false;

      // framing the objects
      if (this.furnitureRoot && !this.isolatedPart() && this.lastFramedStep !== currentStep) {
        this.lastFramedStep = currentStep;
        engine.frameObjectFromParts(
          this.parts
            .filter(p => p.appearStep <= currentStep)
            .map(p => ({
              currentPosition: p.object.getPosition(),
              nativeObject: p.object
            }))
        );
        didFrame = true;
      }

      // rotation 
      const stepData = steps[stepIndex];
      if (!stepData) return;

      const stepAngle = stepData.scene_camera_angle;
      const stepAxis = stepData.scene_camera_rotation_axis;

      const hasNewRotation = stepAngle !== null && stepAxis !== null;
      const rotationChanged = stepAngle !== lastRotAngle || stepAxis !== lastRotAxis;

      if (rotationChanged || (didFrame && hasNewRotation)) {
        if (hasNewRotation) {
          engine.rotateCamera(stepAxis as 'x' | 'y' | 'z', Number(stepAngle));
          this.interactionService.resetUserManuallyMoved();
        } else if (rotationChanged) {
          if (!this.interactionService.hasUserManuallyMoved()) {
            engine.resetControls();
          }
        }
        this.lastRotationConfig = { angle: stepAngle, axis: stepAxis };
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
          this.furnitureRoot = furnitureData.furnitureRoot;
          this.parts = furnitureData.parts;
          this.totalSteps.set(furnitureData.totalSteps);
          this.stepDescriptions.set(furnitureData.stepDescriptions);
          this.stepsData.set(furnitureData.sortedSteps);
          this.isLoading.set(false);

          if (!this.animationFrameId) this.animate();
        } else if (!this.useExternalModel) {
          this.isLoading.set(false);
        }
      });

    this.chatbotSub = this.chatbotInteractionService.stepChange$.subscribe(({ furnitureRef, stepNumber }) => {
      if (this.mode() !== 'manual') {
        this.setMode('manual');
      }
      const targetLogicalIndex = Math.max(0, stepNumber - 1);
      this.goToStep(targetLogicalIndex);
    });

    // Inicializar control de voz con annyang
    this.voiceControlService.init(
      () => {
        if (this.mode() === 'manual') this.nextStep();
      },
      () => {
        if (this.mode() === 'manual') this.prevStep();
      },
      (logicalIndex: number) => {
        if (this.mode() !== 'manual') this.setMode('manual');
        this.goToStep(logicalIndex);
      },
      () => this.goToLastStep(),
      () => this.manualStep(),
      () => this.totalSteps(),
      () => Math.floor(this.totalSteps() / this.stepsRatio()),
      () => this.isolatedPart() !== null
    );
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
              this.createFurniture().then(() => {
                this.isLoading.set(false);
                this.animate();
              });
            }
          } else {
            this.isLoading.set(false);
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
    this.voiceControlService.dispose();

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
            this.lastFramedStep = -1;
            this.triggerFrame.update(v => v + 1);
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
        this.apiService.changeStep(this.furniture.reference_number, logicalStepIndex + 1).subscribe();
      }
    }
  }

  nextStep(): void {
    this.manualStep.update(step => (step < this.totalSteps() - 1 ? step + 1 : step));
    if (this.furniture?.reference_number) {
      this.apiService.changeStep(this.furniture.reference_number, this.logicalStep() + 1).subscribe();
    }
  }

  prevStep(): void {
    this.manualStep.update(step => (step > 0 ? step - 1 : step));
    if (this.furniture?.reference_number) {
      this.apiService.changeStep(this.furniture.reference_number, this.logicalStep() + 1).subscribe();
    }
  }

  //pasar los pasos con el teclado del ordenador, pero solo si no se está en AR y el modo es manual
  @HostListener('window:keydown', ['$event'])
  onWindowKeyDown(event: KeyboardEvent): void {
    if (this.mode() !== 'manual' || this.isARActive()) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    const target = event.target as HTMLElement | null;
    if (target) {
      const tagName = target.tagName;
      const isFormField = tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
      if (isFormField || target.isContentEditable) return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextStep();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prevStep();
    }
  }

  reset(): void {
    this.manualStep.set(0);
    if (this.furniture?.reference_number) {
      this.apiService.changeStep(this.furniture.reference_number, 1).subscribe();
    }
  }

  goToLastStep(): void {
    this.setMode('final');
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
      engineFacade.setCameraProps(engineFacade.getCamera().position, { x: 0, y: 1, z: 0 });
    }
    this.lastFramedStep = -1;
  }

  resetCameraPosition(): void {
    this.engineService.getEngine().resetControls();
    this.interactionService.resetUserManuallyMoved();
  }

  public toggleSimulation(): void {
    if (this.mode() === 'simulation') {
      this.setMode('manual');
    } else {
      this.setMode('simulation');
    }
  }

  public setMode(newMode: 'manual' | 'simulation' | 'final'): void {
    if (this.totalSteps() <= 1) newMode = 'final';
    if (this.mode() === 'final' && newMode === 'final' && this.totalSteps() > 1) {
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
      isolatePart: (part) => this.isolatePart(part),
      setMode: (mode) => this.setMode(mode)
    });

    window.addEventListener('resize', this.boundWindowResize);
  }

  private async createFurniture(): Promise<void> {
    try {
      const furnitureId = Number(this.furniture?.id);
      let loaded = false;
      try {
        const assemblyData: any = await firstValueFrom(this.apiService.getFurnitureAssemblyById(furnitureId));

        if (assemblyData && assemblyData.steps && assemblyData.steps.length > 0) {
          const { parts, totalSteps, stepDescriptions, sortedSteps, furnitureRoot } = await this.furnitureService.createPartsFromApi(assemblyData);

          this.furnitureRoot = furnitureRoot;

          if (parts.length > 0) {
            this.parts = parts;
            this.totalSteps.set(totalSteps);
            this.stepDescriptions.set(stepDescriptions);
            this.stepsData.set(sortedSteps);
            this.mode.set('manual');
            this.showFooterControls.set(true);
            this.triggerFrame.update(v => v + 1);
            loaded = true;
          }
        }
      } catch (error) {
        console.warn('Could not load or parse assembly steps from API, trying alternatives.', error);
      }

      if (!loaded && this.furniture && this.furniture.file_uri) {
        const { parts, totalSteps, stepDescriptions, sortedSteps, furnitureRoot } = await this.furnitureService.loadSingleFurnitureModel(this.furniture);

        this.furnitureRoot = furnitureRoot;

        if (parts.length > 0) {
          this.parts = parts;
          this.totalSteps.set(totalSteps);
          this.stepDescriptions.set(stepDescriptions);
          this.stepsData.set(sortedSteps);
          this.mode.set('final');
          this.showFooterControls.set(false);
          this.triggerFrame.update(v => v + 1);
        }
      }
    } catch (error) {
      console.warn('Failed to load furniture fallback.', error);
    }
  }

  // START OF ANIMATE FUNCTIONS

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

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
    engineFacade.frameObjectFromParts([{
      currentPosition: part.object.getPosition(),
      nativeObject: part.object
    }], 1.1);
  }
}