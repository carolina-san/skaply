import { Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  templateUrl: './spinner.html'
})
export class SpinnerComponent {
  message = input<string>('Cargando...');
}
