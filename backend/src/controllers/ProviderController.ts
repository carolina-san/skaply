import { NextFunction, Request, Response } from 'express';
import { ProviderService } from '../services/ProviderService';
import { ApiError } from '@/utils/ApiError';
import { validateProvider, validateNotSamePassword, getAndValidateIdFromEmailToken } from '@/utils/provider.utils';
import { validateCorrectPassword, validateProviderData, validatePasswordStrenght, hashPassword } from '@/utils/auth.utils';
import { pickFields, validateNotEmptyObject, validateParameterId, parseBooleanQuery } from '@/utils/common.utils';
import { validateRequiredFields } from '@/utils/common.utils';
import { RegistrationStatus, UserRole } from '@/types';
import bcrypt from "bcryptjs";


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
      const filters: {
        registration_status?: RegistrationStatus;
        enabled?: boolean;
        visible?: boolean;
      } = {};

      const enabled = parseBooleanQuery(req.query.enabled as string | undefined);
      const visible = parseBooleanQuery(req.query.visible as string | undefined);
      const registrationStatus = req.query.registration_status as RegistrationStatus | undefined;

      if (enabled !== undefined) {
        filters.enabled = enabled;
      }

      if (visible !== undefined) {
        filters.visible = visible;
      }

      if (registrationStatus !== undefined) {
        if (!Object.values(RegistrationStatus).includes(registrationStatus)) {
          throw new ApiError('BAD_REQUEST', 'Invalid registration status');
        }
        filters.registration_status = registrationStatus;
      }

      if (filters.visible === true && filters.enabled === false) {
        throw new ApiError(
          'BAD_REQUEST',
          'Visible providers must be enabled'
        );
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      const result = await this.providerService.getProviders({ ...filters, page, limit, search });

      res.status(200).json({
        message: 'Providers fetched successfully',
        data: result.rows,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });

    } catch (error) {
      if (error instanceof ApiError) return next(error);
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

  makeProviderVisible = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // validation
      const providerId = validateParameterId(req.params.id || '');
      await validateProvider(this.providerService, providerId, { checkEnabled: true });
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

  rejectRegistration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // validation
      const providerId = validateParameterId(req.params.id || "");
      await validateProvider(this.providerService, providerId, { checkPendingRegistration: true });
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

  updateProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // validation
      const providerId = validateParameterId(req.params.id || "");

      // allowed fields
      const allowedFields = [
        'email',
        'cif',
        'company_name',
        'telephone',
        'tax_address',
        'visible',
        'enabled'
      ];

      // pick fields and validate
      const updateData = pickFields(req.body, allowedFields);
      validateNotEmptyObject(updateData, 'No fields to update');
      validateProviderData(updateData);

      const validateOptions: any = {};
      if (updateData.enabled === true) {
        validateOptions.checkApprovedRegistration = true;
      }
      const currentProvider = await validateProvider(this.providerService, providerId, validateOptions);

      // Validate business rules for visible
      if ('visible' in updateData) {
        const finalEnabled = 'enabled' in updateData ? updateData.enabled : currentProvider.enabled;

        if (updateData.visible === true && finalEnabled === false) {
          throw new ApiError('BAD_REQUEST', 'Cannot make provider visible when it is not enabled. Enable the provider first.');
        }
      }

      // If disabling provider, also make it invisible
      if ('enabled' in updateData && updateData.enabled === false) {
        updateData.visible = false;
      }

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

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // validation
      const providerId = validateParameterId(req.params.id || "");
      await validateProvider(this.providerService, providerId, { checkApprovedRegistration: true });

      // validate fields
      const requiredFields = ['newPassword'];
      validateRequiredFields(req.body, requiredFields);
      const { newPassword } = req.body;

      // validate new password
      validatePasswordStrenght(newPassword);

      // hash
      const hashedPassword = await hashPassword(newPassword);

      // update password 
      const result = await this.providerService.updateProvider(providerId, { password: hashedPassword });

      // response
      res.status(200).json({
        message: 'Provider password updated successfully',
        data: result
      });

      // error
    } catch (error) {
      if (error instanceof ApiError) { return next(error); }
      next(new ApiError('INTERNAL_SERVER', 'Failed to update provider\'s password'));
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

  updateMyProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // validation
      const providerId = await getAndValidateIdFromEmailToken(this.providerService, req.user?.emailuser || "");
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

  changeMyPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // validation
      const providerId = await getAndValidateIdFromEmailToken(this.providerService, req.user?.emailuser || "");
      await validateProvider(this.providerService, providerId, { checkEnabled: true });

      // validate fields
      const requiredFields = ['currentPassword', 'newPassword'];
      validateRequiredFields(req.body, requiredFields);
      const { currentPassword, newPassword } = req.body;

      // get stored password
      const storedPassword = await this.providerService.getProviderPassword(providerId);

      // validations
      await validateCorrectPassword(currentPassword, storedPassword);
      await validateNotSamePassword(newPassword, storedPassword);
      validatePasswordStrenght(newPassword);

      // hash new password
      const hashedPassword = await hashPassword(newPassword);

      // update provider with new password
      const result = await this.providerService.updateProvider(providerId, { password: hashedPassword });

      // response
      res.status(200).json({
        message: 'Provider password updated successfully',
        data: result
      });

      // error
    } catch (error) {
      if (error instanceof ApiError) { return next(error); }
      next(new ApiError('INTERNAL_SERVER', 'Failed to update provider\'s password'));
    }
  };
}