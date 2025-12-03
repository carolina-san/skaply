import { Request, Response } from 'express';
import { AuthService } from '@/services/authService';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RegisterUser } from '@/types';
export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      // Implementation here
      res.status(200).json({ message: 'Login endpoint' });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  };

  register = async (req: Request, res: Response): Promise<void> => {
    const { email, password, company_name, cif, tax_address, telephone } = req.body;
    
    try {
      // Validar que todos los campos requeridos estén presentes
      if (!email || !password || !company_name || !cif || !tax_address || !telephone) {
        res.status(400).json({ error: 'All fields are required' });
        return;
      }

      // Verificar si el usuario ya existe
      const canRegister = await this.authService.checkUser(email);
      if (!canRegister) {
        res.status(409).json({ error: 'User already exists with this email' });
        return;
      }

      // Hash de la contraseña
      const hashedPass = await bcrypt.hash(password, 10);

      const reqUser: RegisterUser = {
        email,
        password: hashedPass,
        company_name,
        cif,
        tax_address,
        telephone
      };

      // Registrar usuario
      const result = await this.authService.register(reqUser);
      
      res.status(201).json({ 
        message: 'User registered successfully',
        user: {
          email: reqUser.email,
          company_name: reqUser.company_name,
          cif: reqUser.cif
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        error: 'Registration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      // Implementation here
      res.status(200).json({ message: 'Logout endpoint' });
    } catch (error) {
      res.status(500).json({ error: 'Logout failed' });
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      // Implementation here
      res.status(200).json({ message: 'Refresh token endpoint' });
    } catch (error) {
      res.status(500).json({ error: 'Token refresh failed' });
    }
  };
}
