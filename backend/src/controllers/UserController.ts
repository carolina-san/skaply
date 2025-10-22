import { Request, Response } from 'express';
import pool from '@config/database';
/*import { UserService } from '../services/UserService';*/

export class UserController {

  getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      // Example database query
      const result = await pool.query('SELECT NOW() as current_time');
      res.status(200).json({ 
        message: 'Database connected successfully',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      // Implementation here
      res.status(200).json({ message: `Get user ${id} endpoint` });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      // Implementation here
      res.status(200).json({ message: `Update user ${id} endpoint` });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      // Implementation here
      res.status(200).json({ message: `Delete user ${id} endpoint` });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  };
}
