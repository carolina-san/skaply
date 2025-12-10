import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/AuthService';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from 'passport';
import { RegisterUser } from '@/types';

import { ApiError } from '@/utils/ApiError';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;
    try {
      const comparePass = await this.authService.checkPassword(email);
      if (comparePass.rows.length === 0) {
        throw new ApiError('NOT_FOUND', 'User not found');
      }
      // Verificar si la contraseña ya está hasheada o es texto plano (para desarrollo)
      let validPass = false;

      if (comparePass.rows[0].password.startsWith('$2b$')) {
        // Contraseña hasheada con bcrypt
        validPass = await bcrypt.compare(password, comparePass.rows[0].password);
      } else {
        // Contraseña en texto plano (solo para desarrollo) 
        validPass = password === comparePass.rows[0].password;
      }

      if (!validPass) {
        throw new ApiError('UNAUTHORIZED', 'Invalid password');
      }

      // Generar token JWT
      const token = jwt.sign({ emailuser: email, role: 'provider' }, process.env.JWT_SECRET_KEY as string, { expiresIn: '24h' });
      res.status(200).json({ message: 'Login successful', data: { email, token } });
    } catch (error) {
      if (error instanceof ApiError) next(error);
      else next(new ApiError('INTERNAL_SERVER', 'Error during login process'));
    }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password, company_name, cif, tax_address, telephone } = req.body;

    try {
      // Validar que todos los campos requeridos estén presentes
      if (!email || !password || !company_name || !cif || !tax_address || !telephone) {
        next(new ApiError('BAD_REQUEST', 'All fields are required'));
        return;
      }

      // Validar formato de Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        next(new ApiError('BAD_REQUEST', 'Invalid email format'));
        return;
      }

      // Validar formato de CIF: Letra inicial + 7 dígitos + (Letra o Dígito)
      // Cubre: "Letra + 8 dígitos" (control es dígito) y "Letra + 7 dígitos + Letra" (control es letra)
      const cifRegex = /^[a-zA-Z]\d{7}[0-9a-zA-Z]$/;
      if (!cifRegex.test(cif)) {
        next(new ApiError('BAD_REQUEST', 'Invalid CIF format. Must be Letter + 7 digits + Control Character'));
        return;
      }

      // Validar longitud de contraseña (mínimo 12 caracteres)
      if (password.length < 12) {
        next(new ApiError('BAD_REQUEST', 'Password must be at least 12 characters long'));
        return;
      }

      // Validar teléfono (formato básico internacional o local, mínimo 9 dígitos)
      const phoneRegex = /^\+?[0-9]{9,15}$/;
      if (!phoneRegex.test(telephone)) {
        next(new ApiError('BAD_REQUEST', 'Invalid telephone format'));
        return;
      }

      // Verificar si el usuario ya existe
      const canRegister = await this.authService.checkUser(email);
      if (!canRegister) {
        next(new ApiError('CONFLICT', 'User already exists with this email'));
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
      next(new ApiError('INTERNAL_SERVER', 'Registration failed'));
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

  // Google OAuth methods
  googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email']
  });

  googleCallback = [
    passport.authenticate('google', {
      failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/login?error=google_auth_failed`,
      session: false
    }),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const user = req.user as any;

        if (!user) {
          res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:4200'}/login?error=no_user_data`);
          return;
        }

        // Generate JWT token (same format as traditional login)
        const token = jwt.sign({
          emailuser: user.email,
          role: 'provider'
        }, process.env.JWT_SECRET_KEY as string, { expiresIn: '24h' });

        // Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
        res.redirect(`${frontendUrl}/login/success?token=${token}&email=${encodeURIComponent(user.email)}`);

      } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:4200'}/login?error=callback_failed`);
      }
    }
  ];
}
