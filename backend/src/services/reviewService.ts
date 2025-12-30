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

    async createFurnitureReview(furnitureId: number, stars: number, text?: string) {
        try {
            const result = await pool.query(
                `INSERT INTO review (stars, text, furniture_id) 
                 VALUES ($1, $2, $3) 
                 RETURNING *`,
                [stars, text || null, furnitureId]
            );
            return result;
        } catch (error) {
            throw new Error('Error creating furniture review');
        }
    }

}