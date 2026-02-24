import { UserRole, RegistrationStatus } from '@/types/user.types';

export interface checkProvider {
  role: UserRole; 
  registration_status: RegistrationStatus;
  enabled: boolean;
  visible: boolean
}