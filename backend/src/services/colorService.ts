import pool from '@config/database';

export class ColorService {
    
    async getAllColorsFoundInFurniture(){
        try{    
            const result = await pool.query(`
                SELECT DISTINCT c.id, c.name, c.hex
                FROM Color c
                JOIN Furniture f ON f.color_id = c.id`);
            return result;
        }catch(error){
            throw new Error('No colors found in furniture')
        }
    }
};