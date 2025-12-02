import { Component, ChangeDetectionStrategy, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal, computed, input, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

interface AssemblyPart {
  object: THREE.Object3D;
  startPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  appearStep: number;
  joinStep: number;
  name: string;
  description: string;
  arrow?: THREE.ArrowHelper;
}

@Component({
  selector: 'app-demo-landing',
  imports: [CommonModule],
  templateUrl: './demo-landing.html',
  styleUrls: ['./demo-landing.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoLanding implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;
  autoStartSimulation = true;
  totalSteps = 10;
  manualStep = signal(0);
  simulationStep = signal(0);
  mode = signal<'manual' | 'simulation' | 'final'>('manual');
  
  currentStep = computed(() => {
    return this.simulationStep();
  });
  
  isSimulating = computed(() => this.mode() === 'simulation');
  simulationSpeed = signal(1);
  readonly simulationSpeeds = [0.5, 1, 1.5, 2];


  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private composer!: EffectComposer;
  private outlinePass!: OutlinePass;
  
  private parts: AssemblyPart[] = [];
  private animationFrameId: number | null = null;
  private resizeObserver!: ResizeObserver;
  private isolationTimer: any = null;
  
  private simulationDirection = signal<'forward' | 'backward'>('forward');
  private lastStepTime = 0;
  private readonly SIMULATION_STEP_INTERVAL = 1500; // ms

  

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        this.initThree();
        this.createFurniture();
        this.animate();
        
       
            this.setMode('simulation');
        

        this.resizeObserver.disconnect();
      }
    });
    this.resizeObserver.observe(this.canvasRef.nativeElement.parentElement!);
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.renderer?.dispose();
    window.removeEventListener('resize', this.onWindowResize);
    this.resizeObserver?.disconnect();
    if(this.isolationTimer) clearTimeout(this.isolationTimer);
  }

  public setMode(newMode: 'manual' | 'simulation' | 'final'): void {
    if (this.mode() === newMode) return;

    this.mode.set(newMode);
    this.controls.autoRotate = newMode === 'simulation' || newMode === 'final';
    
    if (newMode === 'simulation') {
      this.simulationStep.set(0);
      this.simulationDirection.set('forward');
      this.lastStepTime = Date.now();
    } else if (newMode === 'final') {
      this.parts.forEach(part => {
        part.object.position.copy(part.targetPosition);
      });
    }
  }

  private initThree(): void {
    this.scene = new THREE.Scene();
    
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;
    const { width, height } = container.getBoundingClientRect();

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(2.5, 2.5, 4);
    this.camera.lookAt(0, 1, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 15;
    this.controls.target.set(0, 1, 0);
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 0.5;
    this.controls.saveState();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(8, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
    this.scene.add(hemisphereLight);

    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.outlinePass = new OutlinePass(new THREE.Vector2(width, height), this.scene, this.camera);
    this.outlinePass.edgeStrength = 5;
    this.outlinePass.edgeGlow = 0.25;
    this.outlinePass.edgeThickness = 1;
    this.outlinePass.visibleEdgeColor.set('#72b6d8');
    this.outlinePass.hiddenEdgeColor.set('#72b6d8');
    this.composer.addPass(this.outlinePass);
    
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private createPart(
    object: THREE.Object3D,
    startPos: THREE.Vector3,
    targetPos: THREE.Vector3,
    appearStep: number,
    joinStep: number,
    name: string,
    description: string
  ): AssemblyPart {
    object.position.copy(startPos);
    object.castShadow = true;
    object.receiveShadow = true;
    this.scene.add(object);
    return { object, startPosition: startPos, targetPosition: targetPos, appearStep, joinStep, name, description };
  }
  
  private createSidePanelWithHoles(dowelHolePositions: { z: number }[], screwHolePositions: { z: number }[]): THREE.Group {
      const woodMaterial = new THREE.MeshStandardMaterial({ color: 0xEAE0D5, roughness: 0.8, metalness: 0.1 });
      const holeMaterial = new THREE.MeshStandardMaterial({ color: 0x4F4A45, roughness: 0.9 });

      const group = new THREE.Group();
      const panelGeo = new THREE.BoxGeometry(0.1, 2, 2);
      const panelMesh = new THREE.Mesh(panelGeo, woodMaterial);
      group.add(panelMesh);

      const holeGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.12, 12);
      dowelHolePositions.forEach(p => {
          const bottomHole = new THREE.Mesh(holeGeo.clone(), holeMaterial);
          bottomHole.position.set(0, -0.94, p.z);
          bottomHole.rotation.z = Math.PI / 2;
          group.add(bottomHole);

          const topHole = new THREE.Mesh(holeGeo.clone(), holeMaterial);
          topHole.position.set(0, 0.94, p.z);
          topHole.rotation.z = Math.PI / 2;
          group.add(topHole);
      });
      
      const pilotHoleGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.1, 12);
      screwHolePositions.forEach(p => {
        const pilotHole = new THREE.Mesh(pilotHoleGeo, holeMaterial);
        pilotHole.position.set(0, 0.95, p.z);
        group.add(pilotHole);
      });

      return group;
  }
  
  private createTopPanelWithHoles(dowelHolePositions: {x: number, y: number, z: number}[], screwHolePositions: {x: number, z: number}[]): THREE.Group {
      const woodMaterial = new THREE.MeshStandardMaterial({ color: 0xEAE0D5, roughness: 0.8, metalness: 0.1 });
      const holeMaterial = new THREE.MeshStandardMaterial({ color: 0x4F4A45, roughness: 0.9 });

      const group = new THREE.Group();
      const panelGeo = new THREE.BoxGeometry(2.2, 0.1, 2.2);
      const panelMesh = new THREE.Mesh(panelGeo, woodMaterial);
      group.add(panelMesh);
      
      const dowelHoleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.12, 12);
      dowelHolePositions.forEach(p => {
          const holeMesh = new THREE.Mesh(dowelHoleGeo, holeMaterial);
          holeMesh.position.set(p.x, 0, p.z);
          group.add(holeMesh);
      });

      const screwHoleGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.12, 12);
      screwHolePositions.forEach(p => {
          const holeMesh = new THREE.Mesh(screwHoleGeo, holeMaterial);
          holeMesh.position.set(p.x, 0, p.z);
          group.add(holeMesh);
      });
      
      return group;
  }

  private createFurniture(): void {
    const woodMaterial = new THREE.MeshStandardMaterial({ color: 0xEAE0D5, roughness: 0.8, metalness: 0.1 });
    const screwMaterial = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.4, metalness: 0.9 });
    const holeMaterial = new THREE.MeshStandardMaterial({ color: 0x4F4A45, roughness: 0.9 });
    const dowelGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8);
    let step = 0;

    const baseGeo = new THREE.BoxGeometry(2, 0.1, 2);
    const baseMesh = new THREE.Mesh(baseGeo, woodMaterial);
    this.parts.push(this.createPart(baseMesh, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 0, 0, 'Panel Base', 'Panel inferior de madera (100x100x2cm)'));
    
    const baseDowelPositions = [ { x: 0.9, z: -0.9 }, { x: -0.9, z: -0.9 }, { x: 0.9, z: 0.9 }, { x: -0.9, z: 0.9 }];
    const holeGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.12, 12);
    baseDowelPositions.forEach(p => {
        const holeMesh = new THREE.Mesh(holeGeo, holeMaterial);
        holeMesh.position.set(p.x, 0.04, p.z);
        baseMesh.add(holeMesh);
        
        const dowelMesh = new THREE.Mesh(dowelGeo, woodMaterial);
        const partDowel = this.createPart(dowelMesh, new THREE.Vector3(p.x, 0.5, p.z), new THREE.Vector3(p.x, 0.15, p.z), step, step + 1, 'Tarugo de Madera', 'Cilindro de madera de haya (Ø6x30mm)');
        partDowel.arrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -0.2, 0), 0.3, 0x00ffff);
        partDowel.object.add(partDowel.arrow);
        this.parts.push(partDowel);
    });
    step += 2;

    const sidePanelDowelHolePositions = [{z: 0.9}, {z: -0.9}];
    const screwPositions = [ { x: 0.95, z: 0.8 }, { x: -0.95, z: 0.8 }, { x: 0.95, z: -0.8 }, { x: -0.95, z: -0.8 } ];
    const sidePanelScrewHolePositions = screwPositions.map(p => ({ z: p.z })).filter((value, index, self) => self.findIndex(v => v.z === value.z) === index);
    
    const rightPanel = this.createSidePanelWithHoles(sidePanelDowelHolePositions, sidePanelScrewHolePositions);
    const partRight = this.createPart(rightPanel, new THREE.Vector3(1.5, 1.05, 0), new THREE.Vector3(0.95, 1.05, 0), step, step+1, 'Panel Lateral Derecho', 'Panel lateral de madera (100x100x5cm)');
    partRight.arrow = new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0.4, 0, 0), 0.35, 0x00ffff);
    partRight.object.add(partRight.arrow);
    this.parts.push(partRight);

    const leftPanel = this.createSidePanelWithHoles(sidePanelDowelHolePositions, sidePanelScrewHolePositions);
    const partLeft = this.createPart(leftPanel, new THREE.Vector3(-1.5, 1.05, 0), new THREE.Vector3(-0.95, 1.05, 0), step, step+1, 'Panel Lateral Izquierdo', 'Panel lateral de madera (100x100x5cm)');
    partLeft.arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-0.4, 0, 0), 0.35, 0x00ffff);
    partLeft.object.add(partLeft.arrow);
    this.parts.push(partLeft);
    step += 2;

    const backPanelGeo = new THREE.BoxGeometry(1.8, 2, 0.1);
    const backPanelMesh = new THREE.Mesh(backPanelGeo, woodMaterial);
    const partBack = this.createPart(backPanelMesh, new THREE.Vector3(0, 1.05, -1.5), new THREE.Vector3(0, 1.05, -0.95), step, step+1, 'Panel Trasero', 'Panel fino de contrachapado (90x100cm)');
    partBack.arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -0.4), 0.35, 0x00ffff);
    partBack.object.add(partBack.arrow);
    this.parts.push(partBack);
    step += 2;
    
    const topDowelPositions = [
        { x: 0.95, y: 2.05, z: 0.9 }, { x: 0.95, y: 2.05, z: -0.9 },
        { x: -0.95, y: 2.05, z: 0.9 }, { x: -0.95, y: 2.05, z: -0.9 }
    ];
    topDowelPositions.forEach(p => {
        const dowelMesh = new THREE.Mesh(dowelGeo, woodMaterial);
        const partDowel = this.createPart(dowelMesh, new THREE.Vector3(p.x, p.y + 0.5, p.z), new THREE.Vector3(p.x, p.y, p.z), step, step+1, 'Tarugo de Madera Superior', 'Cilindro de madera de haya (Ø6x30mm)');
        partDowel.arrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -0.2, 0), 0.3, 0x00ffff);
        partDowel.object.add(partDowel.arrow);
        this.parts.push(partDowel);
    });
    step += 2;

    const topPanel = this.createTopPanelWithHoles(topDowelPositions, screwPositions);
    const partTop = this.createPart(topPanel, new THREE.Vector3(0, 2.8, 0), new THREE.Vector3(0, 2.1, 0), step, step+1, 'Panel Superior', 'Panel superior de madera (110x110x2cm)');
    partTop.arrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -0.2, 0), 0.6, 0x00ffff);
    partTop.object.add(partTop.arrow);
    this.parts.push(partTop);

    const screwGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 12);
    screwPositions.forEach(p => {
        const screwMesh = new THREE.Mesh(screwGeo, screwMaterial);
        const partScrew = this.createPart(screwMesh, new THREE.Vector3(p.x, 2.8, p.z), new THREE.Vector3(p.x, 2.0, p.z), step, step+1, 'Tornillo de Montaje', 'Tornillo de acero (Ø8x40mm)');
        partScrew.arrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -0.25, 0), 0.4, 0x00ffff);
        partScrew.object.add(partScrew.arrow);
        this.parts.push(partScrew);
    });
    step += 2;
    this.totalSteps = step;
  }

  private runSimulation(): void {
   

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
    
    if (this.isSimulating()) {
      this.runSimulation();
    }
    
    const step = this.currentStep();
      const meshesToHighlight: THREE.Object3D[] = [];
      this.parts
        .filter(part => {
          const isMovingToTarget = part.object.position.distanceTo(part.targetPosition) > 0.01;
          return part.appearStep === step || (part.joinStep === step && isMovingToTarget);
        })
        .forEach(part => {
          part.object.traverse(child => {
            if (child instanceof THREE.Mesh) {
              meshesToHighlight.push(child);
            }
          });
        });
      this.outlinePass.selectedObjects = meshesToHighlight;

      this.parts.forEach(part => {
        if (part.arrow) {
          if (step === part.appearStep) {
            part.arrow.visible = true;
          } else if (step === part.joinStep) {
            const distanceToTarget = part.object.position.distanceTo(part.targetPosition);
            part.arrow.visible = distanceToTarget > 0.01;
          } else {
            part.arrow.visible = false;
          }
        }

        const target = step >= part.joinStep ? part.targetPosition : part.startPosition;
        if (this.mode() !== 'final') {
          part.object.position.lerp(target, 0.08);
        }

        const hasAppeared = step >= part.appearStep;
        const distanceToStart = part.object.position.distanceTo(part.startPosition);
        part.object.visible = hasAppeared || distanceToStart > 0.01;
      });
    

    this.controls.update();
    this.composer.render();
  }

  private onWindowResize(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    if(width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.composer.setSize(width, height);
      this.outlinePass.resolution.set(width, height);
    }
  }

 
  
}
