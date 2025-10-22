import { Request, Response } from 'express';
import pool from '@config/database';
import {FurnitureService} from '../services/furnitureService'
/*import { UserService } from '../services/UserService';*/

export class FurnitureController {
  Furnitures = async (req: Request, res: Response): Promise<void> => {
    try {
      // Example database query
      const result = await new FurnitureService().getAllFurnitures()
      res.status(200).json({ 
        message: 'Database connected successfully',
        data: result.rows
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  };

 
}
