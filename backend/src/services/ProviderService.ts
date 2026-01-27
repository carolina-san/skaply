import pool from '@config/database';
import { UserRole } from '../types/user.types';
import { UserStatus } from '@/types/user.types';
import { ApiError } from '@/utils/ApiError';
import { NextFunction } from 'express';

export class ProviderService {

  // PUBLIC ROUTES

  async getActiveProviders() {
    try {
      const result = await pool.query(
        `
        SELECT id, email, name, company_name, telephone, image_url
        FROM "User"
        WHERE role = $1 AND active = $2 AND status = $3
        ORDER BY company_name
        `,
        [UserRole.PROV, true, UserStatus.APPROVED] 
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
        WHERE role = $1 AND id = $2 AND active = $3 AND status = $4`, 
        [UserRole.PROV, id, true, UserStatus.APPROVED]);
      return result;
    } catch (error) {
      throw new Error('Unable to fetch the active provider with this id');
    }
  }

  // PRIVATE ROUTES (ADMIN ONLY)
  
  async getProviders() {
    try {
      const result = await pool.query(
        `SELECT id, email, name, cif, company_name, telephone, tax_address, image_url, active, status, fecha_alta 
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
        SELECT id, email, name, cif, company_name, telephone, tax_address, image_url, active, status, fecha_alta
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

  async enableProvider(id: number) {
    try {
      const result = await pool.query(
        `
        UPDATE "User"
        SET active = true
        WHERE id = $1
          AND role = $2
          AND active = $3
        RETURNING id, company_name, active
        `,
        [id, UserRole.PROV, false]
      );
      return result;
    } catch (error) {
      console.error('Error enabling provider:', error);
      throw new Error('Unable to enable provider');
    }
  }

  async disableProvider(id: number) {
    try {
      const result = await pool.query(
        `
        UPDATE "User"
        SET active = false
        WHERE id = $1
          AND role = $2
          AND active = $3
        RETURNING id, company_name, active
        `,
        [id, UserRole.PROV, true]
      );
      return result;
    } catch (error) {
      throw new Error('Unable to disable provider');
    }
  }

  async approveProvider(providerId: number) { 
    try {
      const result = await pool.query(
        `
        UPDATE "User"
        SET active = $1,
            status = $2
        WHERE id = $3
          AND role = $4
          AND status != $2
        RETURNING id, email, company_name, active, status
        `,
        [true, UserStatus.APPROVED, providerId, UserRole.PROV]
      );
      return result;
    } catch (error) {
      throw new Error('Unable to approve provider');
    }
  }

  async rejectProvider(providerId: number) {
    try {
      const result = await pool.query(
        `
        UPDATE "User"
        SET active = $1,
            status = $2
        WHERE id = $3
          AND role = $4
          AND status != $2
        RETURNING id, email, company_name, active, status
        `,
        [false, UserStatus.REJECTED, providerId, UserRole.PROV]
      );
      return result;
    } catch (error) {
      console.error('Error rejecting provider:', error);
      throw new Error('Unable to reject provider');
    }
  }

  async updateProvider(providerId: number, data: Record<string, any>) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields
      .map((field, index) => `"${field}" = $${index + 1}`)
      .join(', ');
    const query = `
      UPDATE "User"
      SET ${setClause}
      WHERE id = $${fields.length + 1}
        AND role = $${fields.length + 2}
        AND active = $${fields.length + 3}
      RETURNING id, email, company_name, cif, telephone, tax_address
    `;
    return pool.query(query, [...values, providerId, UserRole.PROV, true]);
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

  async getProviderByName(name: string) { // ¿añadir restricción active = true y status = pending?
    try {
      const result = await pool.query('SELECT * FROM public."User" WHERE role = $1 AND company_name ILIKE $2 ', [UserRole.PROV, `%${name}%`]);
      return result;
    } catch (error) {
      throw new Error('Unable to fetch the provided with this name');
    }
  }
  
  // OTHER ROUTES
  // ¿es necesario chequear active y status?
  
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
        `SELECT id FROM "User" WHERE email = $1 AND role = $2`,
        [email, UserRole.PROV]
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
