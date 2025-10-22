import pool from '@config/database';
export class FurnitureService {
  async getAllFurnitures() {
    try{
        const result = await pool.query('SELECT * FROM public.mueble');
        return result
    }catch(error){
        throw new Error('Method not implemented');
    }
    
  }

  async getUserById(id: string) {
    // Get user by ID logic here
    throw new Error('Method not implemented');
  }

  async updateUser(id: string, userData: any) {
    // Update user logic here
    throw new Error('Method not implemented');
  }

  async deleteUser(id: string) {
    // Delete user logic here
    throw new Error('Method not implemented');
  }
}
