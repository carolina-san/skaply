import { NextFunction, Request, Response } from 'express';
import { ProviderService } from '../services/ProviderService';
import { ApiError } from '@/utils/ApiError';
import { validateProvider } from '@/utils/provider.utils';
import { validateProviderData } from '@/utils/auth.utils';
import { pickFields, validateNotEmptyObject, validateParameterId } from '@/utils/common.utils';
import { RegistrationStatus, UserRole } from '@/types';

export class ProviderController {

  private providerService: ProviderService;

  constructor(providerService?: ProviderService) {
    this.providerService = providerService || new ProviderService();
  }

  // PUBLIC ROUTES

  getVisibleProviders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.providerService.getVisibleProviders();
      res.status(200).json({
        message: 'Providers fetched successfully',
        data: result
      });
    } catch (error) {
      next(new ApiError('INTERNAL_SERVER', 'Failed to fetch providers'));
    }
  }

  getVisibleProviderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // validation
      const providerId = validateParameterId(req.params.id || "");
      await validateProvider(this.providerService, providerId, { checkVisible: true });
      // fetch
      const result = await this.providerService.getVisibleProviderById(providerId);
      // response
      res.status(200).json({
        message: 'Provider fetched successfully',
        data: result
      });
      // error
    } catch (error) {
        if (error instanceof ApiError) { return next(error); }
        next(new ApiError('INTERNAL_SERVER', 'Failed to fetch this provider'));
    }
  };
  
  // PRIVATE ROUTES (ADMIN ONLY)

  getProviders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.providerService.getProviders();
      res.status(200).json({
        message: 'Providers fetched successfully',
        data: result
      });
    } catch (error) {
      next(new ApiError('INTERNAL_SERVER', 'Failed to fetch providers'));
    }
  };

  getProviderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // validation
      const providerId = validateParameterId(req.params.id || "");
      await validateProvider(this.providerService, providerId);
      // fetch
      const result = await this.providerService.getProviderById(providerId);
      // response
      res.status(200).json({
        message: 'Provider fetched successfully',
        data: result
      });
      // error
    } catch (error) {
        if (error instanceof ApiError) { return next(error); }
        next(new ApiError('INTERNAL_SERVER', 'Failed to fetch this provider'));
    }
  };

  enableProvider = async (req: Request, res: Response, next: NextFunction): 
  Promise<void> => {
    try {
      // validation
      const providerId = validateParameterId(req.params.id || "");
      await validateProvider(this.providerService, providerId, { checkApprovedRegistration: true });
      // fetch
      const result = await this.providerService.enableProvider(providerId);
      // response
      res.status(200).json({
        message: 'Provider enabled successfully',
        data: result
      });
      // error
    } catch (error) {
        if (error instanceof ApiError) { return next(error); }
        next(new ApiError('INTERNAL_SERVER', 'Failed to enable provider'));
      }
  };

  disableProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // validation
      const providerId = validateParameterId(req.params.id || "");
      await validateProvider(this.providerService, providerId);
      // fetch
      const result = await this.providerService.disableProvider(providerId);
      // response
      res.status(200).json({
        message: 'Provider disabled successfully',
        data: result
      });
      // error
    } catch (error) {
        if (error instanceof ApiError) { return next(error); }
        next(new ApiError('INTERNAL_SERVER', 'Failed to disable provider'));
      }
  };

  makeProviderVisible = async (req: Request,res: Response,next: NextFunction): Promise<void> => {
    try {
      // validation
      const providerId = validateParameterId(req.params.id || '');
      await validateProvider(this.providerService, providerId, {checkEnabled: true});
      // fecth
      const result = await this.providerService.setProviderVisible(providerId, true);
      // response
      res.status(200).json({
        message: 'Provider is now visible',
        data: result
      });
      // error
    } catch (error) {
      if (error instanceof ApiError) return next(error);
      next(new ApiError('INTERNAL_SERVER', 'Failed to make provider visible'));
    }
  };

  makeProviderInvisible = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // validation
      const providerId = validateParameterId(req.params.id || '');
      await validateProvider(this.providerService, providerId);
      // fetch
      const result = await this.providerService.setProviderVisible(providerId, false);
      if (!result) {
        throw new ApiError('NOT_FOUND', 'Provider not found');
      }
      // response
      res.status(200).json({
        message: 'Provider is now hidden',
        data: result
      });
      // error
    } catch (error) {
      if (error instanceof ApiError) return next(error);
      next(new ApiError('INTERNAL_SERVER', 'Failed to hide provider'));
    }
  };

  approveRegistration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // validation
      const providerId = validateParameterId(req.params.id || "");
      await validateProvider(this.providerService, providerId, { checkPendingRegistration: true });
      // fetch
      const result = await this.providerService.approveRegistration(providerId);
      // response
      res.status(200).json({
        message: 'Provider approved successfully',
        data: result
      });
      // error
    } catch (error) {
        if (error instanceof ApiError) { return next(error); }
        next(new ApiError('INTERNAL_SERVER', 'Failed to enable provider\'s registration'));
      }
  };

  rejectRegistration = async ( req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // validation
      const providerId = validateParameterId(req.params.id || "");
      const provider = await validateProvider(this.providerService, providerId, { checkPendingRegistration: true });
      // fetch
      const result = await this.providerService.rejectRegistration(providerId);
      // response
      res.status(200).json({
        message: 'Provider rejected successfully',
        data: result
      });
      // error
    } catch (error) {
        if (error instanceof ApiError) { return next(error); }
        next(new ApiError('INTERNAL_SERVER', 'Failed to reject provider\'s registration'));
      }
  };

  updateProvider = async ( req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // validation
      const providerId = validateParameterId(req.params.id || "");
      await validateProvider(this.providerService, providerId);

      // allowed filed
      const allowedFields = [
        'email',
        'cif',
        'company_name',
        'telephone',
        'tax_address'
      ];

      // pick fields and validate
      const updateData = pickFields(req.body, allowedFields);
      validateNotEmptyObject(updateData, 'No fields to update');
      validateProviderData(updateData);

      // fetch
      const result = await this.providerService.updateProvider(providerId, updateData);

      // response
      res.status(200).json({
        message: 'Provider updated successfully',
        data: result
      });

      // error
    } catch (error) {
        if (error instanceof ApiError) { return next(error); }
        next(new ApiError('INTERNAL_SERVER', 'Failed to update provider'));
      }
  };

  deleteProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // validation
      const providerId = validateParameterId(req.params.id || "");
      await validateProvider(this.providerService, providerId);
      // fetch
      const result = await this.providerService.deleteProvider(providerId);
      // response
      res.status(200).json({ message: `Provider ${providerId} deleted successfully` });
      // error
    } catch (error) {
        if (error instanceof ApiError) { return next(error); }
        next(new ApiError('INTERNAL_SERVER', 'Failed to delete provider'));
      }
  };

  // PRIVATE ROUTES (PROVIDER ONLY)

  updateMyProvider = async ( req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // validation
      const email = req.user?.emailuser;
      if (!email) {throw new ApiError('UNAUTHORIZED', 'User not authenticated');}
      const providerId = await this.providerService.getProviderIdByEmail(email);
      if (!providerId) {throw new ApiError('NOT_FOUND', 'Provider not found'); }
      await validateProvider(this.providerService, providerId);

      // allowed fields
      const allowedFields = ['company_name', 'telephone', 'tax_address'];
      
      // pick fields and validate
      const updateData = pickFields(req.body, allowedFields);
      validateNotEmptyObject(updateData, 'No fields to update');
      validateProviderData(updateData);

      console.log("updateData:", updateData);
      
      // fetch
      const result = await this.providerService.updateProvider(providerId, updateData);

      // response
      res.status(200).json({
        message: 'Provider profile updated successfully',
        data: result
      });

      // error
    } catch (error) {
        if (error instanceof ApiError) { return next(error); }
        next(new ApiError('INTERNAL_SERVER', 'Failed to update provider'));
      }
  };
}
