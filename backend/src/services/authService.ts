import pool from '@config/database';
import { LoginRequest, RegisterUser } from '@/types';
import { UserRole } from '../types/user.types';
import { RegistrationStatus } from '@/types/user.types';
import { use } from 'passport';

export class AuthService {

  async getUserByEmail(email: string) {
    const result = await pool.query(
      `SELECT id, email, company_name, password, role, enabled, registration_status, visible 
      FROM "User" 
      WHERE email = $1`,
      [email]
    );
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  async getUserById(id: number) {
    const result = await pool.query(
      `SELECT id, email, company_name, role, enabled, registration_status, visible 
      FROM "User" 
      WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  async userExistsByEmail(email: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT 1 FROM "User" WHERE email = $1 LIMIT 1`,
      [email]
    );
    return result.rows.length > 0;
  }

  async registerProvider(reqUser: RegisterUser) {
    try {
      const date = new Date();
      //const date = new Date().toISOString();
      const result = await pool.query(
        `INSERT INTO "User"
        (
          email,
          cif,
          company_name,
          telephone,
          tax_address,
          role,
          password,
          registration_status,
          enabled,
          visible,
          created_at,
          updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING id, email, company_name`,
        [
          reqUser.email,
          reqUser.cif,
          reqUser.company_name,
          reqUser.telephone,
          reqUser.tax_address,
          UserRole.PROV,
          reqUser.password,
          RegistrationStatus.PENDING,
          false,
          false,
          date,
          date
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error registering provider:', error);
      throw new Error('Error creating provider in database');
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

  async updateGoogleId(email: string, googleId: string) {
    try {
      const result = await pool.query(`UPDATE "User" SET google_id = $1 WHERE email = $2`, [googleId, email]);
      return result;
    } catch (error) {
      console.error('Error updating Google ID:', error);
      throw new Error('Error updating Google ID');
    }
  }

  // crea un usuario sin password al hacer OAuth con user nuevo??
  async registerGoogleUser(reqUser: RegisterUser & { googleId: string }) {
    try {
      const date = new Date().toISOString();
      const result = await pool.query(`INSERT INTO "User" 
        (email, cif, company_name, telephone, tax_address, role, created_at, password, google_id, registration_status) 
        VALUES ($1, $2, $3, $4, $5, 'provider', $6, $7, $8, $9) RETURNING id`,
        [reqUser.email, reqUser.cif, reqUser.company_name,
        reqUser.telephone, reqUser.tax_address, date, reqUser.password, reqUser.googleId, RegistrationStatus.PENDING]);
      return { id: result.rows[0].id };
    } catch (error) {
      console.error('Error registering Google user:', error);
      throw new Error('Error creating Google user in database');
    }
  }

  async getUserByGoogleId(googleId: string) {
    try {
      const result = await pool.query(`SELECT * FROM "User" WHERE google_id = $1`, [googleId]);
      return result;
    } catch (error) {
      console.error('Error getting user by Google ID:', error);
      throw new Error('Error finding user by Google ID');
    }
  }

}