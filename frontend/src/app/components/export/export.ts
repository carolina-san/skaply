import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Furniture, ProviderBasic, Color } from '../../types';
import { DifficultyLabels } from '../../utils/difficulty-labels';
import { ApiService } from '../../services/api.service';

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

  provider: ProviderBasic | undefined;
  category: any | undefined;

  constructor(private apiService: ApiService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedFurniture'] && this.selectedFurniture) {
      this.fetchSteps(this.selectedFurniture.id);
    } else if (changes['selectedFurniture'] && !this.selectedFurniture) {
      this.selectedFurnitureSteps = [];
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

  getProviderName(id: number): string {
    this.apiService.getProviderById(id).subscribe({
      next: (response) => {
        this.provider = response;
      },
      error: (error) => console.error('Error fetching provider:', error)
    });
    return this.provider?.company_name || 'Proveedor';
  }

  getCategoryName(id: number): string {
    this.apiService.getCategoryById(id).subscribe({
      next: (response) => {
        this.category = response;
      },
      error: (error) => console.error('Error fetching category:', error)
    });
    return this.category?.name || 'Categoría';
  }

  downloadPDF() {
    if (!this.selectedFurniture) return;

    const furniture = this.selectedFurniture;
    const doc = new jsPDF();

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

      if (this.selectedFurnitureSteps && this.selectedFurnitureSteps.length > 0) {
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
          const stepNumber = index + 1;
          const parts = step.parts && step.parts.length > 0
            ? step.parts.map((p: any) => `${p.reference_number} (x${p.quantity})`).join(', ')
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
