import pool from '@config/database';
import { RegisterUser } from '@/types';
export class AuthService {

  async checkUser(email:string){
    try{  
      const result = await pool.query(`Select email from "User" 
        where email = $1'  `,[email]);
      return result;
    }catch(error){
      throw new Error('User does not exists');
    }
  }

  async login(email: string, password: string) {
    // Authentication logic here
    throw new Error('Method not implemented');
  }

  async register(reqUser: RegisterUser) {
    try{
      const date = Date.now().toString()
      const result = await pool.query(`INSERT INTO "User" 
        (email,cif, company_name, telephone, tax_address, role, fecha_alta, password) 
        VALUES ($1,$2,$3,$4,$5,'provider',$6,$7)`,[reqUser.email,reqUser.cif,reqUser.company_name,
          reqUser.telephone,reqUser.tax_address,date,reqUser.password]);
        return result;
    }catch(error){
      throw new Error('Method not implemented');
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
