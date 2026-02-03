import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/authService';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from 'passport';
import { RegisterUser, RegistrationStatus, UserRole } from '@/types';
import { ApiError } from '@/utils/ApiError';
import { validateCorrectPassword, validateEmail, validateProviderData } from '@/utils/auth.utils';
import { validateRequiredFields } from '@/utils/common.utils';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;
    try {

      // validate
      validateEmail(email);
      const user = await this.authService.getUserByEmail(email);
      if (!user) { throw new ApiError("NOT_FOUND", "User not found"); }
      if (!user.enabled) { throw new ApiError("FORBIDDEN", "Account is not enabled"); }

      // Check password
      await validateCorrectPassword(password, user.password);

      // Token JWT
      const token = jwt.sign(
        {
          id: user.id,
          emailuser: email,
          role: user.role
        },
        process.env.JWT_SECRET_KEY as string,
        { expiresIn: '24h' });

      // Cookie HttpOnly
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // https production
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 h
      });

      // Response
      res.status(200).json({ message: 'Login successful', data: { email } });

      // Error
    } catch (error) {
      if (error instanceof ApiError) next(error);
      else next(new ApiError('INTERNAL_SERVER', 'Error during login process'));
    }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // required fields
      const requiredFields = [
        'email',
        'password',
        'company_name',
        'cif',
        'tax_address',
        'telephone'
      ];

      // validate fields
      validateRequiredFields(req.body, requiredFields);
      validateProviderData(req.body);

      // check user exists
      const exists = await this.authService.userExistsByEmail(req.body.email);
      if (exists) {
        next(new ApiError('CONFLICT', 'User already exists with this email'));
        return;
      }

      // hash password
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      // prepare data
      const { email, company_name, cif, tax_address, telephone } = req.body;
      const userData = {
        email,
        company_name,
        cif,
        tax_address,
        telephone,
        password: hashedPassword
      };

      // register
      const user = await this.authService.registerProvider(userData);

      // response
      res.status(201).json({
        message: 'Provider registered successfully',
        user
      });

      // error
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof ApiError) { return next(error); }
      next(new ApiError('INTERNAL_SERVER', 'Failed to register provider'));
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      res.clearCookie('token');
      res.status(200).json({ message: 'Logout successful' });
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
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
      session: false
    }),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const user = req.user as any;

        if (!user) {
          res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user_data`);
          return;
        }

        // Generate JWT token (same format as traditional login)
        const token = jwt.sign({
          id: user.id,
          emailuser: user.email,
          role: user.role || 'provider'
        }, process.env.JWT_SECRET_KEY as string, { expiresIn: '24h' });

        // Set HttpOnly cookie
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Redirect to frontend without token in URL
        const frontendUrl = process.env.FRONTEND_URL;
        res.redirect(`${frontendUrl}/catalogo`); // Redirige al catálogo después del login OAuth
      } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=callback_failed`);
      }
    }
  ];

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError('UNAUTHORIZED', 'User not authenticated');
      }

      const user = await this.authService.getUserById(req.user.id);

      if (!user) {
        throw new ApiError('NOT_FOUND', 'User not found');
      }

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  };

}
