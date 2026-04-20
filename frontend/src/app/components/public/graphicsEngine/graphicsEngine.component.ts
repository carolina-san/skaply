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
import { GraphicsTourOverlay } from './graphics-tour-overlay/graphics-tour-overlay';

interface GraphicsTourStep {
  target: string;
  title: string;
  description: string;
  requiredMode?: 'manual' | 'simulation' | 'final';
}

@Component({
  selector: 'app-graphics-engine',
  standalone: true,
  imports: [CommonModule, FormsModule, GraphicsHeader, ArOverlay, FooterControls, SpinnerComponent, GraphicsTourOverlay],
  providers: [EngineService, SimulationService, FurnitureService, InteractionService, VoiceControlService],
  templateUrl: './graphicsEngine.component.html',
  styleUrls: ['./graphicsEngine.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphicsEngineComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('engineShell') private engineShellRef?: ElementRef<HTMLElement>;

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
  tourActive = signal(false);
  tourStepIndex = signal(0);
  tourTargetRect = signal<{ top: number; left: number; width: number; height: number } | null>(null);
  tourPanelCenterX = signal<number | null>(null);

  private readonly tourSteps: GraphicsTourStep[] = [
    {
      target: 'tour-help-button',
      title: 'Tour del visor',
      description: 'Este botón abre esta guía para recorrer las funciones principales del motor gráfico.',
      requiredMode: 'manual'
    },
    {
      target: 'steps-progress',
      title: 'Vista de pasos',
      description: 'Aquí ves el avance del montaje. Puedes pulsar cada número para saltar directamente a ese paso.',
      requiredMode: 'manual'
    },
    {
      target: 'mode-manual',
      title: 'Modo paso a paso',
      description: 'En Manual controlas el montaje tú mismo, avanzando y retrocediendo cuando quieras.',
      requiredMode: 'manual'
    },
    {
      target: 'manual-prev',
      title: 'Paso anterior',
      description: 'Retrocede un paso para revisar una pieza o corregir una acción durante el montaje.',
      requiredMode: 'manual'
    },
    {
      target: 'manual-next',
      title: 'Paso siguiente',
      description: 'Avanza al siguiente paso del montaje manual.',
      requiredMode: 'manual'
    },
    {
      target: 'manual-reset',
      title: 'Reiniciar montaje',
      description: 'Vuelve al inicio del montaje manual con un solo clic.',
      requiredMode: 'manual'
    },
    {
      target: 'mode-simulation',
      title: 'Modo automático',
      description: 'Activa la simulación para ver el montaje reproduciéndose de forma automática.',
      requiredMode: 'manual'
    },
    {
      target: 'simulation-play',
      title: 'Play y pausa',
      description: 'En automático puedes pausar y reanudar la reproducción cuando lo necesites.',
      requiredMode: 'simulation'
    },
    {
      target: 'simulation-speed',
      title: 'Velocidad de simulación',
      description: 'Ajusta la velocidad (0.5x, 1x, 1.5x, 2x) para seguir mejor cada movimiento.',
      requiredMode: 'simulation'
    },
    {
      target: 'mode-final',
      title: 'Vista de mueble montado',
      description: 'Abre la vista final para inspeccionar el resultado completo del mueble ensamblado.',
      requiredMode: 'manual'
    },
    {
      target: 'voice-control',
      title: 'Control por voz',
      description: 'Activa el micrófono para decir comandos como "siguiente paso" o "paso anterior".',
      requiredMode: 'manual'
    },
    {
      target: 'background-toggle',
      title: 'Fondo del visor',
      description: 'Cambia entre fondo transparente y blanco para mejorar la visualización del modelo.',
      requiredMode: 'manual'
    }
  ];

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

  tourCurrentStep = computed(() => this.tourSteps[this.tourStepIndex()]);

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
  private destroyed = false;
  private tourUpdateRaf: number | null = null;
  private shellResizeObserver?: ResizeObserver;


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

      // console.log('stepIndex: ' + stepIndex);
      // console.log('mode: ' + mode);
      // console.log('lastRotAngle: ' + lastRotAngle);
      // console.log('lastRotAxis: ' + lastRotAxis);

      let margin = 1.05;
      if (this.isSmallScreen()) {
        margin = 1.25;
      }

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
            })), margin
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
            })), margin
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
  private boundScreenResize = () => {
    this.checkScreenSize();
    this.updateTourPanelCenterX();
    if (this.tourActive()) {
      this.updateTourTarget();
    }
  };

  ngOnInit(): void {
    this.engineService.createEngineInstance();

    const ref = this.route.snapshot.params['ref'];

    this.apiService.getFurnitureById(ref)
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (f: any) => {
        if (this.destroyed) return;

        this.furniture = f.data ? f.data : f;

        if (this.useExternalModel && this.isViewInitialized) {
          try {
            await this.initEngine();
            if (this.destroyed) return;

            await this.createFurniture();
            if (this.destroyed) return;

            this.isLoading.set(false);

            if (!this.animationFrameId) this.animate();
          } catch (error) {
            console.error('Error loading furniture in ngOnInit:', error);
            if (!this.destroyed) this.isLoading.set(false);
          }
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
    this.updateTourPanelCenterX();
    window.addEventListener('resize', this.boundScreenResize);

    if (this.engineShellRef?.nativeElement) {
      this.shellResizeObserver = new ResizeObserver(() => {
        this.updateTourPanelCenterX();
      });
      this.shellResizeObserver.observe(this.engineShellRef.nativeElement);
    }

    this.resizeObserver = new ResizeObserver(entries => {
      if (this.destroyed) return;
      const entry = entries[0];
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        this.initEngine().then(async () => {
          if (this.destroyed) return;
          this.setupEventListeners();
          this.isViewInitialized = true;

          if (this.useExternalModel) {
            if (this.furniture) {
              try {
                await this.createFurniture();
                if (this.destroyed) return;
                this.isLoading.set(false);
                this.animate();
              } catch (error) {
                console.error('Error loading furniture in ngAfterViewInit:', error);
                if (!this.destroyed) this.isLoading.set(false);
              }
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
    this.destroyed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.tourUpdateRaf !== null) {
      cancelAnimationFrame(this.tourUpdateRaf);
      this.tourUpdateRaf = null;
    }
    this.resizeObserver?.disconnect();
    this.shellResizeObserver?.disconnect();
    window.removeEventListener('resize', this.boundScreenResize);
    window.removeEventListener('resize', this.boundWindowResize);

    this.interactionService.dispose();
    this.voiceControlService.dispose();

    if (this.chatbotSub) {
      this.chatbotSub.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up references before disposing engine
    this.parts = [];
    this.furnitureRoot = null;

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
      this.initEngine().then(async () => {
        if (this.destroyed) return;
        if (this.furniture) {
          try {
            await this.createFurniture();
            if (this.destroyed) return;
            if (this.mode() === 'final') {
              this.parts.forEach(part => {
                part.object.setPosition(part.targetPosition.x, part.targetPosition.y, part.targetPosition.z);
              });
            }
            this.lastFramedStep = -1;
            this.triggerFrame.update(v => v + 1);
            if (!this.animationFrameId) this.animate();
          } catch (error) {
            console.error('Error switching engine:', error);
          }
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

  startTour(): void {
    if (this.isARActive()) return;

    this.updateTourPanelCenterX();
    this.tourActive.set(true);
    this.tourStepIndex.set(0);
    this.activateTourStep(0);
  }

  closeTour(): void {
    this.tourActive.set(false);
    this.tourTargetRect.set(null);
    if (this.tourUpdateRaf !== null) {
      cancelAnimationFrame(this.tourUpdateRaf);
      this.tourUpdateRaf = null;
    }
  }

  nextTourStep(): void {
    const nextIndex = this.tourStepIndex() + 1;
    if (nextIndex >= this.tourSteps.length) {
      this.closeTour();
      return;
    }
    this.activateTourStep(nextIndex);
  }

  prevTourStep(): void {
    const prevIndex = this.tourStepIndex() - 1;
    if (prevIndex < 0) return;
    this.activateTourStep(prevIndex);
  }

  get tourStepCount(): number {
    return this.tourSteps.length;
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
    if (this.destroyed) return;
    if (isActive && this.tourActive()) {
      this.closeTour();
    }
    this.isARActive.set(isActive);
    this.arStateChange.emit(isActive);

    // El canvas-container cambia de tamaño (relative → fixed inset-0 o viceversa).
    // Esperamos un frame para que el DOM se actualice antes de leer las nuevas dimensiones.
    requestAnimationFrame(() => {
      if (this.destroyed) return;
      const canvas = this.canvasRef?.nativeElement;
      if (!canvas) return;
      const container = canvas.parentElement;
      if (!container) return;
      const { width, height } = container.getBoundingClientRect();
      if (width > 0 && height > 0) {
        this.engineService.resize(width, height);
      }
    });

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
      if (this.destroyed) return;
      const furnitureId = Number(this.furniture?.id);
      let loaded = false;
      try {
        const assemblyData: any = await firstValueFrom(this.apiService.getFurnitureAssemblyById(furnitureId));
        if (this.destroyed) return;

        if (assemblyData && assemblyData.steps && assemblyData.steps.length > 0) {
          const { parts, totalSteps, stepDescriptions, sortedSteps, furnitureRoot } = await this.furnitureService.createPartsFromApi(assemblyData);
          if (this.destroyed) return;

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
        if (this.destroyed) return;
        console.warn('Could not load or parse assembly steps from API, trying alternatives.', error);
      }

      if (!loaded && !this.destroyed && this.furniture && this.furniture.file_uri) {
        const { parts, totalSteps, stepDescriptions, sortedSteps, furnitureRoot } = await this.furnitureService.loadSingleFurnitureModel(this.furniture);
        if (this.destroyed) return;

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
    if (this.destroyed) {
      this.animationFrameId = null;
      return;
    }
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

    this.updateTourPanelCenterX();

    if (this.tourActive()) {
      this.updateTourTarget();
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
    }], 1.25);
  }

  private activateTourStep(index: number): void {
    if (!this.tourActive()) return;

    const boundedIndex = Math.min(Math.max(index, 0), this.tourSteps.length - 1);
    const step = this.tourSteps[boundedIndex];

    if (step.requiredMode && this.mode() !== step.requiredMode) {
      this.setMode(step.requiredMode);
    }

    this.tourStepIndex.set(boundedIndex);
    this.updateTourTarget();
  }

  private updateTourTarget(): void {
    if (!this.tourActive()) return;

    this.updateTourPanelCenterX();

    const step = this.tourSteps[this.tourStepIndex()];

    if (this.tourUpdateRaf !== null) {
      cancelAnimationFrame(this.tourUpdateRaf);
      this.tourUpdateRaf = null;
    }

    this.tourUpdateRaf = requestAnimationFrame(() => {
      if (!this.tourActive()) return;

      // Espera un frame extra para asegurar que cambios de modo/DOM estén pintados.
      this.tourUpdateRaf = requestAnimationFrame(() => {
        if (!this.tourActive()) return;

        const target = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
        if (!target) {
          this.tourTargetRect.set(null);
          return;
        }

        target.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });

        const rect = target.getBoundingClientRect();
        this.tourTargetRect.set({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
        this.tourUpdateRaf = null;
      });
    });
  }

  private updateTourPanelCenterX(): void {
    const shell = this.engineShellRef?.nativeElement;
    if (!shell) {
      this.tourPanelCenterX.set(null);
      return;
    }

    const rect = shell.getBoundingClientRect();
    this.tourPanelCenterX.set(rect.left + rect.width / 2);
  }
}