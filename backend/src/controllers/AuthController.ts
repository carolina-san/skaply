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
    const { email, password, company_name, cif,tax_address,telephone } = req.body;
    try {
     
      const check = await this.authService.checkUser(email)
      if(check){
        const hashedPass = await bcrypt.hash(password,10);

        const reqUser: RegisterUser = {
          email: email,
          password: hashedPass,
          company_name: company_name,
          cif: cif,
          tax_address: tax_address,
          telephone: telephone
        };

        try{
          const result =  await this.authService.register(reqUser);
        }catch(error){
          throw new Error('Error registering the new provider');
        }
        
      }
      res.status(201).json({ message: 'Register endpoint' });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed' });
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
