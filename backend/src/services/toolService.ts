import pool from '@config/database'

export class ToolService{
    async getFurnitureTools(ref: string){
        try{
            if(ref != null && ref != ''){
                const result = await pool.query(`SELECT DISTINCT t.id, t.name, t.image_url
                                                FROM Furniture f
                                                JOIN Step s ON f.id = s.furniture_id
                                                JOIN Step_Tool st ON s.id = st.stepId
                                                JOIN Tool t ON st.tool_id = t.id
                                                WHERE f.reference_number = $1`,
                                                [ref]);
                
                return result;
            } else {
                throw new Error('Furniture reference number is required');
            }
        } catch(error){
            console.error('Error in getFurnitureTools:', error);
            throw new Error('No tools found for this furniture');
        }
    }
}