import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DifficultyLabels } from '../../utils/difficulty-labels';
import { Furniture } from '../../types';

@Component({
  selector: 'app-card-furniture',
  imports: [RouterLink, CommonModule],
  templateUrl: './card-furniture.html',
  styleUrl: './card-furniture.css'
})
export class CardFurniture {
  // @Input() furniture: any = {};
  @Input() furniture!: Furniture;
  
  difficultyLabels = DifficultyLabels;
}
