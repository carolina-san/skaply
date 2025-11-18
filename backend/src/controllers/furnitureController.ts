import { Request, Response } from 'express';
import { FurnitureService } from '../services/furnitureService'
/*import { UserService } from '../services/UserService';*/

export class FurnitureController {
  private furnitureService: FurnitureService;

  constructor(furnitureService?: FurnitureService) {
    this.furnitureService = furnitureService || new FurnitureService();
  }

  getFurnitures = async (req: Request, res: Response): Promise<void> => {
    try {
      // Example database query
      const result = await this.furnitureService.getAllFurniture();
      res.status(200).json({
        message: 'Database connected successfully',
        data: result.rows
      });
    } catch (error) {
      console.error('getFurnitures error:', error);
      res.status(500).json({ error: 'Failed to fetch furnitures', details: (error as Error).message });
    }
  };

  getFurnitureById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id || '0');
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid furniture ID' });
        return;
      }
      const result = await this.furnitureService.getFurnitureById(id);
      res.status(200).json({
        message: 'Furniture fetched',
        data: result.rows
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch this furniture' })
    }
  }

  getFurnitureParts = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id || '0');
      // Validate request parameter
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid furniture ID' });
        return;
      }
      // Check if the furniture exists in the database
      const exists = await this.furnitureService.furnitureExists(id);
      if (!exists) {
        res.status(404).json({ error: 'Furniture not found' });
        return;
      }
      const parts = await this.furnitureService.getFurnitureParts(id);
      // Handle case where no parts are associated
      if (parts.rows.length === 0) {
        res.status(404).json({ error: 'No parts found for this furniture' });
        return;
      }
      // Success response
      res.status(200).json({
        data: parts.rows
      });
    } catch (error) {
      // Catch unexpected errors
      res.status(500).json({ error: 'Unable to fetch the parts of the furniture' })
    }
  }

  getFurnitureStepParts = async (req: Request, res: Response): Promise<void> => {
    try {
      const idFurniture = parseInt(req.params.id || '0');
      const stepNumber = parseInt(req.params.stepId || '0');
      // Validate request parameter
      if (isNaN(idFurniture) || isNaN(stepNumber)) {
        res.status(400).json({ error: 'Invalid parameters type' });
        return;
      }
      // Check if the furniture exists in the database
      const existsFurniture = await this.furnitureService.furnitureExists(idFurniture);
      if (!existsFurniture) {
        res.status(404).json({ error: 'Furniture not found' });
        return;
      }
      // Check if the furniture has the step number
      const existsStepNumber = await this.furnitureService.stepExists(idFurniture, stepNumber);
      if (!existsStepNumber) {
        res.status(404).json({ error: 'Step within the furniture not found' });
        return;
      }
      const parts = await this.furnitureService.getFurnitureStepParts(idFurniture, stepNumber);
      // Handle case where no parts are associated
      if (parts.rows.length === 0) {
        res.status(404).json({ error: `No parts found for this furniture´s step` });
        return;
      }
      // Success response
      res.status(200).json({
        data: parts.rows
      });
    } catch (error) {
      // Catch unexpected errors
      res.status(500).json({ error: `Unable to fetch the parts of the furniture's step` })
    }
  }

  filterFurniture = async (req: Request, res: Response): Promise<void> => {
    try {
      const { difficulties, provider_ids, category_ids, color_ids, search } = req.body;

      const result = await this.furnitureService.getFilteredFurniture({
        difficulties,
        provider_ids,
        category_ids,
        color_ids,
        search
      });
      res.status(200).json({
        message: 'Furniture fetched',
        data: result.rows
      });

    } catch (error) {
      // Catch unexpected errors
      res.status(500).json({ error: `Unable to fetch the parts of the furniture's step` })
    }
  }

}
