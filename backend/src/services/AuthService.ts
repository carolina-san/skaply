import pool from '@config/database';
import { RegisterUser } from '@/types';
export class AuthService {

  async checkUser(email:string){
    try{  
      const result = await pool.query(`SELECT email FROM "User" 
        WHERE email = $1`,[email]);
      // Return true if user does NOT exist (can register)
      return result.rows.length === 0;
    }catch(error){
      console.error('Error checking user:', error);
      throw new Error('Error checking if user exists');
    }
  }

  async login(email: string, password: string) {
    // Authentication logic here
    throw new Error('Method not implemented');
  }

  async register(reqUser: RegisterUser) {
    try{
      const date = new Date().toISOString();
      const result = await pool.query(`INSERT INTO "User" 
        (email, cif, company_name, telephone, tax_address, role, fecha_alta, password) 
        VALUES ($1, $2, $3, $4, $5, 'provider', $6, $7)`,
        [reqUser.email, reqUser.cif, reqUser.company_name,
         reqUser.telephone, reqUser.tax_address, date, reqUser.password]);
      return result;
    }catch(error){
      console.error('Error registering user:', error);
      throw new Error('Error creating user in database');
    }
  }

  async logout(token: string) {
    // Logout logic here
    throw new Error('Method not implemented');
  }

  async refreshToken(refreshToken: string) {
    // Token refresh logic here
    throw new Error('Method not implemented');
  }
}
