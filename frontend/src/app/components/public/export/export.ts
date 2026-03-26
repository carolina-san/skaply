import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Furniture, ProviderBasic } from '../../../types';
import { DifficultyLabels } from '../../../utils/difficulty-labels';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-export',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './export.html',
  styleUrl: './export.css'
})
export class Export implements OnChanges {
  @Input() selectedFurniture: Furniture | undefined;
  selectedFurnitureSteps: any[] = [];
  difficultyLabels: typeof DifficultyLabels = DifficultyLabels;
  isDownloadingPdf = false;

  provider: ProviderBasic | undefined;
  category: any | undefined;
  providerName: string = 'Proveedor';
  categoryName: string = 'Categoría';

  constructor(private apiService: ApiService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedFurniture'] && this.selectedFurniture) {
      this.fetchSteps(this.selectedFurniture.id);
      if (this.selectedFurniture.provider_id) {
        this.fetchProvider(this.selectedFurniture.provider_id);
      }
      if (this.selectedFurniture.category_id) {
        this.fetchCategory(this.selectedFurniture.category_id);
      }
    } else if (changes['selectedFurniture'] && !this.selectedFurniture) {
      this.selectedFurnitureSteps = [];
      this.providerName = 'Proveedor';
      this.categoryName = 'Categoría';
    }
  }

  fetchSteps(furnitureId: number) {
    this.apiService.getFurnitureAssemblyById(furnitureId).subscribe({
      next: (response) => {
        this.selectedFurnitureSteps = response.steps || [];
      },
      error: (error) => {
        console.error('Error fetching steps:', error);
        this.selectedFurnitureSteps = [];
      }
    });
  }

  fetchProvider(id: number) {
    this.apiService.getProviderById(id).subscribe({
      next: (response) => {
        this.provider = response.data;
        this.providerName = this.provider?.company_name || 'Proveedor';
      },
      error: (error) => console.error('Error fetching provider:', error)
    });
  }

  fetchCategory(id: number) {
    this.apiService.getCategoryById(id).subscribe({
      next: (response) => {
        this.category = response.data;
        console.log(this.category);
        this.categoryName = this.category.name || 'Categoría';
      },
      error: (error) => console.error('Error fetching category:', error)
    });
  }

  async downloadPDF() {
    if (!this.selectedFurniture || this.isDownloadingPdf) return;

    this.isDownloadingPdf = true;
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const furniture = this.selectedFurniture;
    const doc = new jsPDF();

    try {
      const loadFontAsBase64 = async (fontPath: string): Promise<string> => {
        const fontResponse = await fetch(fontPath);
        const fontBlob = await fontResponse.blob();

        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            resolve(base64data.split(',')[1]);
          };
          reader.onerror = () => reject(new Error(`Error reading font: ${fontPath}`));
          reader.readAsDataURL(fontBlob);
        });
      };

      const [base64Font, base64FontBold] = await Promise.all([
        loadFontAsBase64('assets/fonts/inter.ttf'),
        loadFontAsBase64('assets/fonts/Inter-Bold.ttf')
      ]);

      doc.addFileToVFS('inter.ttf', base64Font);
      doc.addFont('inter.ttf', 'inter', 'normal');
      doc.addFileToVFS('Inter-Bold.ttf', base64FontBold);
      doc.addFont('Inter-Bold.ttf', 'inter', 'bold');

      await this.generatePDFContent(doc, furniture, autoTable);
    } catch (error) {
      console.error('Error loading font:', error);
      // Fallback a fuente por defecto si falla
      await this.generatePDFContent(doc, furniture, autoTable);
    } finally {
      this.isDownloadingPdf = false;
    }
  }

  async generatePDFContent(doc: any, furniture: Furniture, autoTable: any) {
    // Helper para cargar imágenes como Promesa
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
      });
    };

    try {
      // Cargar imágenes en paralelo
      const [logo, productImg] = await Promise.all([
        loadImage('assets/skaply_azul.png'),
        loadImage(furniture.image_url || 'assets/logo.png') // Fallback si no hay url
          .catch(() => loadImage('assets/logo.png')) // Fallback si falla la carga
      ]);

      // ===== FONDO GENERAL =====
      doc.setFillColor(220, 214, 213); // beige;
      doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F');

      const primaryColor: [number, number, number] = [45, 26, 21]; // marron oscuro
      const secondaryColor: [number, number, number] = [186, 213, 227]; // azul claro
      const lightGray: [number, number, number] = [240, 240, 240];

      // ===== HEADER =====
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 30, "F");

      doc.setTextColor(...secondaryColor);
      doc.setFontSize(20);

      doc.setFont("inter", "bold");
      const logoAspectRatio = logo.height / logo.width;
      const logoHeight = logoAspectRatio * 50;
      doc.addImage(logo, "PNG", 20, 7, 50, logoHeight);

      doc.setFontSize(10);
      doc.text("Ficha técnica del producto", 140, 18);

      doc.setTextColor(...primaryColor);

      // ===== TÍTULO PRODUCTO =====
      doc.setFontSize(18);
      // Usar Inter
      doc.setFont("inter", "bold");
      doc.text(furniture.name, 20, 45);

      // ===== DESCRIPCIÓN Y IMAGEN (LADO A LADO) =====
      const contentStartY = 55;
      const descriptionWidth = 110;
      const descriptionX = 20;

      // Sección Descripción (Izquierda)
      doc.setFontSize(14);
      doc.setFont("inter", "bold");

      doc.setFontSize(11);
      doc.setFont("inter", "normal");

      const splitDescription = doc.splitTextToSize(
        furniture.short_description,
        descriptionWidth
      );

      doc.text(splitDescription, descriptionX, contentStartY);

      // Altura ocupada por la descripción
      const descriptionHeight = 8 + (splitDescription.length * 5);

      // ===== IMAGEN (Derecha) =====
      const imgX = 140;
      const imgY = 50;
      const imgWidth = 50;

      // Calcular altura manteniendo el aspecto
      const aspectRatio = productImg.height / productImg.width;
      const imgHeight = imgWidth * aspectRatio;

      doc.addImage(productImg, "JPEG", imgX, imgY, imgWidth, imgHeight);

      const descriptionEndY = contentStartY + descriptionHeight;
      const imageEndY = imgY + imgHeight;

      let nextSectionY = Math.max(descriptionEndY, imageEndY) + 15;

      // ===== TABLA INFORMACIÓN =====
      autoTable(doc, {
        startY: nextSectionY,
        head: [['Información del producto', '']],
        body: [
          ['Referencia', furniture.reference_number],
          ['Proveedor', this.providerName],
          ['Dificultad', this.difficultyLabels[furniture.difficulty]],
          ['Categoría', this.categoryName],
        ],
        theme: 'grid',
        margin: { left: 20, right: 20 },
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          font: 'inter', // Especificar fuente para autotable
          fontStyle: 'bold'
        },
        styles: {
          font: 'inter', // Especificar fuente para autotable
          fontStyle: 'normal'
        },
        alternateRowStyles: {
          fillColor: lightGray
        }
      });

      // ===== PASOS DE MONTAJE =====
      let currentY = (doc as any).lastAutoTable.finalY + 15;

      if (this.selectedFurnitureSteps && this.selectedFurnitureSteps.length > 0) {

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
        doc.setFont("inter", "bold");
        doc.setTextColor(...primaryColor);
        doc.text("Pasos de montaje", 20, currentY);

        // Preparar datos de pasos para la tabla
        const stepsData = this.selectedFurnitureSteps.map((step, index) => {
          const stepNumber = index + 1;
          const parts = step.parts && step.parts.length > 0
            ? step.parts.map((p: any) => `${p.reference_number}`).join(', ')
            : 'Sin piezas';
          const description = step.description || (step.tools && step.tools.length > 0
            ? step.tools.map((t: any) => t.name).join(', ')
            : 'Sin descripción');


          return [`Paso ${stepNumber}`, parts, description];
        });

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Paso', 'Piezas', 'Descripción']],
          body: stepsData,
          theme: 'grid',
          margin: { left: 20, right: 20 },
          headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            font: 'inter', // Fuente en steps table
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: lightGray
          },
          styles: {
            fontSize: 9,
            cellPadding: 3,
            font: 'inter', // Fuente en steps table
            fontStyle: 'normal'
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
      doc.setFont("inter", "normal");
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

    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  }
}
