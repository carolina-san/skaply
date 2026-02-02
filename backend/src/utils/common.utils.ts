import { ApiError } from '@/utils/ApiError';

export const validateParameterId = (id: string) => {
  const idNumber = Number(id);
  if (isNaN(idNumber) || idNumber <= 0) {
    throw new ApiError('BAD_REQUEST', 'Invalid parameter ID');
  }
  return idNumber;
};

export const pickFields = (source: Record<string, any>, allowedFields: string[]):
Record<string, any> => {
  const result: Record<string, any> = {};
  for (const field of allowedFields) {
    if (source[field] !== undefined) {
      result[field] = source[field];
    }
  }
  return result;
};

export function validateNotEmptyObject(
  data: Record<string, any>,
  message = 'No valid fields provided'
): void {
  if (Object.keys(data).length === 0) {
    throw new ApiError('BAD_REQUEST', message);
  }
}

export function validateRequiredFields(
  source: Record<string, any>,
  requiredFields: string[]
): void {
  const missing = requiredFields.filter(field => source[field] === undefined);
  if (missing.length > 0) {
    throw new ApiError(
      'BAD_REQUEST',
      `Missing required fields: ${missing.join(', ')}`
    );
  }
}