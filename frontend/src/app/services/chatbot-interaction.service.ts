import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ChatbotInteractionService {
    private stepChangeSource = new Subject<{ furnitureRef: string, stepNumber: number }>();
    stepChange$ = this.stepChangeSource.asObservable();

    requestStepChange(furnitureRef: string, stepNumber: number) {
        this.stepChangeSource.next({ furnitureRef, stepNumber });
    }
}
