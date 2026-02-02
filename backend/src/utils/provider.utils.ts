import { UserRole, RegistrationStatus } from '@/types/user.types';
import { checkProvider } from '@/types';
import { ApiError } from '@/utils/ApiError';
import { ProviderService } from '@/services/ProviderService';
import { validateParameterId } from './common.utils';

export const validateExistsProvider = (provider: any) => {
    if (!provider) {
    throw new ApiError('NOT_FOUND', 'Provider not found');
    }
};

export const validateRoleProvider = (provider: any) => {
  if (provider.role !== UserRole.PROV) {
    throw new ApiError('FORBIDDEN', 'Target user is not a provider');
  }
};

export const validateApprovedProvider = (provider: any) => {
  if (provider.registration_status !== RegistrationStatus.APPROVED) {
    throw new ApiError('CONFLICT', `Provider registration status is "${provider.registration_status}"`); 
  }
};

export const validatePendingProvider = (provider: any) => {
  if (provider.registration_status !== RegistrationStatus.PENDING) {
    throw new ApiError('CONFLICT', `Provider registration status is "${provider.registration_status}"`); 
  }
};

export const validateEnabledProvider = (provider: any) => {
  if (provider.enabled !== true) {
    throw new ApiError('CONFLICT', `Provider is not enabled`);
  }
};

export const validateVisibleProvider = (provider: any) => {
  if (provider.visible !== true) {
    throw new ApiError('CONFLICT', `Provider is not visible`);
  }
};

export interface ValidateProviderOptions {
  checkEnabled?: boolean;
  checkApprovedRegistration?: boolean;
  checkPendingRegistration?: boolean;
  checkVisible?: boolean;
}


/**
 * Validates a provider and optionally checks specific conditions.
 *
 * @param providerService - ProviderService instance
 * @param providerId - Provider ID
 * @param options - Optional checks to perform
 *
 * @param options.checkEnabled - Ensures provider is enabled
 * @param options.checkApprovedRegistration - Ensures registration is approved
 * @param options.checkPendingRegistration - Ensures registration is pending
 * @param options.checkVisible - Ensures provider is visible
 *
 * @throws ApiError if validation fails
 *
 * @example
 * // Only check that provider exists and has provider role
 * await validateProvider(providerService, providerId);
 *
 * @example
 * // Public endpoint: must be visible
 * await validateProvider(providerService, providerId, {
 *   checkVisible: true
 * });
 * 
 */
export async function validateProvider(
  providerService: ProviderService,
  providerId: number,
  options: ValidateProviderOptions = {}
): Promise<void>  {
  const {
    checkEnabled = false,
    checkApprovedRegistration = false,
    checkPendingRegistration = false,
    checkVisible = false
  } = options;
  const provider = await providerService.checkProviderById(providerId);
  validateExistsProvider(provider);
  validateRoleProvider(provider);
  if (checkEnabled) { validateEnabledProvider(provider);}
  if (checkApprovedRegistration) { validateApprovedProvider(provider);}
  if (checkPendingRegistration) {validatePendingProvider(provider); }
  if (checkVisible) {validateVisibleProvider(provider);}
}