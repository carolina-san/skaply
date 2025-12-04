import pool from '@config/database';
import { LoginRequest, RegisterUser } from '@/types';
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

  async checkPassword(email:string){
    try{  
      const result = await pool.query(`SELECT password FROM "User"
        WHERE email = $1`,[email]);
      return result;
    }catch(error){
      throw new Error('Error checking user password');
    }
  }

  async login(reqUser: LoginRequest) {
    try{
      const passwordData = await this.checkPassword(reqUser.email);
    }catch(error){
      throw new Error('Error during login process');
    }
  }

  async register(reqUser: RegisterUser) {
    try{
      const date = new Date().toISOString();
      const result = await pool.query(`INSERT INTO "User" 
        (email, cif, company_name, telephone, tax_address, role, fecha_alta, password, new_user) 
        VALUES ($1, $2, $3, $4, $5, 'provider', $6, $7, $8)`,
        [reqUser.email, reqUser.cif, reqUser.company_name,
         reqUser.telephone, reqUser.tax_address, date, reqUser.password, true]);
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

  async updateGoogleId(email: string, googleId: string) {
    try {
      const result = await pool.query(`UPDATE "User" SET google_id = $1 WHERE email = $2`, [googleId, email]);
      return result;
    } catch (error) {
      console.error('Error updating Google ID:', error);
      throw new Error('Error updating Google ID');
    }
  }

  async registerGoogleUser(reqUser: RegisterUser & { googleId: string }) {
    try {
      const date = new Date().toISOString();
      const result = await pool.query(`INSERT INTO "User" 
        (email, cif, company_name, telephone, tax_address, role, fecha_alta, password, google_id, new_user) 
        VALUES ($1, $2, $3, $4, $5, 'provider', $6, $7, $8, $9) RETURNING id`,
        [reqUser.email, reqUser.cif, reqUser.company_name,
         reqUser.telephone, reqUser.tax_address, date, reqUser.password, reqUser.googleId, true]);
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
