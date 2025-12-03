import { Request, Response } from "express";
import { IssueService } from "@/services/issueService";

export class IssueController{
     private issueService: IssueService;
    
      constructor(issueService?: IssueService) {
        if (issueService) {
            this.issueService = issueService;
        } else {
            this.issueService = new IssueService();
        }
      }


 getFurnitureIssues = async(req:Request, res:Response): Promise<void> =>{
    try{
        const id = parseInt(req.params.id || '0');
        if (isNaN(id)) {
            res.status(400).json({error: 'Invalid furniture ID'});
            return;
        }
        const result = await this.issueService.getFurnitureIssues(id);
        res.status(200).json({
            data: result.rows
        });
    }catch (error){
        res.status(500).json({error: 'Failed to fetch furniture issues'})
    }
  }   
   
  postIssue = async(req:Request, res:Response): Promise<void> =>{
    try{
        const furnitureId = parseInt(req.params.id || '0');
        if (isNaN(furnitureId)) {
            res.status(400).json({error: 'Invalid furniture ID'});
            return;
        }
        const { description, user_email} = req.body;
        if (!description || !user_email) {
            res.status(400).json({error: 'Missing required fields'});
            return;
        }
        const newIssue = await this.issueService.postIssue(furnitureId, { description, user_email, date: new Date().toISOString() });
        res.status(201).json({ data: newIssue });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create issue' });
    }
}
}