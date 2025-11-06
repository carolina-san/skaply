import { Request, Response } from 'express';
import {ColorService} from '../services/colorService';

export class ColorController{
   
    private colorService: ColorService

    constructor(colorService?: ColorService) {
        this.colorService = colorService || new ColorService();
    }

    getColors =  async(req:Request,res:Response):Promise <void> =>{
        try{
            const result = await this.colorService.getAllColorsFoundInFurniture()
            res.status(200).json({
                data: result.rows
            })
        }catch(error){
            res.status(500).json({error:'Error fetching all colors found in furniture'})
        }
    }
}