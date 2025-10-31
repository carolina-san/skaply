import { Request, Response } from 'express';
import { StepService } from '../services/stepService'
/*import { UserService } from '../services/UserService';*/

export class StepController {
  private stepService: StepService;

  constructor(stepService?: StepService) {
    this.stepService = stepService || new StepService();
  }

  
}