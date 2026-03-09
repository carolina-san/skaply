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

  async getProviders(filters?: {
    registration_status?: RegistrationStatus;
    enabled?: boolean;
    visible?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    try {
      const conditions: string[] = ['role = $1'];
      const values: any[] = [UserRole.PROV];
      let paramIndex = 2;

      if (filters?.search) {
        const search = `%${filters.search}%`;
        conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR company_name ILIKE $${paramIndex} OR telephone ILIKE $${paramIndex} OR tax_address ILIKE $${paramIndex} OR cif ILIKE $${paramIndex})`);
        values.push(search);
        paramIndex++;
      }

      if (filters?.registration_status !== undefined) {
        conditions.push(`registration_status = $${paramIndex++}`);
        values.push(filters.registration_status);
      }

      if (filters?.enabled !== undefined) {
        conditions.push(`enabled = $${paramIndex++}`);
        values.push(filters.enabled);
      }

      if (filters?.visible !== undefined) {
        conditions.push(`visible = $${paramIndex++}`);
        values.push(filters.visible);
      }

      const whereClause = conditions.join(' AND ');

      // Pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const offset = (page - 1) * limit;

      // Count total
      const countQuery = `SELECT COUNT(*) FROM public."User" WHERE ${whereClause}`;
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count, 10);

      const query = `
        SELECT id, email, name, cif, company_name, telephone, tax_address,
              image_url, enabled, visible, registration_status,
              created_at, updated_at, approved_at, disabled_at, enabled_at
        FROM public."User"
        WHERE ${whereClause}
        ORDER BY company_name
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      values.push(limit, offset);

      const result = await pool.query(query, values);

      return {
        rows: result.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

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

  async updateProviderEnabled(id: number, enabled: boolean) {
    try {
      if (!enabled) {
        await this.updateProviderVisibility(id, false);
      }
      const result = await pool.query(
        `
        UPDATE "User"
        SET enabled = $1, enabled_at = CURRENT_TIMESTAMP
        WHERE id = $2
          AND role = $3
          AND registration_status = $4
        RETURNING id, company_name, enabled
        `,
        [enabled, id, UserRole.PROV, RegistrationStatus.APPROVED]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error enabling provider:', error);
      throw new Error('Unable to enable provider');
    }
  }

  async updateProviderVisibility(providerId: number, visible: boolean) {
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
        SET registration_status = $1, approved_at = CURRENT_TIMESTAMP
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
    try {

      // Handle enabled changes with timestamps
      if ('enabled' in data) {
        if (data.enabled === true || data.enabled === 'true') {
          data.enabled_at = 'CURRENT_TIMESTAMP';
        } else if (data.enabled === false || data.enabled === 'false') {
          data.disabled_at = 'CURRENT_TIMESTAMP';
        }
      }

      const fields = Object.keys(data);
      const values = Object.values(data);

      const setClause = fields
        .map((field, index) => {
          // Handle timestamp fields specially
          if (data[field] === 'CURRENT_TIMESTAMP') {
            return `"${field}" = CURRENT_TIMESTAMP`;
          }
          return `"${field}" = $${index + 1}`;
        })
        .join(', ');

      // Filter out CURRENT_TIMESTAMP from values array
      const filteredValues = values.filter(v => v !== 'CURRENT_TIMESTAMP');

      const query = `
        UPDATE "User"
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${filteredValues.length + 1}
          AND role = $${filteredValues.length + 2}
        RETURNING id, email, company_name, cif, telephone, tax_address, visible, enabled, registration_status
      `;
      console.log(setClause);
      const result = await pool.query(query, [...filteredValues, providerId, UserRole.PROV]);
      return result.rows[0];
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error updating provider:', error);
      throw new Error('Unable to update provider');
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

  async getProviderByName(name: string) {
    try {
      const result = await pool.query('SELECT * FROM public."User" WHERE role = $1 AND company_name ILIKE $2 AND visible = true', [UserRole.PROV, `%${name}%`]);
      return result.rows;
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

  async getProviderPassword(providerId: number) {
    try {
      const result = await pool.query(
        `SELECT password FROM "User" WHERE id = $1 AND role = $2`,
        [providerId, UserRole.PROV]
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0].password;
    } catch (error) {
      throw new Error('Unable to get provider´s password by id');
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
