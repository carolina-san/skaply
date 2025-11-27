import pool from '@config/database';

export class FurnitureService {
  
  // Checks if the furniture id is valid
  async furnitureExists(id: number): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM public.furniture WHERE id = $1 LIMIT 1',
      [id]
    );
    return result.rows.length > 0;
  }

  // Checks if the furniture step number is valid
  async stepExists(idFurniture: number, stepNumber: number): Promise<boolean> {
    const result = await pool.query(
      `SELECT 1 FROM public.Step 
      WHERE id = $1 AND step_number = $2
      LIMIT 1`,
      [idFurniture, stepNumber]
    );
    return result.rows.length > 0;
  }

  async getAllFurniture() {
    try{
        const result = await pool.query(`
          SELECT DISTINCT 
              f.id, 
              f.name, 
              f.file_uri, 
              f.reference_number, 
              f.category_id, 
              c.name AS category_name, 
              f.provider_id, 
              p.company_name as provider_name, 
              f.color_id, 
              cl.name AS color_name,
              cl.hex AS color_hex,
              f.difficulty,
              f.short_description
          FROM public.furniture f
          INNER JOIN Step s ON s.furniture_id = f.id
          INNER JOIN Category c ON f.category_id = c.id
          INNER JOIN "User" p ON f.provider_id = p.id
          INNER JOIN Color cl ON f.color_id = cl.id`);
        return result;
    }catch(error){
      console.error('getAllFurniture error:', error);
      throw error;
    }
  }

  // DUDA: Incluye el número de steps, ¿hacemos que tambien se devuelva el nombre de la categoria y el nombre del provider?
  async getFurnitureById(id:number){
    try{
        const result = await pool.query(`
          SELECT 
              f.id, 
              f.name, 
              f.file_uri, 
              f.reference_number, 
              f.category_id, 
              c.name AS category_name, 
              f.provider_id, 
              p.company_name as provider_name, 
              f.color_id, 
              cl.name AS color_name,
              cl.hex AS color_hex,
              f.difficulty,
              f.short_description
              COUNT(*) AS total_steps
          FROM public.furniture f
          INNER JOIN Step s ON s.furniture_id = f.id
          INNER JOIN Category c ON f.category_id = c.id
          INNER JOIN "User" p ON f.provider_id = p.id
          INNER JOIN Color cl ON f.color_id = cl.id
          WHERE f.id = $1
          GROUP BY 
              f.id, 
              f.name, 
              f.file_uri, 
              f.reference_number, 
              f.category_id, 
              c.name, 
              f.provider_id, 
              p.company_name, 
              f.color_id, 
              f.short_description,
              cl.name;`,
          [id]);
        return result;
    }catch(error){
        throw new Error('Unable to fetch the furniture included in the parameters');
    }
  }
 
  async getFurnitureParts(id:number){
    try{
      const result = await pool.query(`
      SELECT *
      FROM 
        furniture_part fp
      JOIN
        part p ON fp.part_id = p.id
      WHERE
        fp.furniture_id = $1`
      ,[id]);

      return result;
    }catch(error){
      throw new Error('Error fetching furniture parts')
    }
  }

  // ERROR: falla cuando el stepNumber está formado por otro step
  async getFurnitureStepParts(idFurniture:number, stepNumber:number){
    try{
      const result = await pool.query(`
      SELECT p.id, quantity, file_uri, reference_number, color_id
      FROM 
        Step_Part sp
      JOIN
        Part p ON sp.part_id = p.id
	    JOIN
        Step s ON s.id = sp.stepId
      WHERE
        s.furniture_id = $1 AND s.step_number = $2`,
      [idFurniture, stepNumber]);
      return result;
    }catch(error){
      throw new Error('Error fetching furniture parts')
    }
  }


  async getFilteredFurniture(filters: {
    difficulties?: ('low' | 'medium' | 'high')[];
    provider_ids?: number[];
    category_ids?: number[];
    color_ids: number[];
    search?: string;
  }) {
    try{
      const { difficulties, provider_ids, category_ids, color_ids, search } = filters;

      let sql = `
        SELECT DISTINCT 
            f.id, 
            f.name, 
            f.file_uri, 
            f.reference_number, 
            f.category_id, 
            c.name AS category_name, 
            f.provider_id, 
            p.company_name as provider_name, 
            f.color_id, 
            cl.name AS color_name,
            cl.hex AS color_hex,
            f.difficulty,
            f.short_description
        FROM public.furniture f
        INNER JOIN Step s ON s.furniture_id = f.id
        INNER JOIN Category c ON f.category_id = c.id
        INNER JOIN "User" p ON f.provider_id = p.id
        INNER JOIN Color cl ON f.color_id = cl.id
        WHERE 1=1`;
      const params: any[] = [];
      let paramIndex = 1; // Shows the number of parameters used

      if (color_ids && color_ids.length > 0) {
        sql += ` AND color_id = ANY($${paramIndex}::int[])`;
        params.push(color_ids);
        paramIndex++;
      }

      if (difficulties && difficulties.length > 0) {
        sql += ` AND difficulty = ANY($${paramIndex}::diff[])`;
        params.push(difficulties);
        paramIndex++;
      }

      if (provider_ids && provider_ids.length > 0) {
        sql += ` AND provider_id = ANY($${paramIndex}::int[])`;
        params.push(provider_ids);
        paramIndex++;
      }

      if (category_ids && category_ids.length > 0) {
        sql += ` AND category_id = ANY($${paramIndex}::int[])`;
        params.push(category_ids);
        paramIndex++;
      }

      if (search && search.trim() !== '') {
        sql += ` AND (f.name ILIKE $${paramIndex} OR f.reference_number ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      const result = await pool.query(sql, params);
      return result;
    }catch(error){
        throw new Error('Error fetching furniture parts')
      }
  }

  async getFurnitureIdByRef(ref:number){
    try{
      const result = await pool.query(`SELECT id FROM furniture 
        WHERE reference_number = $1`, [ref]);
      
      if (result.rows.length === 0) {
        throw new Error(`Furniture with reference ${ref} not found`);
      }
      
      return result.rows[0].id;
    }catch(error){
      throw new Error('Error fetching the furniture id by the ref provided');
    }
  }

    // Devuelve toda la iformación necesaria para el motor gráfico
  async getFurnitureAssembly(furnitureId: number) {
    try {
      const query = `
        SELECT
          s.id AS step_id,
          s.step_number,
          s.used_in_step_with_id,
          json_agg(
            DISTINCT jsonb_build_object(
              'part_id', p.id,
              'reference_number', p.reference_number,
              'file_uri', p.file_uri,
              'color_id', p.color_id,
              'quantity', sp.quantity
            )
          ) FILTER (WHERE p.id IS NOT NULL) AS parts,
          json_agg(
            DISTINCT jsonb_build_object(
              'tool_id', t.id,
              'name', t.name
            )
          ) FILTER (WHERE t.id IS NOT NULL) AS tools
        FROM Step s
        LEFT JOIN Step_Part sp ON sp.stepId = s.id
        LEFT JOIN Part p ON p.id = sp.part_id
        LEFT JOIN Step_Tool st ON st.stepId = s.id
        LEFT JOIN Tool t ON t.id = st.tool_id
        WHERE s.furniture_id = $1
        GROUP BY s.id, s.step_number, s.used_in_step_with_id
        ORDER BY s.step_number ASC
      `;

      const result = await pool.query(query, [furnitureId]);

      // Transformar los datos
      const steps = result.rows.map(row => ({
        step_id: row.step_id,
        step_number: row.step_number,
        used_in_step_with_id: row.used_in_step_with_id,
        parts: row.parts || [],
        tools: row.tools || []
      }));

      return {
        furniture_id: furnitureId,
        steps
      };
    } catch (error) {
      console.error('Error fetching furniture assembly:', error);
      throw new Error('Error fetching furniture assembly');
    }
  }
}
