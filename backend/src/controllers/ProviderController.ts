import { NextFunction, Request, Response } from 'express';
import { ProviderService } from '../services/ProviderService';
import { ApiError } from '@/utils/ApiError';

export class ProviderController {

  private providerService: ProviderService;

  constructor(providerService?: ProviderService) {
    this.providerService = providerService || new ProviderService();
  }

  getProviders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Example database query
      const result = await this.providerService.getAllProviders();

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
      const id = parseInt(req.params.id || '0');
      if (isNaN(id)) {
        next(new ApiError('BAD_REQUEST', 'Invalid provider ID'));
        return;
      }
      const result = await this.providerService.getProvider(id);

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

  postProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { company_name, cif, tax_address, email, telephone } = req.body;

      if (!company_name || !cif || !tax_address || !email || !telephone) {
        next(new ApiError('BAD_REQUEST', 'All fields are required'));
        return;
      }

      const result = await this.providerService.createProvider(company_name, cif, tax_address, email, telephone);
      res.status(201).json({
        message: 'Provider created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      next(new ApiError('INTERNAL_SERVER', 'Failed to create provider'));
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




  //   updateProvider = async (req: Request, res: Response): Promise<void> => {
  //     try {
  //       const { id } = req.params;
  //       // Implementation here
  //       res.status(200).json({ message: `Update user ${id} endpoint` });
  //     } catch (error) {
  //       res.status(500).json({ error: 'Failed to update user' });
  //     }
  //   };
}
