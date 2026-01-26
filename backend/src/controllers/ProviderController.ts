import { NextFunction, Request, Response } from 'express';
import { ProviderService } from '../services/ProviderService';
import { ApiError } from '@/utils/ApiError';
import { UserRole } from '@/types/user.types';

export class ProviderController {

  private providerService: ProviderService;

  constructor(providerService?: ProviderService) {
    this.providerService = providerService || new ProviderService();
  }

  // PUBLIC ROUTES

  getActiveProviders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.providerService.getActiveProviders();

      if (result.rows.length === 0) {
        next(new ApiError('NOT_FOUND', 'No providers found'));
        return;
      }

      res.status(200).json({
        message: 'Providers fetched successfully',
        data: result.rows
      });
    } catch (error) {
      next(new ApiError('INTERNAL_SERVER', 'Failed to fetch providers'));
    }
  }

  getActiveProviderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id || '0');
      if (isNaN(id)) {
        next(new ApiError('BAD_REQUEST', 'Invalid provider ID'));
        return;
      }
      const result = await this.providerService.getActiveProvider(id);

      if (result.rows.length === 0) {
        next(new ApiError('NOT_FOUND', 'Provider not found'));
        return;
      }

      res.status(200).json({
        message: 'Provider fetched successfully',
        data: result.rows[0]
      });
    } catch (error) {
      next(new ApiError('INTERNAL_SERVER', 'Failed to fetch this provider'));
    }
  };
  
  // PRIVATE ROUTES
  
  getProviders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      
      if (!req.user) {
        return next(new ApiError('UNAUTHORIZED', 'Authentication required'));
      }

      if (req.user.role !== UserRole.ADMIN) {
        return next(new ApiError('FORBIDDEN', 'Insufficient permissions'));
      }
      const result = await this.providerService.getProviders();

      if (result.rows.length === 0) {
        next(new ApiError('NOT_FOUND', 'No providers found'));
        return;
      }

      res.status(200).json({
        message: 'Providers fetched successfully',
        data: result.rows
      });
    } catch (error) {
      next(new ApiError('INTERNAL_SERVER', 'Failed to fetch providers'));
    }
  };

  getProviderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      
      if (!req.user) {
        return next(new ApiError('UNAUTHORIZED', 'Authentication required'));
      }

      if (req.user.role !== UserRole.ADMIN) {
        return next(new ApiError('FORBIDDEN', 'Insufficient permissions'));
      }

      const id = parseInt(req.params.id || '0');
      if (isNaN(id)) {
        return next(new ApiError('BAD_REQUEST', 'Invalid provider ID'));
      }

      const result = await this.providerService.getProviderById(id);

      if (result.rows.length === 0) {
        return next(new ApiError('NOT_FOUND', 'Provider not found'));
      }

      res.status(200).json({
        message: 'Provider fetched successfully',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Error fetching provider by id:', error);
      next(new ApiError('INTERNAL_SERVER', 'Failed to fetch provider'));
    }
  };

  enableProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return next(new ApiError('BAD_REQUEST', 'Invalid provider ID'));
      }
      const result = await this.providerService.enableProvider(id);
      if (result.rows.length === 0) {
        return next(
          new ApiError(
            'CONFLICT',
            'Provider not found or already enabled'
          )
        );
      }
      res.status(200).json({
        message: 'Provider enabled successfully',
        data: result.rows[0]
      });
    } catch (error) {
      next(new ApiError('INTERNAL_SERVER', 'Failed to enable provider'));
    }
  };

  disableProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return next(new ApiError('BAD_REQUEST', 'Invalid provider ID'));
      }
      const result = await this.providerService.disableProvider(id);
      if (result.rows.length === 0) {
        return next(
          new ApiError(
            'CONFLICT',
            'Provider not found or already disabled'
          )
        );
      }
      res.status(200).json({
        message: 'Provider disabled successfully',
        data: result.rows[0]
      });
    } catch (error) {
      next(new ApiError('INTERNAL_SERVER', 'Failed to disable provider'));
    }
  };

  approveProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new ApiError('UNAUTHORIZED', 'Authentication required'));
      }

      if (req.user.role !== UserRole.ADMIN) {
        return next(new ApiError('FORBIDDEN', 'Only admins can approve providers'));
      }

      const providerId = Number(req.params.id);
      if (!providerId || isNaN(providerId)) {
        return next(new ApiError('BAD_REQUEST', 'Invalid provider ID'));
      }

      const result = await this.providerService.approveProvider(providerId);

      if (result.rowCount === 0) {
        return next(
          new ApiError(
            'NOT_FOUND',
            'Provider not found or already approved'
          )
        );
      }

      res.status(200).json({
        message: 'Provider approved successfully',
        data: result.rows[0]
      });

    } catch (error) {
      next(new ApiError('INTERNAL_SERVER', 'Failed to approve provider'));
    }
  };

  deleteProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id || '0');
      if (isNaN(id)) {
        next(new ApiError('BAD_REQUEST', 'Invalid provider ID'));
        return;
      }

      const result = await this.providerService.deleteProvider(id);

      if (result.rowCount === 0) {
        next(new ApiError('NOT_FOUND', 'Provider not found or could not be deleted'));
        return;
      }

      res.status(200).json({ message: `Provider ${id} deleted successfully` });
    } catch (error) {
      next(new ApiError('INTERNAL_SERVER', 'Failed to delete provider'));
    }
  };

}
