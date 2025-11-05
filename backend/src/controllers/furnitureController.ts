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
      const result = await this.furnitureService.getAllFurniture();
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
        const result = await this.furnitureService.getFurnitureById(id);
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
      if (isNaN(prov)) {
          res.status(400).json({error: 'Invalid furniture provider'});
          return;
      }
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

    getFurnitureByProviderAndCategory =  async(req:Request,res:Response): Promise <void> =>{
      try{
        const prov = parseInt(req.params.prov || '0');
        if (isNaN(prov)) {
          res.status(400).json({error: 'Invalid furniture provider'});
          return;
        }
        const cat = parseInt(req.params.cat || '0');
        if (isNaN(cat)) {
          res.status(400).json({error: 'Invalid furniture category'});
          return;
        }
        const result = await this.furnitureService.getFurnitureByProviderAndCategory(prov, cat);
        res.status(200).json(
          {
            data: result.rows
          }
        )
      }catch(error){
        res.status(500).json({error: 'Failed to fetch furnitures from this provider with the category provided'});
      }
    }

    getFurnitureParts = async(req:Request,res:Response): Promise <void> =>{
      try{
        const id = parseInt(req.params.id || '0');
        // Validate request parameter
        if(isNaN(id)) {
            res.status(400).json({error: 'Invalid furniture ID'});
            return;
        }
        // Check if the furniture exists in the database
        const exists = await this.furnitureService.furnitureExists(id);
        if (!exists) {
          res.status(404).json({ error: 'Furniture not found' });
          return;
        }
        const parts = await this.furnitureService.getFurnitureParts(id);
        // Handle case where no parts are associated
        if (parts.rows.length === 0) {
          res.status(404).json({ error: 'No parts found for this furniture' });
          return;
        }
        // Success response
        res.status(200).json({
          data: parts.rows
        });
      }catch(error){
        // Catch unexpected errors
        res.status(500).json({error: 'Unable to fetch the parts of the furniture'})
      }
    }

    getFurnitureStepParts = async(req:Request,res:Response): Promise <void> =>{
      try{
        const idFurniture = parseInt(req.params.id || '0');
        const stepNumber = parseInt(req.params.stepId || '0');
        // Validate request parameter
        if(isNaN(idFurniture) || isNaN(stepNumber)) {
            res.status(400).json({error: 'Invalid parameters type'});
            return;
        }
        // Check if the furniture exists in the database
        const existsFurniture = await this.furnitureService.furnitureExists(idFurniture);
        if (!existsFurniture) {
          res.status(404).json({ error: 'Furniture not found' });
          return;
        }
        // Check if the furniture has the step number
        const existsStepNumber = await this.furnitureService.stepExists(idFurniture, stepNumber);
        if (!existsStepNumber) {
          res.status(404).json({ error: 'Step within the furniture not found' });
          return;
        }
        const parts = await this.furnitureService.getFurnitureStepParts(idFurniture, stepNumber);
        // Handle case where no parts are associated
        if (parts.rows.length === 0) {
          res.status(404).json({ error: `No parts found for this furniture´s step` });
          return;
        }
        // Success response
        res.status(200).json({
          data: parts.rows
        });
      }catch(error){
        // Catch unexpected errors
        res.status(500).json({error: `Unable to fetch the parts of the furniture's step`})
      }
    }

  filterFurniture = async (req: Request, res: Response): Promise <void> =>{
  try{
    const { colors, difficulties, provider_ids, category_ids } = req.body;

    const result = await this.furnitureService.getFilteredFurniture({
      colors,
      difficulties,
      provider_ids,
      category_ids
    });
    res.status(200).json({
      message: 'Furniture fetched',
      data: result.rows
    });
    
  }catch(error){
      // Catch unexpected errors
      res.status(500).json({error: `Unable to fetch the parts of the furniture's step`})
    }
  }

}
