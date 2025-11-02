import pool from "@/config/database";

export class ReviewService{
    async getFurnitureReviews(idFurniture:number){
        try{
            const result = pool.query('SELECT * FROM review WHERE furniture_id = $1',[idFurniture]);
            return result;
        }catch(error){
           throw new Error('Error fetching furniture reviews') 
        }
    }

}