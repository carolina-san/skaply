import { Request, Response } from "express";
import { ReviewService } from "@/services/reviewService";

export class ReviewController{
     private reviewService: ReviewService;
    
      constructor(reviewService?: ReviewService) {
        if (reviewService) {
            this.reviewService = reviewService;
        } else {
            this.reviewService = new ReviewService();
        }
      }


 getFurnitureReviews = async(req:Request, res:Response): Promise<void> =>{
    try{
        const id = parseInt(req.params.id || '0');
        if (isNaN(id)) {
            res.status(400).json({error: 'Invalid furniture ID'});
            return;
        }
        const result = await this.reviewService.getFurnitureReviews(id);
        res.status(200).json({
            data: result.rows
        });
    }catch (error){
        res.status(500).json({error: 'Failed to fetch furniture reviews'})
    }
  }
        
      
}