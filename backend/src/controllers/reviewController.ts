import { NextFunction, Request, Response } from "express";
import { ReviewService } from "@/services/reviewService";
import { FurnitureService } from '@/services/furnitureService'
import { ApiError } from '@/utils/ApiError';

export class ReviewController {
    private reviewService: ReviewService;
    private furnitureService: FurnitureService;

    constructor(reviewService?: ReviewService, furnitureService?: FurnitureService) {
        if (reviewService) {
            this.reviewService = reviewService;
        } else {
            this.reviewService = new ReviewService();
        }
        if (furnitureService) {
            this.furnitureService = furnitureService;
        } else {
            this.furnitureService = new FurnitureService();
        }
    }


    getFurnitureReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id || '0');
            if (isNaN(id)) {
                next(new ApiError('BAD_REQUEST', 'Invalid furniture ID'));
                return;
            }
            const result = await this.reviewService.getFurnitureReviews(id);

            // Si no hay reseñas, devolvemos 200 con array vacío (no es un error)
            res.status(200).json({
                data: result
            });
        } catch (error) {
            next(new ApiError('INTERNAL_SERVER', 'Failed to fetch furniture reviews'));
        }
    }

    createFurnitureReview = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const furnitureId = Number(req.params.id);
            const { stars, text } = req.body;

            if (!furnitureId || isNaN(furnitureId)) {
                return next(new ApiError('BAD_REQUEST', 'Valid furniture ID is required'));
            }

            if (stars === undefined) {
                return next(new ApiError('BAD_REQUEST', 'Stars are required'));
            }

            const furniture = await this.furnitureService.getFurnitureById(furnitureId);
            if (!furniture || furniture === null) {
                throw new ApiError('NOT_FOUND', 'Furniture not found');
            }

            const newReview = await this.reviewService.createFurnitureReview(furnitureId, stars, text);

            res.status(201).json({
                message: 'Review created successfully',
                data: newReview
            });
        } catch (error) {
            next(error);
        }
    };


}