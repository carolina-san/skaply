import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { ERROR_CODES } from '../constants/errorCodes';

export const errorHandler = (
  error: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(error.stack);

  let statusCode: number = ERROR_CODES.INTERNAL_SERVER.statusCode;
  let message: string = ERROR_CODES.INTERNAL_SERVER.message;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
  } else {
    // Si el error no es operacional (ApiError), verificamos si ya había un status code seteado
    if (res.statusCode && res.statusCode !== 200) {
      statusCode = res.statusCode;
      message = error.message;
    }
  }

  res.status(statusCode).json({
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};
