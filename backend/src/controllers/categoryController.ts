import { Request, Response } from 'express';
import {CategoryService} from '../services/categoryService'

export class CategoryController{
    private categoryService: CategoryService

    constructor(categoryService?: CategoryService) {
        this.categoryService = categoryService || new CategoryService();
    }

    getCategories =  async(req:Request,res:Response):Promise <void> =>{
        try{
            const result = await this.categoryService.getAllCategories()
            res.status(200).json({
                data: result.rows
            })
        }catch(error){
            res.status(500).json({error:'Error fetching all categories'})
        }
    }
}