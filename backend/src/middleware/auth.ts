import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
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
      res.status(401).json({ error: 'Invalid token.' });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired.' });
    } else {
      res.status(401).json({ error: 'Token verification failed.' });
    }
  }
};
