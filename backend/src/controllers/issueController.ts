import { NextFunction, Request, Response } from "express";
import { IssueService } from "@/services/issueService";
import { ApiError } from '@/utils/ApiError';

export class IssueController {
    private issueService: IssueService;

    constructor(issueService?: IssueService) {
        if (issueService) {
            this.issueService = issueService;
        } else {
            this.issueService = new IssueService();
        }
    }


    getFurnitureIssues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id || '0');
            if (isNaN(id)) {
                next(new ApiError('BAD_REQUEST', 'Invalid furniture ID'));
                return;
            }
            const result = await this.issueService.getFurnitureIssues(id);

            if (result.length === 0) {
                next(new ApiError('NOT_FOUND', 'No issues found for this furniture'));
                return;
            }

            res.status(200).json({
                data: result
            });
        } catch (error) {
            next(new ApiError('INTERNAL_SERVER', 'Failed to fetch furniture issues'));
        }
    }

    postIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const furnitureId = parseInt(req.params.id || '0');
            if (isNaN(furnitureId)) {
                next(new ApiError('BAD_REQUEST', 'Invalid furniture ID'));
                return;
            }
            const { description, user_email } = req.body;
            if (!description || !user_email) {
                next(new ApiError('BAD_REQUEST', 'Missing required fields'));
                return;
            }
            const newIssue = await this.issueService.postIssue({ description, user_email, date: new Date().toISOString(), furniture_id: furnitureId });
            res.status(201).json({ data: newIssue });
        } catch (error) {
            next(new ApiError('INTERNAL_SERVER', 'Failed to create issue'));
        }
    }
}