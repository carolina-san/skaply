import pool from "@/config/database";

export class IssueService{
    async getFurnitureIssues(idFurniture:number){
        try{
            const result = pool.query('SELECT * FROM issue WHERE furniture_id = $1',[idFurniture]);
            return result;
        }catch(error){
           throw new Error('Error fetching furniture issues') 
        }
    }

}