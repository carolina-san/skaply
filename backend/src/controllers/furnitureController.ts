import { NextFunction, Request, Response } from 'express';
import { ApiError } from '@/utils/ApiError';
import { FurnitureService } from '../services/furnitureService'
import { ProviderService } from '../services/ProviderService'
import { Difficulty } from '@/types/common.types';
import { UserRole } from '@/types/user.types';
/*import { UserService } from '../services/UserService';*/

const validDifficulties = ['low', 'medium', 'high'];

export class FurnitureController {
  private furnitureService: FurnitureService;
  private providerService: ProviderService;

  constructor(furnitureService?: FurnitureService, providerService?: ProviderService) {
    this.furnitureService = furnitureService || new FurnitureService();
    this.providerService = providerService || new ProviderService();
  }

  getAllFurniture = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Example database query
      const result = await this.furnitureService.getAllFurniture();

      res.status(200).json({
        message: 'Database connected successfully',
        data: result.rows
      });
    } catch (error) {
      console.error('getAllFurniture error:', error);
      next(new ApiError('INTERNAL_SERVER', 'Failed to fetch furnitures'));
    }
  };

  getFurnitureById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const identifier = req.params.id;
      
      if (!identifier) {
        next(new ApiError('BAD_REQUEST', 'Furniture ID or reference is required'));
        return;
      }

      const result = await this.furnitureService.getFurnitureByIdOrReference(identifier);

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

      res.status(200).json({
        message: 'Furniture fetched',
        data: result.rows
      });

    } catch (error) {
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

    createFurniture = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        name,
        file_uri,
        difficulty,
        image_url,
        reference_number,
        category_id,
        provider_id,
        color_id,
        short_description
      } = req.body;

      if (!name || !file_uri || !difficulty) {
        return next(new ApiError('BAD_REQUEST', 'Name, file_uri and difficulty are required'));
      }

      if (!validDifficulties.includes(difficulty)) {
        throw new ApiError('UNPROCESSABLE', 'Invalid difficulty value');
      }

      const isProvider = await this.providerService.checkProviderRoleById(provider_id);

      if (!isProvider) {
        throw new ApiError('UNPROCESSABLE', 'User is not a provider');
      }

      await this.furnitureService.checkResourcesExist(category_id, provider_id, color_id);
      
      const furniture = await this.furnitureService.createFurniture({
        name,
        file_uri,
        difficulty,
        image_url,
        reference_number,
        category_id,
        provider_id,
        color_id,
        short_description
      });

      res.status(201).json({
        status: 'success',
        message: 'Furniture created successfully',
        data: furniture
      });

    } catch (error) {
      next(error);
    }
  }

  updateFurniture = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const furnitureId = Number(req.params.id);
      if (!furnitureId || isNaN(furnitureId)) {
        return next(new ApiError('BAD_REQUEST', 'Valid furniture ID is required'));
      }

      // Obtener ID del usuario que hace la petición
      const userId = await this.providerService.getProviderIdByEmail(req.user?.emailuser || '');
      if (!userId) return next(new ApiError('UNAUTHORIZED', 'User not found'));

      // Obtener provider_id del mueble
      const furnitureProviderId = await this.providerService.getProviderIdByFurnitureId(furnitureId);
      if (!furnitureProviderId) return next(new ApiError('NOT_FOUND', 'Furniture not found'));

      // Reglas de permisos
      if (req.user?.role === UserRole.ADMIN) {
        // Admin puede modificar cualquier mueble
      } else if (req.user?.role === UserRole.PROV) {
        if (furnitureProviderId !== userId) {
          return next(new ApiError('FORBIDDEN', 'You can only update your own furniture'));
        }
      } else {
        return next(new ApiError('FORBIDDEN', 'Insufficient permissions'));
      }

      const {
        name,
        file_uri,
        image_url,
        reference_number,
        difficulty,
        category_id,
        provider_id,
        color_id,
        short_description
      } = req.body;

      if (difficulty && !validDifficulties.includes(difficulty)) {
        throw new ApiError('UNPROCESSABLE', 'Invalid difficulty value');
      }

      const updatedFurniture = await this.furnitureService.updateFurniture(furnitureId, {
        name,
        file_uri,
        image_url,
        reference_number,
        difficulty,
        category_id,
        provider_id,
        color_id,
        short_description
      });

      res.status(200).json({
        message: 'Furniture updated successfully',
        data: updatedFurniture
      });
    } catch (error: any) {
      if (error.message === 'Furniture not found') {
        next(new ApiError('NOT_FOUND', error.message));
      } else {
        next(new ApiError('INTERNAL_SERVER', error.message));
      }
    }
  };

  deleteFurniture = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await this.providerService.getProviderIdByEmail(req.user?.emailuser || '');
      if (!userId) {
        return next(new ApiError('UNAUTHORIZED', 'User not found'));
      }

      const furnitureId = Number(req.params.id);
      if (!furnitureId) {
        return next(new ApiError('BAD_REQUEST', 'Furniture ID is required'));
      }

      const furnitureProviderId = await this.providerService.getProviderIdByFurnitureId(furnitureId);
      if (!furnitureProviderId) {
        return next(new ApiError('NOT_FOUND', 'Furniture not found'));
      }

      // Reglas de permisos
      if (req.user?.role === UserRole.ADMIN) {
        // Admin puede eliminar cualquier mueble
      } else if (req.user?.role === UserRole.PROV) {
        if (furnitureProviderId !== userId) {
          return next(new ApiError('FORBIDDEN', 'You can only delete your own furniture'));
        }
      } else {
        return next(new ApiError('FORBIDDEN', 'Insufficient permissions'));
      }

      const deletedFurniture = await this.furnitureService.deleteFurniture(furnitureId);
      res.status(200).json({
        message: 'Furniture deleted successfully',
        data: deletedFurniture
      });

    } catch (error) {
      next(error);
    }
  };

}
