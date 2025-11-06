import pool from '@config/database';
import { UserRole } from '../types/user.types';

export class ProviderService {
  
  async getAllProviders() {
    try{
        const result = await pool.query('SELECT * FROM public."User" WHERE role = $1', [UserRole.PROV]);
        return result;
    }catch(error){
        throw new Error('Method not implemented');
    }
    
  }

  async getProvider(id:number){
    try{
        const result = await pool.query('SELECT * FROM public."User" WHERE role = $1 AND id = $2 ', [UserRole.PROV, id]);
        return result;
    }catch(error){
        throw new Error('Unable to fetch the provided with this id');
    }
  }

  async getAllProvidersChatbot(){
    try{
      const result = await pool.query(`SELECT id, company_name, email, cif, tax_address, name,image_url
                                      FROM public."User" where role = 'provider'`);
      return result;                                
    }catch(error){
      throw new Error('Unable to fetch providers for chatbot')
    }
  }

  // async updateProvider(id: string, userData: any) {
  //   // Update user logic here
  //   throw new Error('Method not implemented');
  // }

  // async deleteProvider(id: string) {
  //   // Delete user logic here
  //   throw new Error('Method not implemented');
  // }
}
