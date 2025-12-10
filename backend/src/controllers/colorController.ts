import { NextFunction, Request, Response } from 'express';
import { ColorService } from '../services/colorService';
import { ApiError } from '@/utils/ApiError';

export class ColorController {

    private colorService: ColorService

    constructor(colorService?: ColorService) {
        this.colorService = colorService || new ColorService();
    }

    getColors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.colorService.getAllColorsFoundInFurniture()
            res.status(200).json({
                data: result.rows
            })

            if (result.rows.length === 0) {
                next(new ApiError('NOT_FOUND', 'No colors found for this furniture'));
            }
        } catch (error) {
            next(new ApiError('INTERNAL_SERVER', 'Error fetching all colors found in furniture'))
        }
    }
}