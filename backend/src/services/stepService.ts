import pool from '@config/database';

export class StepService {
    
    async getStepParts(cat:number){
        try{
        const result = await pool.query('SELECT * FROM public.furniture WHERE category_id = $1',[cat]);
        return result;
        }catch(error){
        throw new Error('Unable to fetch furnitures included in this category');
        }
    }



}
