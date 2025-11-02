import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-furniture-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './furniture-viewer.html',
  styleUrl: './furniture-viewer.css'
})
export class FurnitureViewer implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() modelPath: string = '/assets/models/EKET_70332124_35x25x35.glb';

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private animationId!: number;
  private loader!: GLTFLoader;
  private currentModel: THREE.Object3D | null = null;

  isLoading = true;

  ngAfterViewInit(): void {
    this.initThreeJS();
    this.animate();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.controls) {
      this.controls.dispose();
    }
  }

  private initThreeJS(): void {
    const canvas = this.canvasRef.nativeElement;
    
    // Scene con fondo transparente
    this.scene = new THREE.Scene();
    this.scene.background = null; //null para fondo transparente

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 5);

    // Renderer con alpha true para transparencia
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: canvas,
      antialias: true,
      alpha: true //fondo transparente
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.enableZoom = true;
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 0.5;

    // Lighting
    this.setupLighting();

    // Load GLB model
    this.loadModel();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Point lights for better illumination
    const pointLight1 = new THREE.PointLight(0xffffff, 0.4, 100);
    pointLight1.position.set(-10, 10, 10);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.4, 100);
    pointLight2.position.set(10, -10, -10);
    this.scene.add(pointLight2);
  }

  loadModel(modelPath?: string): void {
    this.loader = new GLTFLoader();
    this.isLoading = true;
    
    // Si hay un modelo actual, lo removemos
    if (this.currentModel) {
      this.scene.remove(this.currentModel);
      this.currentModel = null;
    }
    
    // Usar el path proporcionado o el del Input
    const pathToLoad = modelPath || this.modelPath;
    
    this.loader.load(
      pathToLoad,
      (gltf) => {
        console.log('Modelo cargado exitosamente:', gltf);
        
        this.currentModel = gltf.scene;
        
        // Ajustar escala del modelo si es necesario
        this.currentModel.scale.setScalar(1);
        
        // Centrar el modelo
        const box = new THREE.Box3().setFromObject(this.currentModel);
        const center = box.getCenter(new THREE.Vector3());
        this.currentModel.position.sub(center);
        
        // Habilitar sombras
        this.currentModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        this.scene.add(this.currentModel);
        
        // Ajustar cámara para ver todo el modelo
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 2; // Zoom out un poco más
        
        this.camera.position.set(cameraZ * 0.8, cameraZ * 0.6, cameraZ);
        this.camera.lookAt(0, 0, 0);
        this.controls.update();
        
        this.isLoading = false;
      },
      (progress) => {
        console.log('Progreso de carga:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error al cargar el modelo:', error);
        // Crear un cubo de ejemplo si no se puede cargar el modelo
        this.createFallbackModel();
        this.isLoading = false;
      }
    );
  }

  private createFallbackModel(): void {
    // Crear un mueble de ejemplo si no se puede cargar el modelo GLB
    const group = new THREE.Group();
    
    // Base del mueble (mesa/escritorio)
    const baseGeometry = new THREE.BoxGeometry(3, 0.2, 1.5);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Marrón madera
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.8;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    
    // Patas del mueble
    const legGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    
    const positions = [
      [-1.4, 0.4, -0.7],
      [1.4, 0.4, -0.7],
      [-1.4, 0.4, 0.7],
      [1.4, 0.4, 0.7]
    ];
    
    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      leg.receiveShadow = true;
      group.add(leg);
    });
    
    // Agregar un objeto decorativo (lámpara)
    const lampGeometry = new THREE.CylinderGeometry(0.3, 0.1, 0.5);
    const lampMaterial = new THREE.MeshLambertMaterial({ color: 0xFFF8DC });
    const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
    lamp.position.set(0.8, 1.35, 0);
    lamp.castShadow = true;
    group.add(lamp);
    
    this.currentModel = group;
    this.scene.add(group);
    
    // Agregar un plano para mostrar las sombras
    const planeGeometry = new THREE.PlaneGeometry(8, 8);
    const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xf8f9fa });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.5;
    plane.receiveShadow = true;
    this.scene.add(plane);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize(): void {
    const canvas = this.canvasRef.nativeElement;
    this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  }

  // Métodos públicos para controlar la vista
  resetCamera(): void {
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);
    this.controls.reset();
  }

  toggleWireframe(): void {
    if (this.currentModel) {
      this.currentModel.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
          (child.material as any).wireframe = !(child.material as any).wireframe;
        }
      });
    }
  }

  toggleAutoRotate(): void {
    this.controls.autoRotate = !this.controls.autoRotate;
  }
}