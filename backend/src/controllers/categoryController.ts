import { NextFunction, Request, Response } from 'express';
import { CategoryService } from '../services/categoryService'
import { ApiError } from '@/utils/ApiError';

export class CategoryController {
    private categoryService: CategoryService

    constructor(categoryService?: CategoryService) {
        this.categoryService = categoryService || new CategoryService();
    }

    getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.categoryService.getAllCategories()
            res.status(200).json({
                data: result
            })
        } catch (error) {
            next(new ApiError('INTERNAL_SERVER', 'Error fetching all categories'));
        }
    }

    getCategoryByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const name: string = req.params.name ? req.params.name : '';
            const result = await this.categoryService.getCategoryByName(name);
            res.status(200).json({
                data: result
            });
        } catch (error) {
            next(new ApiError('NOT_FOUND', 'Category not found'));
        }
    };

    getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id: number = req.params.id ? parseInt(req.params.id) : 0;
            const result = await this.categoryService.getCategoryById(id);
            res.status(200).json({
                data: result
            });
        } catch (error) {
            next(new ApiError('NOT_FOUND', 'Category not found'));
        }
    };
}