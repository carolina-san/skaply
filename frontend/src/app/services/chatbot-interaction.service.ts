import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class ChatbotInteractionService {
    private stepChangeSource = new Subject<{ furnitureRef: string, stepNumber: number }>();
    stepChange$ = this.stepChangeSource.asObservable();

    private autoSendPieceSource = new Subject<string>();
    autoSendPiece$ = this.autoSendPieceSource.asObservable();

    requestStepChange(furnitureRef: string, stepNumber: number) {
        this.stepChangeSource.next({ furnitureRef, stepNumber });
    }

    requestAutoSendPiece(text: string) {
        this.autoSendPieceSource.next(text);
    }

    private partIsolationSource = new Subject<{ furnitureRef: string, partName: string }>();
    partIsolation$ = this.partIsolationSource.asObservable();

    requestPartIsolation(furnitureRef: string, partName: string) {
        this.partIsolationSource.next({ furnitureRef, partName });
    }
}
