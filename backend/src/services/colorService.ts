import pool from '@config/database';

export class ColorService {

    async getAllColors() {
        try {
            const result = await pool.query(`
                SELECT id, name, hex
                FROM Color
                ORDER BY name ASC`);
            return result.rows;
        } catch (error) {
            throw new Error('Error fetching colors')
        }
    }

    async getAllColorsFoundInFurniture() {
        try {
            const result = await pool.query(`
                SELECT DISTINCT c.id, c.name, c.hex
                FROM Color c
                JOIN Furniture f ON f.color_id = c.id`);
            return result.rows;
        } catch (error) {
            throw new Error('No colors found in furniture')
        }
    }

    async getColorByName(name: string) {
        try {
            const result = await pool.query('SELECT * FROM public.color WHERE LOWER(TRANSLATE(name, \'áéíóúÁÉÍÓÚ\', \'aeiouaeiou\')) = LOWER(TRANSLATE($1, \'áéíóúÁÉÍÓÚ\', \'aeiouaeiou\'))', [name]);
            return result.rows[0];
        } catch (error) {
            throw new Error('Color not found');
        }
    }
};