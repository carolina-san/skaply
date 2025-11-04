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
  // DUDA: mover al service step? hacer un archivo que sea checkers?
  async stepExists(idFurniture: number, stepNumber: number): Promise<boolean> {
    const result = await pool.query(
      `SELECT 1 FROM public.Assemblystep 
      WHERE id = $1 AND step_number = $2
      LIMIT 1`,
      [idFurniture, stepNumber]
    );
    return result.rows.length > 0;
  }

  async getAllFurniture() {
    try{
        const result = await pool.query('SELECT * FROM public.furniture');
        return result;
    }catch(error){
        throw new Error('Method not implemented');
    }
  }

  // DUDA: Incluye el número de steps, ¿hacemos que tambien se devuelva el nombre de la categoria y el nombre del provider?
  async getFurnitureById(id:number){
    try{
        const result = await pool.query(`
          SELECT f.*, count(*) as total_steps
		      FROM public.furniture f 
          INNER JOIN Assemblystep s ON s.furniture_id = f.id 
          WHERE f.id = $1
		      GROUP BY f.id, f.name, f.file_uri, f.color, f.reference_number, f.category_id, f.provider_id`,
          [id]);
        return result;
    }catch(error){
        throw new Error('Unable to fetch the furniture included in the parameters');
    }
  }

  // DUDA: tiene más sentido que le pasemos por parámtro el nombre de la categoria?
  async getFurnitureByCategory(cat:number){
    try{
      const result = await pool.query('SELECT * FROM public.furniture WHERE category_id = $1',[cat]);
      return result;
    }catch(error){
      throw new Error('Unable to fetch furnitures included in this category');
    }
  }

  async getFurnitureByReference(ref:string){
    try{
      const result = await pool.query('SELECT * FROM public.furniture WHERE reference_number = $1',[ref]);
      return result;
    }catch(error){
      throw new Error('Unable to fetch the furniture included in the reference number');
    }
  }

  // DUDA: tiene más sentido que le pasemos por parámtro el nombre del provider?
  async getFurnitureByProvider(prov:number) {
    try{
        const result = await pool.query('SELECT * FROM public.furniture WHERE provider_id = $1', [prov]);
        return result;
    }catch(error){
        throw new Error('Unable to fetch the furniture included in the provided');
    }
  }

  async getFurnitureByProviderAndCategory(prov:number, cat:number) {
    try{
        const result = await pool.query('SELECT * FROM public.furniture WHERE provider_id = $1 and category_id = $2', [prov, cat]);
        return result;
    }catch(error){
        throw new Error('Unable to fetch the furniture included in the provided');
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

  // DUDA: no tiene sentido hacer getFurnitureSteps porque no hay info relevante del step como tal, no?

  // ERROR: falla cuando el stepNumber está formado por otro step
  async getFurnitureStepParts(idFurniture:number, stepNumber:number){
    try{
      const result = await pool.query(`
      SELECT p.id, quantity, file_uri, color, reference_number
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

  // POR CORREGIR: sacar categoria de este filtro
  async getFilteredFurniture(filters: {
    colors?: string[];
    difficulties?: ('low' | 'medium' | 'high')[];
    provider_ids?: number[];
    category_ids?: number[];
  }) {
    try{
      const { colors, difficulties, provider_ids, category_ids } = filters;

      let sql = "SELECT * FROM public.furniture WHERE 1=1";
      const params: any[] = [];
      let paramIndex = 1; // Shows the number of parameters used

      if (colors && colors.length > 0) {
        sql += ` AND color = ANY($${paramIndex}::text[])`;
        params.push(colors);
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

      const result = await pool.query(sql, params);
      return result;
    }catch(error){
        throw new Error('Error fetching furniture parts')
      }
  }
}
