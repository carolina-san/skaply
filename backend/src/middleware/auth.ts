import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';

// Extender la interfaz Request para incluir la información del usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        emailuser: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError('UNAUTHORIZED', 'Access denied. No token provided.');
    }

    // Verificar el JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as {
      emailuser: string;
      role: string;
    };

    // Agregar la información del usuario al request
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError('UNAUTHORIZED', 'Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError('UNAUTHORIZED', 'Token expired'));
    } else {
      next(new ApiError('UNAUTHORIZED', 'Token verification failed'));
    }
  }
};

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError('UNAUTHORIZED', 'Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError('FORBIDDEN', 'Insufficient permissions'));
    }

    next();
  };
};
