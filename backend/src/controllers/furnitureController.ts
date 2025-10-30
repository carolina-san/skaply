import { Request, Response } from 'express';
import {FurnitureService} from '../services/furnitureService'
/*import { UserService } from '../services/UserService';*/

export class FurnitureController {
  private furnitureService: FurnitureService;

  constructor(furnitureService?: FurnitureService) {
    this.furnitureService = furnitureService || new FurnitureService();
  }

  getFurnitures = async (req: Request, res: Response): Promise<void> => {
    try {
      // Example database query
      const result = await this.furnitureService.getAllFurnitures()
      res.status(200).json({ 
        message: 'Database connected successfully',
        data: result.rows
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch furnitures' });
    }
  };

  getFurnitureById = async(req:Request, res:Response): Promise<void> =>{
    try{
        const id = parseInt(req.params.id || '0');
        if (isNaN(id)) {
            res.status(400).json({error: 'Invalid furniture ID'});
            return;
        }
        const result = await this.furnitureService.getFurniture(id);
        res.status(200).json({
            message: 'Furniture fetched',
            data: result.rows
        });
    }catch (error){
        res.status(500).json({error: 'Failed to fetch this furniture'})
    }
  }

  getFurnitureByCategory = async(req:Request,res:Response): Promise<void> =>{
    try{
      const cat = parseInt(req.params.cat || '0');
      if (isNaN(cat)) {
          res.status(400).json({error: 'Invalid furniture category'});
          return;
      }
      const result = await this.furnitureService.getFurnitureByCategory(cat);
      res.status(200).json({
        data: result.rows
      })
    }catch(error){
      res.status(500).json({error: 'Failed to fetch furnitures in this category'})
    }
  }

  getFurnitureByReference =  async(req:Request,res:Response): Promise <void> =>{
    try{
      const ref = req.params.ref || '';
      const result = await this.furnitureService.getFurnitureByReference(ref)
      res.status(200).json(
        {
          data: result.rows
        }
      )
    }catch(error){
      res.status(500).json({error: 'Unkwown reference number'});
    }
  }

  getFurnitureByProvider =  async(req:Request,res:Response): Promise <void> =>{
    try{
      const prov = parseInt(req.params.prov || '0');
      const result = await this.furnitureService.getFurnitureByProvider(prov)
      res.status(200).json(
        {
          data: result.rows
        }
      )
    }catch(error){
      res.status(500).json({error: 'Failed to fetch furnitures from this provider'});
    }
  }

  getFurnitureWithParts = async(req:Request,res:Response): Promise <void> =>{
    try{
      const id = parseInt(req.params.id || '0');
      if(isNaN(id)) {
          res.status(400).json({error: 'Invalid furniture category'});
          return;
      }
      const parts = await this.furnitureService.getFurnitureWithParts(id);
 
      res.status(200).json({
        data: parts.rows
      });
    }catch(error){
      res.status(500).json({error: 'Unable to fetch the parts of the furniture'})
    }
  }
 
}
