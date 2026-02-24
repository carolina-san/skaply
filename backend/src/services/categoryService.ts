import pool from '@config/database';
export class CategoryService {

    async getAllCategories() {
        try {
            const result = await pool.query('SELECT * FROM public.category')
            return result.rows;
        } catch (error) {
            throw new Error('No categories available')
        }
    }

    async getCategoryByName(name: string) {
        try {
            const result = await pool.query('SELECT * FROM public.category WHERE name = $1', [name]);
            return result.rows[0];
        } catch (error) {
            throw new Error('Category not found');
        }
    }

    async getCategoryById(id: number) {
        try {
            const result = await pool.query('SELECT * FROM public.category WHERE id = $1', [id]);
            return result.rows[0];
        } catch (error) {
            throw new Error('Category not found');
        }
    }
}
