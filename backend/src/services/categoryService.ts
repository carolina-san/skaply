import pool from '@config/database';
export class CategoryService {
    
    async getAllCategories(){
        try{    
            const result = await pool.query('SELECT * FROM public.category')
            return result;
        }catch(error){
            throw new Error('No categories available')
        }
    }
}
