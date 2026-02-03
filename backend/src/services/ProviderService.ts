import pool from '@config/database';
import { UserRole } from '../types/user.types';
import { RegistrationStatus } from '@/types/user.types';
import { ApiError } from '@/utils/ApiError';
import { NextFunction } from 'express';

export class ProviderService {

  // PUBLIC ROUTES

  async getVisibleProviders() {
    try {
      const result = await pool.query(
        `
        SELECT id, email, name, company_name, telephone, image_url
        FROM public."User"
        WHERE role = $1 AND visible = $2
        ORDER BY company_name
        `,
        [UserRole.PROV, true] 
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching enabled providers:', error);
      throw new Error('Unable to fetch enabled providers');
    }
  }

  async getVisibleProviderById(id: number) {
    try {
      const result = await pool.query(`
        SELECT id, email, name, company_name, telephone, image_url 
        FROM public."User" 
        WHERE role = $1 AND id = $2 AND visible = $3`, 
        [UserRole.PROV, id, true]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error('Unable to fetch the enabled provider with this id');
    }
  }

  // PRIVATE ROUTES (ADMIN ONLY)
  
  async getProviders() {
    try {
      const result = await pool.query(
        `SELECT id, email, name, cif, company_name, telephone, tax_address, image_url, enabled, visible, registration_status, created_at, updated_at, approved_at, disabled_at, enabled_at
         FROM public."User" 
         WHERE role = $1
         ORDER BY company_name`,
        [UserRole.PROV]
      );
      return result.rows;
    } catch (error) {
      throw new Error('Unable to fetch providers');
    }
  }

  async getProviderById(id: number) {
    try {
      const result = await pool.query(
        `
        SELECT id, email, name, cif, company_name, telephone, tax_address, image_url, enabled, visible, registration_status, created_at, updated_at, approved_at, disabled_at, enabled_at
        FROM "User"
        WHERE role = $1 AND id = $2
        `,
        [UserRole.PROV, id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error('Unable to fetch provider by id');
    }
  }

  async enableProvider(id: number) {
    try {
      const result = await pool.query(
        `
        UPDATE "User"
        SET enabled = $1
        WHERE id = $2
          AND role = $3
          AND registration_status = $4
        RETURNING id, company_name, enabled
        `,
        [true, id, UserRole.PROV, RegistrationStatus.APPROVED]
      );
      return result.rows[0] || null;
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
        SET enabled = false
        WHERE id = $1
          AND role = $2
        RETURNING id, company_name, enabled
        `,
        [id, UserRole.PROV]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error('Unable to disable provider');
    }
  }

  async setProviderVisible(providerId: number, visible: boolean) {
    try {
      const result = await pool.query(
        `
        UPDATE "User"
        SET visible = $1
        WHERE id = $2
          AND role = $3
        RETURNING id, company_name, visible
        `,
        [visible, providerId, UserRole.PROV]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating provider visibility:', error);
      throw new Error('Unable to update provider visibility');
    }
  }

  async approveRegistration(providerId: number) { 
    try {
      const result = await pool.query(
        `
        UPDATE "User"
        SET registration_status = $1
        WHERE id = $2
          AND role = $3
          AND registration_status != $4
        RETURNING id, email, company_name, enabled, registration_status
        `,
        [RegistrationStatus.APPROVED, providerId, UserRole.PROV, RegistrationStatus.REJECTED]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error('Unable to approve provider');
    }
  }
  
  async rejectRegistration(providerId: number) {
    try {
      const result = await pool.query(
        `
        UPDATE "User"
        SET registration_status = $1
        WHERE id = $2
          AND role = $3
          AND registration_status != $4
        RETURNING id, email, company_name, enabled, registration_status
        `,
        [RegistrationStatus.REJECTED, providerId, UserRole.PROV, RegistrationStatus.APPROVED]
      );
      return result.rows[0] || null;
    } catch (error) {
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
      RETURNING id, email, company_name, cif, telephone, tax_address
    `;
    return (await pool.query(query, [...values, providerId, UserRole.PROV])).rows[0];
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

  // CHATBOT (PUBLIC) (revisar enabled/visible etc)

  async getAllProvidersChatbot() { // ¿por qué no se usa getActiveProviders()?
    try {
      const result = await pool.query(`
        SELECT id, company_name, email, cif, tax_address, name,image_url
        FROM public."User" where role = 'provider'`);
      return result;
    } catch (error) {
      throw new Error('Unable to fetch providers for chatbot')
    }
  }

  async getProviderByName(name: string) {
    try {
      const result = await pool.query('SELECT * FROM public."User" WHERE role = $1 AND company_name ILIKE $2 ', [UserRole.PROV, `%${name}%`]);
      return result;
    } catch (error) {
      throw new Error('Unable to fetch the provided with this name');
    }
  }
  
  // OTHER ROUTES (revisar)
  
  // solo se usa en furntireController (eliminar eventualmente)
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

  // que sustituya a checkProviderRoleById
  async checkProviderById(providerId: number) {
    try {
      const result = await pool.query(
        `SELECT role, registration_status, enabled, visible FROM "User" WHERE id = $1`,
        [providerId]
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      throw new Error('Unable to check provider by id');
    }
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
