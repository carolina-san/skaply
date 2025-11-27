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

  async createProvider(company_name: string, cif: string, tax_address: string, email: string, telephone: string) {
    try {
      const result = await pool.query(
        `INSERT INTO public."User" (company_name, cif, tax_adress, email, telephone)
          VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [company_name, cif, tax_address, email, telephone]
      );
      return result;
    } catch (error) {
      throw new Error('Unable to create provider');
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

  async getProviderByName(name:string){
    try{
        const result = await pool.query('SELECT * FROM public."User" WHERE role = $1 AND company_name ILIKE $2 ', [UserRole.PROV, `%${name}%`]);
        return result;
    }catch(error){
        throw new Error('Unable to fetch the provided with this name');
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
