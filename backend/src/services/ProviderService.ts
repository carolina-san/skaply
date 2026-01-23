import pool from '@config/database';
import { UserRole } from '../types/user.types';
import { ApiError } from '@/utils/ApiError';

export class ProviderService {

  // PUBLIC ROUTES

  async getActiveProviders() {
    try {
      const result = await pool.query(
        `
        SELECT id, email, name, company_name, telephone, image_url
        FROM "User"
        WHERE role = $1 AND active = $2 AND new_user = $3
        ORDER BY company_name
        `,
        [UserRole.PROV, true, false] 
      );
      return result;
    } catch (error) {
      console.error('Error fetching active providers:', error);
      throw new Error('Unable to fetch active providers');
    }
  }
  
  async getActiveProvider(id: number) {
    try {
      const result = await pool.query(`
        SELECT id, email, name, company_name, telephone, image_url 
        FROM public."User" 
        WHERE role = $1 AND id = $2 AND active = $3 AND new_user = $4`, 
        [UserRole.PROV, id, true, false]);
      return result;
    } catch (error) {
      throw new Error('Unable to fetch the active provider with this id');
    }
  }

  // PRIVATE ROUTES
  
  async getProviders() {
    try {
      const result = await pool.query(
        `SELECT id, email, name, cif, company_name, telephone, tax_address, image_url, active, new_user, fecha_alta 
         FROM public."User" 
         WHERE role = $1
         ORDER BY company_name`,
        [UserRole.PROV]
      );
      return result;
    } catch (error) {
      throw new Error('Unable to fetch providers');
    }
  }

  async getProviderById(id: number) {
    try {
      const result = await pool.query(
        `
        SELECT id, email, name, cif, company_name, telephone, tax_address, image_url, active, new_user, fecha_alta
        FROM "User"
        WHERE role = $1 AND id = $2
        `,
        [UserRole.PROV, id]
      );
      return result;
    } catch (error) {
      throw new Error('Unable to fetch provider by id');
    }
  }

  async deleteProvider(id: number) {
    try {
      const result = await pool.query(
        'DELETE FROM public."User" WHERE id = $1 AND role = $2 RETURNING *',
        [id, UserRole.PROV]
      );
      return result;
    } catch (error) {
      throw new Error('Unable to delete provider');
    }
  }

  // CHATBOT (PUBLIC)

  async getAllProvidersChatbot() { // ¿por qué no se usa getActiveProviders()?
    try {
      const result = await pool.query(`SELECT id, company_name, email, cif, tax_address, name,image_url
                                      FROM public."User" where role = 'provider'`);
      return result;
    } catch (error) {
      throw new Error('Unable to fetch providers for chatbot')
    }
  }

  async getProviderByName(name: string) { // ¿añadir restricción active = true y new_user = false?
    try {
      const result = await pool.query('SELECT * FROM public."User" WHERE role = $1 AND company_name ILIKE $2 ', [UserRole.PROV, `%${name}%`]);
      return result;
    } catch (error) {
      throw new Error('Unable to fetch the provided with this name');
    }
  }
  
  // OTHER ROUTES
  // chequear active y new_user?
  
  async checkProviderRoleById(providerId: number): Promise<boolean> {
    const result = await pool.query(
      `SELECT role FROM "User" WHERE id = $1`,
      [providerId]
    );

    if (result.rows.length === 0) {
      return false; // no existe el usuario
    }

    return result.rows[0].role === 'provider';
  }

  async getProviderIdByEmail(email: string): Promise<number | null> {
    try {
      const result = await pool.query(
        `SELECT id FROM "User" WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) return null;
      return result.rows[0].id;
    } catch (error) {
      throw new Error('Error fetching user ID by email');
    }
  }

  async getProviderIdByFurnitureId(furnitureId: number): Promise<number | null> {
    const result = await pool.query(
      `SELECT provider_id FROM furniture WHERE id = $1`,
      [furnitureId]
    );
    if (result.rows.length === 0) return null;
    return result.rows[0].provider_id;
  }
}
