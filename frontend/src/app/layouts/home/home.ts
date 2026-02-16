import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  Chatbot,
  Footer,
  FilterPanelComponent,
  CardFurniture,
  Modal
} from '../../components';
import { ApiService } from '../../services/api.service';
import { FilterSharingService } from '../../services/filter-sharing.service';
import { FilterOptions, ProviderBasic, Color, Furniture } from '../../types';
import { DifficultyLabels } from '../../utils/difficulty-labels';
import { SeoService } from '../../services/seo.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-home',
  imports: [Chatbot, Footer, CommonModule, FormsModule, FilterPanelComponent, CardFurniture, Modal],
  templateUrl: './home.html',
  styleUrl: './home.css'
})

export class Home implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  categories: any[] = [];
  furnitures: Furniture[] = [];
  providers: ProviderBasic[] = [];
  colors: Color[] = [];
  scrolled = false;
  isFilterModalOpen = false;
  activeFiltersCount = 0;
  isQrScannerOpen = false;
  difficultyLabels = DifficultyLabels;
  selectedCategoryId: number | null = null;
  searchText: string = '';
  previousSearchText: string = '';
  hasSearched: boolean = false;
  activeFilters: FilterOptions = {};
  resetFilterToggle: boolean = false;
  isFurnitureModalOpen = false;
  selectedFurniture: Furniture | null = null;
  selectedFurnitureSteps: any[] = [];
  isIncidenciaModalOpen = false;
  isLoadingFurnitures = false;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private filterSharingService: FilterSharingService,
    private seo: SeoService
  ) { }

  ngOnInit() {
    this.obtenerCategorias();
    this.obtenerCatalogo();
    this.loadProviders();
    this.loadColors();

    // Verificar si hay un mueble en la URL para abrir su modal automáticamente
    this.route.queryParams.subscribe(params => {
      const furnitureRef = params['furniture'];
      if (furnitureRef) {
        this.openFurnitureModalByRef(furnitureRef);
      }
    });

    // Suscribirse a los cambios de categoría desde el chatbot
    this.filterSharingService.selectedCategory$.subscribe(categoryId => {
      if (categoryId !== null) {
        // Al seleccionar categoría desde el chatbot, limpiamos otros filtros para 'empezar de cero'
        this.selectedCategoryId = categoryId;
        this.activeFilters = {};
        this.calculateActiveFilters(this.activeFilters);
        this.obtenerCatalogo();
        this.filterSharingService.clearSelectedCategory();
      }
    });

    // Suscribirse a los cambios de color desde el chatbot
    this.filterSharingService.selectedColors$.subscribe(colorIds => {
      if (colorIds && colorIds.length > 0) {
        // Al seleccionar color desde el chatbot, limpiamos categoría y otros filtros
        this.selectedCategoryId = null; // Limpiar categoría seleccionada
        this.activeFilters = {
          color_ids: colorIds // Solo mantener los nuevos colores
        };
        this.calculateActiveFilters(this.activeFilters);
        this.obtenerCatalogo();
        this.filterSharingService.clearSelectedColors();
      }
    });

    window.addEventListener("scroll", () => {
      this.scrolled = window.scrollY > 70;
    });

    this.seo.setSeo({
      title: `Catálogo de muebles disponibles - Skäply`,
      description: `Explora nuestro catálogo de muebles disponibles en Skäply. Encuentra el mueble perfecto para tu espacio y móntalo fácilmente con nuestro manual interactivo 3D.`,
      canonical: `https://skaply.ovh/catalogo`,
      index: true,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': 'Catálogo de Muebles',
        'description': 'Explora nuestro catálogo de muebles disponibles en Skäply. Encuentra el mueble perfecto para tu espacio y móntalo fácilmente con nuestro manual interactivo 3D.',
        'url': 'https://skaply.ovh/catalogo'
      }
    });
  }

  abrirModalIncidencia() {
    this.isIncidenciaModalOpen = true;
  }

  resetIncidenciaForm() {
    this.isIncidenciaModalOpen = false;
  }

  enviarIncidencia(description: string, date: string, user_email: string) {
    if (!this.selectedFurniture) return;
    this.apiService.postIssue(this.selectedFurniture.id, { description, date, user_email }).subscribe({
      next: (response) => {
        alert('Incidencia enviada con éxito.');
      },
      error: (error) => {
        alert('Error al enviar la incidencia.');
      }
    });
  }

  goToViewer3D() {
    if (!this.selectedFurniture) return;
    const ref = this.selectedFurniture.reference_number;
    // Cerrar modal sin limpiar query params (evita conflicto de navegaciones)
    this.isFurnitureModalOpen = false;
    this.selectedFurniture = null;
    // Navegar al visor 3D
    this.router.navigate(['/viewer-3d', ref]);
  }

  openFurnitureModal(furniture: Furniture) {
    this.selectedFurniture = furniture;
    this.isFurnitureModalOpen = true;
    // Cargar los pasos de montaje
    this.apiService.getFurnitureAssembly(furniture.id).subscribe({
      next: (response) => {
        console.log('Assembly data received:', response);
        this.selectedFurnitureSteps = response.steps || [];
      },
      error: (error) => {
        console.error('Error al cargar los pasos de montaje:', error);
        this.selectedFurnitureSteps = [];
      }
    });
  }

  closeFurnitureModal() {
    this.isFurnitureModalOpen = false;
    this.selectedFurniture = null;
    this.selectedFurnitureSteps = [];
    // Limpiar el query param de la URL al cerrar el modal
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }

  /**
   * Abre el modal de un mueble buscándolo por su reference_number
   * Usado cuando se accede via QR: /catalogo?furniture=F001
   */
  openFurnitureModalByRef(referenceNumber: string) {
    this.apiService.getFurnitureById(referenceNumber).subscribe({
      next: (response) => {
        if (response.data && response.data.length > 0) {
          const furniture = response.data[0];
          this.openFurnitureModal(furniture);
        } else {
          console.error('Mueble no encontrado:', referenceNumber);
        }
      },
      error: (error) => {
        console.error('Error al cargar mueble por referencia:', error);
      }
    });
  }

  /**
   * Función central para cargar el catálogo.
   * Construye los filtros basados en el estado actual y llama a getFilteredFurniture
   */
  obtenerCatalogo() {
    const filters: FilterOptions = {
      ...this.activeFilters,
      category_ids: this.selectedCategoryId !== null ? [this.selectedCategoryId] : (this.activeFilters.category_ids || [])
    };

    // Agregar búsqueda si está activa
    if (this.hasSearched && this.previousSearchText.trim() !== '') {
      filters.search = this.previousSearchText.trim();
    }

    this.isLoadingFurnitures = true;
    if (filters.category_ids?.length === 0 && !filters.difficulties?.length && !filters.provider_ids?.length && !filters.color_ids?.length && !filters.search) {
      this.apiService.getAllFurniture().subscribe({
        next: (response) => {
          this.furnitures = response.data || [];
          this.isLoadingFurnitures = false;
        },
        error: (error) => {
          console.error('Error al obtener el catálogo de muebles:', error);
          this.furnitures = [];
          this.isLoadingFurnitures = false;
        }
      });
    } else {
      this.apiService.getFilteredFurniture(filters).subscribe({
        next: (response) => {
          this.furnitures = response.data || [];
          this.isLoadingFurnitures = false;
        },
        error: (error) => {
          console.error('Error al obtener el catálogo de muebles:', error);
          this.furnitures = [];
          this.isLoadingFurnitures = false;
        }
      });
    }

  }

  obtenerCategorias() {
    this.apiService.getCategories().subscribe(data => {
      this.categories = data.data;
    }, error => {
      console.error('Error al obtener las categorías:', error);
    });
  }

  loadProviders() {
    this.apiService.getVisibleProviders().subscribe({
      next: (response) => {
        this.providers = Object.values(response.data);
      },
      error: (error) => {
        console.error('Error al cargar proveedores:', error);
      }
    });
  }

  loadColors() {
    this.apiService.getColors().subscribe({
      next: (response) => {
        this.colors = Object.values(response.data);
      },
      error: (error) => {
        console.error('Error al cargar colores:', error);
      }
    });
  }

  onSearch() {
    const searchTerm = this.searchText.trim();
    this.searchInput.nativeElement.blur();

    if (searchTerm === '') {
      this.clearSearch();
      return;
    }

    this.hasSearched = true;
    this.previousSearchText = searchTerm;
    this.obtenerCatalogo();
  }

  clearSearch() {
    this.searchText = '';
    this.previousSearchText = '';
    this.hasSearched = false;
    this.obtenerCatalogo();
  }

  onSearchKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }

  onSearchBlur() {
    this.searchText = '';
  }

  openFilterModal() {
    this.isFilterModalOpen = true;
  }

  closeFilterModal() {
    setTimeout(() => { this.isFilterModalOpen = false; }, 350);
  }

  onApplyFilters(filters: FilterOptions) {
    this.activeFilters = { ...filters };
    this.calculateActiveFilters(this.activeFilters);
    this.obtenerCatalogo();
  }

  calculateActiveFilters(filters: FilterOptions) {
    this.activeFiltersCount =
      (filters.color_ids?.length || 0) +
      (filters.difficulties?.length || 0) +
      (filters.provider_ids?.length || 0);
  }

  filterByCategory(categoryId: number | null) {
    if (this.selectedCategoryId === categoryId) {
      return;
    }
    this.selectedCategoryId = categoryId;
    this.obtenerCatalogo();
  }

  onQrScanned(code: string) {
    console.log('Código QR escaneado:', code);

    if (code.includes('furniture')) {
      const furnitureId = code.split('/').pop();
      this.apiService.getFurnitureById(furnitureId!).subscribe({
        next: (response) => {
          const furniture = response.data;
          alert(`Mueble escaneado: ${furniture.name}`);
        },
        error: (error) => {
          console.error('Error al obtener el mueble escaneado:', error);
        }
      });
    }
    else if (code.startsWith('CONFIG:')) {
      const configKey = code.replace('CONFIG:', '');
      this.processConfiguration(configKey);
    }
    else {
      alert(`Código escaneado: ${code}`);
    }
  }

  processConfiguration(configKey: string) {
    console.log('Procesando configuración:', configKey);
  }

  getColorName(id: number): string {
    return this.colors.find(c => c.id === id)?.name || 'Color';
  }

  getProviderName(id: number): string {
    return this.providers.find(p => p.id === id)?.company_name || 'Proveedor';
  }

  getCategoryName(id: number | null): string {
    if (id === null) return 'Todos los muebles';
    return this.categories.find(c => c.id === id)?.name || 'Categoría';
  }

  getDifficultyLabel(value: 'low' | 'medium' | 'high'): string {
    return this.difficultyLabels[value] || 'Dificultad';
  }

  removeColorFilter(colorId: number) {
    if (!this.activeFilters.color_ids) return;
    this.activeFilters = {
      ...this.activeFilters,
      color_ids: this.activeFilters.color_ids.filter(id => id !== colorId)
    };
    this.updateFiltersAfterRemoval();
  }

  removeProviderFilter(providerId: number) {
    if (!this.activeFilters.provider_ids) return;
    this.activeFilters = {
      ...this.activeFilters,
      provider_ids: this.activeFilters.provider_ids.filter(id => id !== providerId)
    };
    this.updateFiltersAfterRemoval();
  }

  removeDifficultyFilter(difficulty: 'low' | 'medium' | 'high') {
    if (!this.activeFilters.difficulties) return;
    this.activeFilters = {
      ...this.activeFilters,
      difficulties: this.activeFilters.difficulties.filter(d => d !== difficulty)
    };
    this.updateFiltersAfterRemoval();
  }

  private updateFiltersAfterRemoval() {
    this.calculateActiveFilters(this.activeFilters);
    this.obtenerCatalogo();
  }


  downloadPDF() {
    if (!this.selectedFurniture) return;

    const furniture = this.selectedFurniture;
    console.log('Generating PDF with steps:', this.selectedFurnitureSteps);
    const doc = new jsPDF();

    // ===== FONDO GENERAL =====
    doc.setFillColor(220, 214, 213); // color #dcd6d5
    doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F');

    const primaryColor: [number, number, number] = [45, 26, 21]; // marron oscuro
    const secondaryColor: [number, number, number] = [186, 213, 227]; // azul claro
    const lightGray: [number, number, number] = [240, 240, 240];

    // ===== HEADER =====
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(...secondaryColor);
    doc.setFontSize(20);
    doc.text("Skäply", 20, 18);

    doc.setFontSize(10);
    doc.text("Ficha técnica de producto", 150, 18);

    // Reset color texto
    doc.setTextColor(...primaryColor);

    // ===== TÍTULO PRODUCTO =====
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(furniture.name, 20, 45);

    // ===== IMAGEN =====
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = furniture.image_url || 'assets/skaply_azul.png';

    img.onload = () => {

      doc.addImage(img, "JPEG", 140, 40, 50, 50);

      // ===== TABLA INFORMACIÓN =====
      autoTable(doc, {
        startY: 100,
        head: [['Información del producto', '']],
        body: [
          ['Referencia', furniture.reference_number],
          ['Proveedor', furniture.provider_id ? this.getProviderName(furniture.provider_id) : 'N/A'],
          ['Dificultad', this.difficultyLabels[furniture.difficulty]],
          ['Categoría', this.getCategoryName(furniture.category_id)],
        ],
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: 255
        },
        alternateRowStyles: {
          fillColor: lightGray
        }
      });

      // ===== DESCRIPCIÓN =====
      const finalY = (doc as any).lastAutoTable.finalY + 15;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Descripción", 20, finalY);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      const splitDescription = doc.splitTextToSize(
        furniture.short_description,
        170
      );

      doc.text(splitDescription, 20, finalY + 8);

      let currentY = finalY + 8 + (splitDescription.length * 5);

      // ===== PASOS DE MONTAJE =====
      console.log('Checking steps for PDF. Length:', this.selectedFurnitureSteps?.length);
      console.log('Steps content:', this.selectedFurnitureSteps);
      
      if (this.selectedFurnitureSteps && this.selectedFurnitureSteps.length > 0) {
        console.log('Adding steps to PDF');
        currentY += 10;

        // Si no hay espacio suficiente, agregar nueva página
        const pageHeight = doc.internal.pageSize.height;
        if (currentY > pageHeight - 80) {
          doc.addPage();
          currentY = 30;
          // Agregar fondo a la nueva página
          doc.setFillColor(220, 214, 213);
          doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F');
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryColor);
        doc.text("Pasos de montaje", 20, currentY);

        // Preparar datos de pasos para la tabla
        const stepsData = this.selectedFurnitureSteps.map((step, index) => {
          console.log(`Processing step ${index + 1}:`, step);
          const stepNumber = index + 1;
          const parts = step.parts && step.parts.length > 0 
            ? step.parts.map((p: any) => `${p.reference_number} (x${p.quantity})`).join(', ')
            : 'Sin piezas';
          const description = step.description || (step.tools && step.tools.length > 0
            ? step.tools.map((t: any) => t.name).join(', ')
            : 'Sin descripción');
          
          return [`Paso ${stepNumber}`, parts, description];
        });
        
        console.log('Steps data for table:', stepsData);

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Paso', 'Piezas', 'Descripción']],
          body: stepsData,
          theme: 'grid',
          headStyles: {
            fillColor: primaryColor,
            textColor: 255
          },
          alternateRowStyles: {
            fillColor: lightGray
          },
          styles: {
            fontSize: 9,
            cellPadding: 3
          },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 85 },
            2: { cellWidth: 60 }
          }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
      } else {
        console.log('No steps available for PDF generation');
      }

      // ===== FOOTER =====
      const pageHeight = doc.internal.pageSize.height;

      doc.setDrawColor(...primaryColor);
      doc.line(20, pageHeight - 20, 190, pageHeight - 20);

      doc.setFontSize(9);
      doc.text(
        `Generado el ${new Date().toLocaleDateString()}`,
        20,
        pageHeight - 10
      );

      doc.text(
        "© Skäply 2026",
        160,
        pageHeight - 10
      );

      // ===== GUARDAR =====
      doc.save(`Ficha_${furniture.name}.pdf`);
    };
  }


}