import { Component, ChangeDetectionStrategy, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface AssemblyPart {
  object: THREE.Object3D;
  startPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  assemblyStep: number;
  arrow?: THREE.ArrowHelper;
}

@Component({
  selector: 'app-interactive-assembly',
  imports: [CommonModule],
  templateUrl: './interactive-assembly.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteractiveAssemblyComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  totalSteps = 6;
  currentStep = signal(0);
  stepsArray = computed(() => Array(this.totalSteps).fill(0));
  isFirstStep = computed(() => this.currentStep() === 0);
  isComplete = computed(() => this.currentStep() === this.totalSteps - 1);

  stepDescriptions = [
    "Paso 1: Coloca la base.",
    "Paso 2: Inserta los tarugos de la base.",
    "Paso 3: Añade los paneles laterales.",
    "Paso 4: Coloca el panel trasero.",
    "Paso 5: Inserta los tarugos superiores.",
    "Paso 6: Coloca el panel superior y atorníllalo."
  ];

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  
  private parts: AssemblyPart[] = [];
  private animationFrameId: number | null = null;
  private resizeObserver!: ResizeObserver;

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        this.initThree();
        this.createFurniture();
        this.animate();
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
  }

  nextStep(): void {
    this.currentStep.update(step => (step < this.totalSteps - 1 ? step + 1 : step));
  }

  prevStep(): void {
    this.currentStep.update(step => (step > 0 ? step - 1 : step));
  }

  reset(): void {
    this.currentStep.set(0);
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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(8, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
    this.scene.add(hemisphereLight);

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private createPart(
    object: THREE.Object3D,
    startPos: THREE.Vector3,
    targetPos: THREE.Vector3,
    step: number
  ): AssemblyPart {
    object.position.copy(startPos);
    object.castShadow = true;
    object.receiveShadow = true;
    this.scene.add(object);
    return { object, startPosition: startPos, targetPosition: targetPos, assemblyStep: step };
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
          // Bottom holes
          const bottomHole = new THREE.Mesh(holeGeo, holeMaterial);
          bottomHole.position.set(0, -0.94, p.z);
          bottomHole.rotation.z = Math.PI / 2;
          group.add(bottomHole);

          // Top holes
          const topHole = new THREE.Mesh(holeGeo, holeMaterial);
          topHole.position.set(0, 0.94, p.z);
          topHole.rotation.z = Math.PI / 2;
          group.add(topHole);
      });
      
      const pilotHoleGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.1, 12);
      screwHolePositions.forEach(p => {
        const pilotHole = new THREE.Mesh(pilotHoleGeo, holeMaterial);
        pilotHole.position.set(0, 0.95, p.z); // Positioned on the top edge
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

    // Step 0: Base Panel
    const baseGeo = new THREE.BoxGeometry(2, 0.1, 2);
    const baseMesh = new THREE.Mesh(baseGeo, woodMaterial);
    this.parts.push(this.createPart(baseMesh, new THREE.Vector3(0, -5, 0), new THREE.Vector3(0, 0, 0), 0));
    
    // Step 1: Bottom Dowels & Holes
    const baseDowelPositions = [ { x: 0.9, z: -0.9 }, { x: -0.9, z: -0.9 }, { x: 0.9, z: 0.9 }, { x: -0.9, z: 0.9 }];
    const holeGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.12, 12);
    baseDowelPositions.forEach(p => {
        const holeMesh = new THREE.Mesh(holeGeo, holeMaterial);
        holeMesh.position.set(p.x, 0.04, p.z);
        baseMesh.add(holeMesh);
        
        const dowelMesh = new THREE.Mesh(dowelGeo, woodMaterial);
        const partDowel = this.createPart(dowelMesh, new THREE.Vector3(p.x, 4, p.z), new THREE.Vector3(p.x, 0.15, p.z), 1);
        partDowel.arrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0.8, 0), 0.7, 0x00ffff);
        partDowel.object.add(partDowel.arrow);
        this.parts.push(partDowel);
    });

    // Step 2: Side Panels
    const sidePanelDowelHolePositions = [{z: 0.9}, {z: -0.9}];
    const screwPositions = [ { x: 0.95, z: 0.8 }, { x: -0.95, z: 0.8 }, { x: 0.95, z: -0.8 }, { x: -0.95, z: -0.8 } ];
    const sidePanelScrewHolePositions = screwPositions.map(p => ({ z: p.z })).filter((value, index, self) => self.findIndex(v => v.z === value.z) === index);
    
    const rightPanel = this.createSidePanelWithHoles(sidePanelDowelHolePositions, sidePanelScrewHolePositions);
    const partRight = this.createPart(rightPanel, new THREE.Vector3(5, 1.05, 0), new THREE.Vector3(0.95, 1.05, 0), 2);
    partRight.arrow = new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1.5, 0, 0), 1.5, 0x00ffff);
    partRight.object.add(partRight.arrow);
    this.parts.push(partRight);

    const leftPanel = this.createSidePanelWithHoles(sidePanelDowelHolePositions, sidePanelScrewHolePositions);
    const partLeft = this.createPart(leftPanel, new THREE.Vector3(-5, 1.05, 0), new THREE.Vector3(-0.95, 1.05, 0), 2);
    partLeft.arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1.5, 0, 0), 1.5, 0x00ffff);
    partLeft.object.add(partLeft.arrow);
    this.parts.push(partLeft);

    // Step 3: Back Panel
    const backPanelGeo = new THREE.BoxGeometry(1.8, 2, 0.1); // Width is 1.8 to fit between side panels
    const backPanelMesh = new THREE.Mesh(backPanelGeo, woodMaterial);
    const partBack = this.createPart(backPanelMesh, new THREE.Vector3(0, 1.05, -5), new THREE.Vector3(0, 1.05, -0.95), 3);
    partBack.arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1.5), 1.5, 0x00ffff);
    partBack.object.add(partBack.arrow);
    this.parts.push(partBack);
    
    // Step 4: Top Dowels
    const topDowelPositions = [
        { x: 0.95, y: 2.05, z: 0.9 }, { x: 0.95, y: 2.05, z: -0.9 },
        { x: -0.95, y: 2.05, z: 0.9 }, { x: -0.95, y: 2.05, z: -0.9 }
    ];
    topDowelPositions.forEach(p => {
        const dowelMesh = new THREE.Mesh(dowelGeo, woodMaterial);
        const partDowel = this.createPart(dowelMesh, new THREE.Vector3(p.x, p.y + 4, p.z), new THREE.Vector3(p.x, p.y, p.z), 4);
        partDowel.arrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0.8, 0), 0.7, 0x00ffff);
        partDowel.object.add(partDowel.arrow);
        this.parts.push(partDowel);
    });

    // Step 5: Top Panel & Screws
    const topPanel = this.createTopPanelWithHoles(topDowelPositions, screwPositions);
    const partTop = this.createPart(topPanel, new THREE.Vector3(0, 5, 0), new THREE.Vector3(0, 2.1, 0), 5);
    partTop.arrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 1.5, 0), 1.5, 0x00ffff);
    partTop.object.add(partTop.arrow);
    this.parts.push(partTop);

    const screwGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 12);
    screwPositions.forEach(p => {
        const screwMesh = new THREE.Mesh(screwGeo, screwMaterial);
        const partScrew = this.createPart(screwMesh, new THREE.Vector3(p.x, 8, p.z), new THREE.Vector3(p.x, 2.0, p.z), 5);
        partScrew.arrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0.8, 0), 0.7, 0x00ffff);
        partScrew.object.add(partScrew.arrow);
        this.parts.push(partScrew);
    });
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    const step = this.currentStep();
    
    this.parts.forEach(part => {
      const isPartForCurrentStep = part.assemblyStep === step;
      const isPartForPastOrCurrentStep = part.assemblyStep <= step;
      
      // Set visibility for the part object
      part.object.visible = isPartForPastOrCurrentStep;

      // Set visibility for the arrow helper
      if (part.arrow) {
        part.arrow.visible = isPartForCurrentStep;
      }
      
      // Interpolate position
      const target = isPartForPastOrCurrentStep ? part.targetPosition : part.startPosition;
      part.object.position.lerp(target, 0.04);
    });

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
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
    }
  }
}
