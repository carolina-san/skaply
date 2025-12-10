import { NextFunction, Request, Response } from 'express';
import { ApiError } from '@/utils/ApiError';
import { FurnitureService } from '../services/furnitureService'
/*import { UserService } from '../services/UserService';*/

export class FurnitureController {
  private furnitureService: FurnitureService;

  constructor(furnitureService?: FurnitureService) {
    this.furnitureService = furnitureService || new FurnitureService();
  }

  getFurnitures = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Example database query
      const result = await this.furnitureService.getAllFurniture();

      if (result.rows.length === 0) {
        next(new ApiError('NOT_FOUND', 'No furnitures found'));
        return;
      }

      res.status(200).json({
        message: 'Database connected successfully',
        data: result.rows
      });
    } catch (error) {
      console.error('getFurnitures error:', error);
      next(new ApiError('INTERNAL_SERVER', 'Failed to fetch furnitures'));
    }
  };

  getFurnitureById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id || '0');
      if (isNaN(id)) {
        next(new ApiError('BAD_REQUEST', 'Invalid furniture ID'));
        return;
      }
      const result = await this.furnitureService.getFurnitureById(id);

      if (result.rows.length === 0) {
        next(new ApiError('NOT_FOUND', 'Furniture not found'));
        return;
      }

      res.status(200).json({
        message: 'Furniture fetched',
        data: result.rows
      });
    } catch (error) {
      next(new ApiError('INTERNAL_SERVER', 'Failed to fetch this furniture'));
    }
  }

  getFurnitureParts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id || '0');
      // Validate request parameter
      if (isNaN(id)) {
        next(new ApiError('BAD_REQUEST', 'Invalid furniture ID'));
        return;
      }
      // Check if the furniture exists in the database
      const exists = await this.furnitureService.furnitureExists(id);
      if (!exists) {
        next(new ApiError('NOT_FOUND', 'Furniture not found'));
        return;
      }
      const parts = await this.furnitureService.getFurnitureParts(id);
      // Handle case where no parts are associated
      if (parts.rows.length === 0) {
        next(new ApiError('NOT_FOUND', 'No parts found for this furniture'));
        return;
      }
      // Success response
      res.status(200).json({
        data: parts.rows
      });
    } catch (error) {
      // Catch unexpected errors
      next(new ApiError('INTERNAL_SERVER', 'Unable to fetch the parts of the furniture'));
    }
  }

  getFurnitureStepParts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idFurniture = parseInt(req.params.id || '0');
      const stepNumber = parseInt(req.params.stepId || '0');
      // Validate request parameter
      if (isNaN(idFurniture) || isNaN(stepNumber)) {
        next(new ApiError('BAD_REQUEST', 'Invalid parameters type'));
        return;
      }
      // Check if the furniture exists in the database
      const existsFurniture = await this.furnitureService.furnitureExists(idFurniture);
      if (!existsFurniture) {
        next(new ApiError('NOT_FOUND', 'Furniture not found'));
        return;
      }
      // Check if the furniture has the step number
      const existsStepNumber = await this.furnitureService.stepExists(idFurniture, stepNumber);
      if (!existsStepNumber) {
        next(new ApiError('NOT_FOUND', 'Step within the furniture not found'));
        return;
      }
      const parts = await this.furnitureService.getFurnitureStepParts(idFurniture, stepNumber);
      // Handle case where no parts are associated
      if (parts.rows.length === 0) {
        next(new ApiError('NOT_FOUND', "No parts found for this furniture's step"));
        return;
      }
      // Success response
      res.status(200).json({
        data: parts.rows
      });
    } catch (error) {
      // Catch unexpected errors
      next(new ApiError('INTERNAL_SERVER', "Unable to fetch the parts of the furniture's step"));
    }
  }

  filterFurniture = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { difficulties, provider_ids, category_ids, color_ids, search } = req.body;

      const result = await this.furnitureService.getFilteredFurniture({
        difficulties,
        provider_ids,
        category_ids,
        color_ids,
        search
      });

      if (result.rows.length === 0) {
        next(new ApiError('NOT_FOUND', 'No furniture matches the filters'));
        return;
      }

      res.status(200).json({
        message: 'Furniture fetched',
        data: result.rows
      });

    } catch (error) {
      // Catch unexpected errors
      next(new ApiError('INTERNAL_SERVER', "Unable to fetch filtered furniture"));
    }
  }

  getFurnitureAssembly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const furnitureId = parseInt(req.params.id || '0');
      if (isNaN(furnitureId)) {
        next(new ApiError('BAD_REQUEST', 'Invalid furniture ID'));
        return;
      }

      // Llamada al servicio
      const assemblyData = await this.furnitureService.getFurnitureAssembly(furnitureId);

      if (!assemblyData) {
        next(new ApiError('NOT_FOUND', 'Furniture assembly not found'));
        return;
      }

      res.status(200).json(assemblyData);

    } catch (error) {
      console.error('getFurnitureAssembly error:', error);
      next(new ApiError('INTERNAL_SERVER', 'Failed to fetch furniture assembly'));
    }
  }

}
