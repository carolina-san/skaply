import { NextFunction, Request, Response } from "express";
import { ReviewService } from "@/services/reviewService";
import { ApiError } from '@/utils/ApiError';

export class ReviewController {
    private reviewService: ReviewService;

    constructor(reviewService?: ReviewService) {
        if (reviewService) {
            this.reviewService = reviewService;
        } else {
            this.reviewService = new ReviewService();
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

            if (result.rows.length === 0) {
                next(new ApiError('NOT_FOUND', 'No reviews found for this furniture'));
                return;
            }

            res.status(200).json({
                data: result.rows
            });
        } catch (error) {
            next(new ApiError('INTERNAL_SERVER', 'Failed to fetch furniture reviews'));
        }
    }


}