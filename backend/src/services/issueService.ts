import pool from "@/config/database";

import { Issue } from "@/types";

export class IssueService{
    async getFurnitureIssues(idFurniture:number){
        try{
            const result = await pool.query('SELECT * FROM issue WHERE furniture_id = $1',[idFurniture]);
            return result;
        }catch(error){
           throw new Error('Error fetching furniture issues') 
        }
    }

    async postChatbotIssues(issue: Issue){
        try{
            const result = await pool.query(`INSERT INTO public.issue(description,date,user_email,furniture_id) 
            VALUES ($1,$2,$3,$4)`,[issue.description,issue.date,issue.user_email,issue.furniture_id]);
            return result;
        }catch(error){
            throw new Error('Error posting an issue from the chatbot');
        }
    }

}